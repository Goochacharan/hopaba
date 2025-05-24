
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import StarRating from '@/components/marketplace/StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

interface BusinessRatingOverviewProps {
  avgRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
  criteriaRatings?: Record<string, number>;
}

const BusinessRatingOverview: React.FC<BusinessRatingOverviewProps> = ({
  avgRating,
  totalReviews,
  ratingDistribution,
  criteriaRatings = {}
}) => {
  const [criteriaNames, setCriteriaNames] = useState<{[key: string]: string}>({});
  
  // Fetch criteria names on component mount
  useEffect(() => {
    const fetchCriteriaNames = async () => {
      const criterionIds = Object.keys(criteriaRatings);
      if (criterionIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('review_criteria')
          .select('id, name')
          .in('id', criterionIds);
        
        if (error) {
          throw error;
        }
        
        const namesMap: {[key: string]: string} = {};
        data?.forEach(criterion => {
          namesMap[criterion.id] = criterion.name;
        });
        
        // For any criteria without names in the database, use fallback names
        criterionIds.forEach(id => {
          if (!namesMap[id]) {
            namesMap[id] = getFallbackName(id);
          }
        });
        
        setCriteriaNames(namesMap);
      } catch (err) {
        console.error('Error fetching criteria names:', err);
        
        // If fetching fails, set fallback names for all criteria
        const fallbackNames: {[key: string]: string} = {};
        Object.keys(criteriaRatings).forEach(id => {
          fallbackNames[id] = getFallbackName(id);
        });
        setCriteriaNames(fallbackNames);
      }
    };
    
    fetchCriteriaNames();
  }, [criteriaRatings]);
  
  // Helper function to get fallback name for criterion ID
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex">
          <StarRating 
            rating={avgRating} 
            count={totalReviews} 
            showCount={true} 
            size="large"
          />
        </div>
      </div>
      
      {/* Rating distribution bars */}
      <div className="space-y-2">
        {ratingDistribution.map(item => (
          <div key={item.rating} className="flex items-center gap-2">
            <span className="w-12 text-sm">{item.rating} star</span>
            <Progress value={item.percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {item.count}
            </span>
          </div>
        ))}
      </div>
      
      {/* Criteria ratings */}
      {Object.keys(criteriaRatings).length > 0 && (
        <div className="space-y-3 mt-6">
          <h3 className="text-lg font-semibold">Detailed Ratings</h3>
          {Object.entries(criteriaRatings).map(([criterionId, rating]) => (
            <div key={criterionId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">
                  {criteriaNames[criterionId] || getFallbackName(criterionId)}
                </span>
                <span className="font-medium">{rating.toFixed(1)}/10</span>
              </div>
              <Progress 
                value={rating * 10} 
                className="h-2" 
                style={{ "--progress-color": `hsl(${rating * 12}, 90%, 45%)` } as React.CSSProperties} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessRatingOverview;
