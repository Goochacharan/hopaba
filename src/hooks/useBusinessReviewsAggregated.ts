import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessReviewAggregation {
  business_id: string;
  average_rating: number;
  review_count: number;
  average_criteria_ratings: Record<string, number>;
}

export const useBusinessReviewsAggregated = (businessIds: string[]) => {
  return useQuery({
    queryKey: ['business-reviews-aggregated', businessIds.sort()],
    queryFn: async (): Promise<Record<string, BusinessReviewAggregation>> => {
      if (businessIds.length === 0) return {};

      // Fetch aggregated review data for all businesses including criteria ratings
      const { data, error } = await supabase
        .from('business_reviews')
        .select('business_id, rating, criteria_ratings')
        .in('business_id', businessIds);

      if (error) {
        console.error('Error fetching aggregated business reviews:', error);
        throw error;
      }

      // Calculate aggregations
      const aggregations: Record<string, BusinessReviewAggregation> = {};
      
      // Initialize all businesses with zero values
      businessIds.forEach(id => {
        aggregations[id] = {
          business_id: id,
          average_rating: 0,
          review_count: 0,
          average_criteria_ratings: {}
        };
      });

      // Group reviews by business_id and calculate averages
      const reviewsByBusiness = data.reduce((acc, review) => {
        if (!acc[review.business_id]) {
          acc[review.business_id] = [];
        }
        acc[review.business_id].push(review);
        return acc;
      }, {} as Record<string, any[]>);

      // Calculate average rating, count, and criteria ratings for each business
      Object.entries(reviewsByBusiness).forEach(([businessId, reviews]) => {
        const ratings = reviews.map(r => r.rating);
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;
        
        // Calculate aggregated criteria ratings
        const aggregatedCriteriaRatings: Record<string, number[]> = {};
        
        reviews.forEach(review => {
          if (review.criteria_ratings) {
            Object.entries(review.criteria_ratings).forEach(([criterionId, rating]) => {
              if (!aggregatedCriteriaRatings[criterionId]) {
                aggregatedCriteriaRatings[criterionId] = [];
              }
              aggregatedCriteriaRatings[criterionId].push(rating as number);
            });
          }
        });
        
        // Calculate average for each criterion
        const averageCriteriaRatings: Record<string, number> = {};
        Object.entries(aggregatedCriteriaRatings).forEach(([criterionId, ratings]) => {
          const sum = ratings.reduce((acc, val) => acc + val, 0);
          averageCriteriaRatings[criterionId] = sum / ratings.length;
        });
        
        aggregations[businessId] = {
          business_id: businessId,
          average_rating: averageRating,
          review_count: reviews.length,
          average_criteria_ratings: averageCriteriaRatings
        };
      });

      return aggregations;
    },
    enabled: businessIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}; 