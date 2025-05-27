import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Award, Gem } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
interface ReviewFormProps {
  businessId: string;
  businessName: string;
  businessCategory?: string;
  onReviewSubmit: (review: {
    rating: number;
    text: string;
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
const BusinessReviewForm: React.FC<ReviewFormProps> = ({
  businessId,
  businessName,
  businessCategory,
  onReviewSubmit
}) => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isMustVisit, setIsMustVisit] = useState(false);
  const [isHiddenGem, setIsHiddenGem] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Criteria for rating
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});

  // Fetch criteria based on business category
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!businessCategory || !showForm) return;
      try {
        const {
          data,
          error
        } = await supabase.from('review_criteria').select('*').eq('category', businessCategory);
        if (error) throw error;
        setCriteria(data || []);

        // Initialize ratings
        const initialRatings: Record<string, number> = {};
        data?.forEach(criterion => {
          initialRatings[criterion.id] = 7; // Default to 7/10
        });
        setCriteriaRatings(initialRatings);
      } catch (err) {
        console.error('Error fetching review criteria:', err);
      }
    };
    fetchCriteria();
  }, [businessCategory, showForm]);
  const handleCriterionRating = (criterionId: string, value: number) => {
    setCriteriaRatings(prev => ({
      ...prev,
      [criterionId]: value
    }));
  };
  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to submit a review",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }
    if (!reviewText.trim()) {
      toast({
        title: "Review text required",
        description: "Please share your experience",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      await onReviewSubmit({
        rating,
        text: reviewText,
        isMustVisit,
        isHiddenGem,
        criteriaRatings
      });

      // Reset form
      setRating(0);
      setReviewText('');
      setIsMustVisit(false);
      setIsHiddenGem(false);
      setShowForm(false);
      toast({
        title: "Review submitted",
        description: "Thank you for sharing your experience!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 my-0 px-[219px] py-0">
        
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} size="sm" className="px-[15px]">
          {showForm ? "Cancel" : "Write Review"}
        </Button>
      </CardHeader>
      
      {showForm && <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Your rating for {businessName}</p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" onClick={() => setRating(value)} className="focus:outline-none">
                    <Star className={`w-6 h-6 ${value <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                  </button>)}
              </div>
            </div>

            {/* Criteria-based ratings */}
            {criteria.length > 0 && <div className="space-y-3">
                <p className="text-sm font-medium mb-1">Rate specific aspects</p>
                
                {criteria.map(criterion => <div key={criterion.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{criterion.name}</span>
                      <span className="font-medium">{criteriaRatings[criterion.id] || 7}/10</span>
                    </div>
                    <input type="range" min="1" max="10" value={criteriaRatings[criterion.id] || 7} onChange={e => handleCriterionRating(criterion.id, parseInt(e.target.value))} className="w-full" />
                  </div>)}
              </div>}
            
            <div>
              <p className="text-sm font-medium mb-2">Share your experience</p>
              <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} className="w-full p-2 border rounded-md h-24" placeholder="What did you like or dislike about this business?" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-2">
              <Toggle pressed={isMustVisit} onPressedChange={setIsMustVisit} className={`flex gap-2 items-center ${isMustVisit ? 'bg-green-500 text-white' : ''}`}>
                <Award className={`w-4 h-4 ${isMustVisit ? 'text-white' : ''}`} />
                Must Visit
              </Toggle>
              
              <Toggle pressed={isHiddenGem} onPressedChange={setIsHiddenGem} className={`flex gap-2 items-center ${isHiddenGem ? 'bg-purple-500 text-white' : ''}`}>
                <Gem className={`w-4 h-4 ${isHiddenGem ? 'text-white' : ''}`} />
                Hidden Gem
              </Toggle>
            </div>
            
            <Button onClick={handleSubmitReview} disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </CardContent>}
    </Card>;
};
export default BusinessReviewForm;