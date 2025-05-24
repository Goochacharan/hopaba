import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Star, Award, Gem } from 'lucide-react';
import { BusinessReview } from '@/hooks/useBusinessDetail';
import RatingProgressBars from '@/components/RatingProgressBars';
import { supabase } from '@/integrations/supabase/client';

interface BusinessReviewsProps {
  businessName: string;
  businessCategory?: string;
  reviews: BusinessReview[];
  onAddReview: (review: {
    rating: number;
    text?: string;
    isMustVisit?: boolean;
    isHiddenGem?: boolean;
    criteriaRatings?: Record<string, number>;
  }) => Promise<void>;
}

interface ReviewCriterion {
  id: string;
  name: string;
  category: string;
}

const BusinessReviews: React.FC<BusinessReviewsProps> = ({
  businessName,
  businessCategory,
  reviews,
  onAddReview
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0); // Starting with 0 (empty stars)
  const [reviewText, setReviewText] = useState('');
  const [isMustVisit, setIsMustVisit] = useState(false);
  const [isHiddenGem, setIsHiddenGem] = useState(false);
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  
  // Fetch criteria based on business category
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!businessCategory) return;
      
      const { data, error } = await supabase
        .from('review_criteria')
        .select('*')
        .eq('category', businessCategory);
      
      if (error) {
        console.error('Error fetching criteria:', error);
        return;
      }
      
      setCriteria(data || []);
      
      // Initialize ratings for each criterion
      const initialRatings: Record<string, number> = {};
      data?.forEach(criterion => {
        initialRatings[criterion.id] = 7; // Default to 7/10
      });
      
      setCriteriaRatings(initialRatings);
    };
    
    fetchCriteria();
  }, [businessCategory]);
  
  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  
  // Count reviews by rating
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => {
    return {
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 
        ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
        : 0
    };
  });

  // Calculate aggregated criteria ratings from all reviews
  const aggregatedCriteriaRatings = React.useMemo(() => {
    const allRatings: Record<string, number[]> = {};
    
    reviews.forEach(review => {
      if (review.criteriaRatings) {
        Object.entries(review.criteriaRatings).forEach(([criterionId, rating]) => {
          if (!allRatings[criterionId]) {
            allRatings[criterionId] = [];
          }
          allRatings[criterionId].push(rating);
        });
      }
    });
    
    // Calculate average for each criterion
    const averageRatings: Record<string, number> = {};
    Object.entries(allRatings).forEach(([criterionId, ratings]) => {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      averageRatings[criterionId] = sum / ratings.length;
    });
    
    return averageRatings;
  }, [reviews]);
  
  const handleCriteriaRatingChange = (criterionId: string, value: number) => {
    setCriteriaRatings(prev => ({
      ...prev,
      [criterionId]: value
    }));
  };
  
  const handleAddReview = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to leave a review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (!reviewText.trim()) {
      toast({
        title: "Review text required",
        description: "Please share your experience",
        variant: "destructive",
      });
      return;
    }
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onAddReview({
        rating,
        text: reviewText,
        isMustVisit,
        isHiddenGem,
        criteriaRatings
      });
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      setShowReviewForm(false);
      setRating(0);
      setReviewText('');
      setIsMustVisit(false);
      setIsHiddenGem(false);
      // Reset criteria ratings
      const resetRatings: Record<string, number> = {};
      criteria.forEach(c => {
        resetRatings[c.id] = 7;
      });
      setCriteriaRatings(resetRatings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Reviews</span>
          <Button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            size="sm"
          >
            {showReviewForm ? "Cancel" : "Write a Review"}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {showReviewForm && (
          <div className="mb-6 p-4 bg-secondary/10 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Share your experience</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Rating</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          value <= rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-300"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria-based ratings */}
              {criteria.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium mb-1">Rate specific aspects</p>
                  
                  {criteria.map(criterion => (
                    <div key={criterion.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{criterion.name}</span>
                        <span className="font-medium">{criteriaRatings[criterion.id] || 7}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={criteriaRatings[criterion.id] || 7}
                        onChange={(e) => handleCriteriaRatingChange(criterion.id, parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium mb-2">Your experience</p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Share your experience with this business..."
                />
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  type="button"
                  variant={isMustVisit ? "default" : "outline"}
                  onClick={() => setIsMustVisit(!isMustVisit)}
                  className="flex gap-2 items-center"
                >
                  <Award className="w-4 h-4" />
                  Must Visit
                </Button>
                
                <Button
                  type="button"
                  variant={isHiddenGem ? "default" : "outline"}
                  onClick={() => setIsHiddenGem(!isHiddenGem)}
                  className="flex gap-2 items-center"
                >
                  <Gem className="w-4 h-4" />
                  Hidden Gem
                </Button>
              </div>
              
              <Button onClick={handleAddReview}>Submit Review</Button>
            </div>
          </div>
        )}
        
        {/* Rating summary */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(avgRating)
                      ? "text-amber-500 fill-amber-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length} reviews)</span>
          </div>
          
          <div className="space-y-2">
            {ratingCounts.map(item => (
              <div key={item.rating} className="flex items-center gap-2">
                <span className="w-12 text-sm">{item.rating} star</span>
                <Progress value={item.percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Criteria ratings visualization */}
        {businessCategory && Object.keys(aggregatedCriteriaRatings).length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-2">Detailed Ratings</h4>
            <RatingProgressBars 
              criteriaRatings={aggregatedCriteriaRatings}
              locationId={businessCategory}
            />
          </div>
        )}
        
        {/* Reviews list */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="border-t pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{review.name}</h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {review.date}
                      </span>
                    </div>
                    
                    {/* Badges */}
                    {(review.isMustVisit || review.isHiddenGem) && (
                      <div className="flex space-x-2 mt-2">
                        {review.isMustVisit && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Must Visit
                          </span>
                        )}
                        {review.isHiddenGem && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            Hidden Gem
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Display criteria ratings if available */}
                {review.criteriaRatings && Object.keys(review.criteriaRatings).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-muted-foreground mb-1">Detailed ratings:</p>
                    {Object.entries(review.criteriaRatings).map(([criterionId, rating]) => {
                      // Find criterion name if available
                      const criterion = criteria.find(c => c.id === criterionId);
                      return (
                        <div key={criterionId} className="flex items-center gap-2">
                          <div className="text-xs w-24 truncate capitalize">
                            {criterion?.name || criterionId}
                          </div>
                          <Progress value={rating * 10} className="h-2 flex-1" />
                          <div className="text-xs font-medium">{rating}/10</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {review.text && (
                  <p className="mt-2 text-sm">{review.text}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessReviews;
