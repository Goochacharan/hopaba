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
  const [criteriaNames, setCriteriaNames] = useState<{
    [key: string]: string;
  }>({});

  // Fetch criteria names on component mount
  useEffect(() => {
    const fetchCriteriaNames = async () => {
      const criterionIds = Object.keys(criteriaRatings);
      if (criterionIds.length === 0) return;
      try {
        const {
          data,
          error
        } = await supabase.from('review_criteria').select('id, name').in('id', criterionIds);
        if (error) {
          throw error;
        }
        const namesMap: {
          [key: string]: string;
        } = {};
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
        const fallbackNames: {
          [key: string]: string;
        } = {};
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
    return criterionId.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating & Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              <StarRating rating={avgRating} size="sm" />
              <div className="text-sm text-muted-foreground mt-1">
                {totalReviews} reviews
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="text-sm w-8">{item.rating}★</span>
                <Progress value={item.percentage} className="flex-1" />
                <span className="text-sm text-muted-foreground w-8">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Criteria Ratings */}
          {Object.keys(criteriaRatings).length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Detailed Ratings</h4>
              {Object.entries(criteriaRatings).map(([criterionId, rating]) => (
                <div key={criterionId} className="flex items-center justify-between">
                  <span className="text-sm">
                    {criteriaNames[criterionId] || getFallbackName(criterionId)}
                  </span>
                  <div className="flex items-center gap-2">
                    <StarRating rating={rating} size="sm" />
                    <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessRatingOverview;
