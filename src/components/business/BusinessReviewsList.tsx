
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'; 
import StarRating from '@/components/marketplace/StarRating';
import { BusinessReview } from '@/hooks/useBusinessDetail';
import { supabase } from '@/integrations/supabase/client';

interface BusinessReviewsListProps {
  reviews: BusinessReview[];
}

const BusinessReviewsList: React.FC<BusinessReviewsListProps> = ({ reviews }) => {
  const [criteriaNames, setCriteriaNames] = useState<{[key: string]: string}>({});
  
  // Get all unique criteria IDs from all reviews
  const allCriteriaIds = React.useMemo(() => {
    const ids = new Set<string>();
    reviews.forEach(review => {
      if (review.criteriaRatings) {
        Object.keys(review.criteriaRatings).forEach(id => ids.add(id));
      }
    });
    return Array.from(ids);
  }, [reviews]);

  // Fetch criteria names from the database
  useEffect(() => {
    const fetchCriteriaNames = async () => {
      if (allCriteriaIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('review_criteria')
          .select('id, name')
          .in('id', allCriteriaIds);
        
        if (error) {
          throw error;
        }
        
        const namesMap: {[key: string]: string} = {};
        data?.forEach(criterion => {
          namesMap[criterion.id] = criterion.name;
        });
        
        // For any missing criteria, provide a fallback name
        allCriteriaIds.forEach(id => {
          if (!namesMap[id]) {
            namesMap[id] = getFallbackName(id);
          }
        });
        
        setCriteriaNames(namesMap);
      } catch (err) {
        console.error('Error fetching criteria names:', err);
        
        // Set fallback names if fetch fails
        const fallbackNames: {[key: string]: string} = {};
        allCriteriaIds.forEach(id => {
          fallbackNames[id] = getFallbackName(id);
        });
        setCriteriaNames(fallbackNames);
      }
    };
    
    fetchCriteriaNames();
  }, [allCriteriaIds]);
  
  // Helper function to format criterion ID to readable name
  const getFallbackName = (criterionId: string): string => {
    const id = criterionId.toLowerCase();
    if (id.includes('amb')) return 'Ambience';
    if (id.includes('tast') || id.includes('food')) return 'Taste';
    if (id.includes('price') || id.includes('val')) return 'Price';
    if (id.includes('hyg') || id.includes('clean')) return 'Hygiene';
    if (id.includes('serv')) return 'Service';
    return criterionId.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reviews yet. Be the first to share your experience!
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {reviews.map(review => (
        <div key={review.id} className="border-b pb-4 last:border-b-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{review.name}</h4>
              <div className="flex items-center mt-1">
                <StarRating rating={review.rating} showCount={false} className="mr-2" />
                <span className="text-muted-foreground text-xs">{review.date}</span>
              </div>
              
              {/* Badges */}
              {(review.isMustVisit || review.isHiddenGem) && (
                <div className="flex space-x-2 mt-2">
                  {review.isMustVisit && (
                    <Badge variant="success">Must Visit</Badge>
                  )}
                  {review.isHiddenGem && (
                    <Badge>Hidden Gem</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Display criteria ratings if available */}
          {review.criteriaRatings && Object.keys(review.criteriaRatings).length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground mb-1">Detailed ratings:</p>
              {Object.entries(review.criteriaRatings).map(([criterionId, rating]) => (
                <div key={criterionId} className="flex items-center gap-2">
                  <div className="text-xs w-24 truncate capitalize">
                    {criteriaNames[criterionId] || getFallbackName(criterionId)}
                  </div>
                  <Progress 
                    value={rating * 10} 
                    className="h-2 flex-1" 
                    style={{ "--progress-color": `hsl(${rating * 12}, 90%, 45%)` } as React.CSSProperties}
                  />
                  <div className="text-xs font-medium">{rating}/10</div>
                </div>
              ))}
            </div>
          )}
          
          {review.text && (
            <p className="mt-2 text-sm">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BusinessReviewsList;
