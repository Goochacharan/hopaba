import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

export interface BusinessReview {
  id: string;
  business_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  text?: string;
  is_must_visit?: boolean;
  is_hidden_gem?: boolean;
  criteria_ratings?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessReviewData {
  business_id: string;
  rating: number;
  text?: string;
  is_must_visit?: boolean;
  is_hidden_gem?: boolean;
  criteria_ratings?: Record<string, number>;
}

export interface UpdateBusinessReviewData {
  rating?: number;
  text?: string;
  is_must_visit?: boolean;
  is_hidden_gem?: boolean;
  criteria_ratings?: Record<string, number>;
}

export const useBusinessReviews = (businessId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all reviews for a business
  const {
    data: reviews = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['business-reviews', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching business reviews:', error);
        throw error;
      }

      return data as BusinessReview[];
    },
    enabled: !!businessId,
    staleTime: 30000, // 30 seconds
  });

  // Get user's review for this business
  const userReview = user ? reviews.find(review => review.user_id === user.id) : null;

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Calculate criteria ratings
  const aggregatedCriteriaRatings = reviews.reduce((acc, review) => {
    if (review.criteria_ratings) {
      Object.entries(review.criteria_ratings).forEach(([criterionId, rating]) => {
        if (!acc[criterionId]) {
          acc[criterionId] = { total: 0, count: 0 };
        }
        acc[criterionId].total += rating;
        acc[criterionId].count += 1;
      });
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const averageCriteriaRatings = Object.entries(aggregatedCriteriaRatings).reduce((acc, [criterionId, { total, count }]) => {
    acc[criterionId] = count > 0 ? total / count : 0;
    return acc;
  }, {} as Record<string, number>);

  // Create a new review
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: CreateBusinessReviewData) => {
      if (!user) {
        throw new Error('User must be authenticated to create a review');
      }

      const reviewerName = user.user_metadata?.full_name || user.email || 'Anonymous User';

      const { data, error } = await supabase
        .from('business_reviews')
        .insert({
          ...reviewData,
          user_id: user.id,
          reviewer_name: reviewerName,
          criteria_ratings: reviewData.criteria_ratings || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating business review:', error);
        throw error;
      }

      return data as BusinessReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-reviews', businessId] });
      toast({
        title: 'Review submitted',
        description: 'Thank you for sharing your experience!',
      });
    },
    onError: (error: any) => {
      console.error('Error creating review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update an existing review
  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, reviewData }: { reviewId: string; reviewData: UpdateBusinessReviewData }) => {
      if (!user) {
        throw new Error('User must be authenticated to update a review');
      }

      const { data, error } = await supabase
        .from('business_reviews')
        .update({
          ...reviewData,
          updated_at: new Date().toISOString(),
          criteria_ratings: reviewData.criteria_ratings || {}
        })
        .eq('id', reviewId)
        .eq('user_id', user.id) // Ensure user can only update their own review
        .select()
        .single();

      if (error) {
        console.error('Error updating business review:', error);
        throw error;
      }

      return data as BusinessReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-reviews', businessId] });
      toast({
        title: 'Review updated',
        description: 'Your review has been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) {
        throw new Error('User must be authenticated to delete a review');
      }

      const { error } = await supabase
        .from('business_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id); // Ensure user can only delete their own review

      if (error) {
        console.error('Error deleting business review:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-reviews', businessId] });
      toast({
        title: 'Review deleted',
        description: 'Your review has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    reviews,
    userReview,
    averageRating,
    averageCriteriaRatings,
    totalReviews: reviews.length,
    isLoading,
    error,
    refetch,
    createReview: createReviewMutation.mutate,
    updateReview: updateReviewMutation.mutate,
    deleteReview: deleteReviewMutation.mutate,
    isCreating: createReviewMutation.isPending,
    isUpdating: updateReviewMutation.isPending,
    isDeleting: deleteReviewMutation.isPending,
  };
}; 