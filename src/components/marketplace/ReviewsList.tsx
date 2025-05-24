
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerReview } from '@/hooks/useSellerDetails';
import ReviewItem from './ReviewItem';

interface ReviewsListProps {
  reviews: SellerReview[];
  userReviewId?: string | null;
  onEditReview: (review: SellerReview) => void;
  onDeleteReview: () => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  userReviewId,
  onEditReview,
  onDeleteReview
}) => {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="all">All Reviews ({reviews.length})</TabsTrigger>
        <TabsTrigger value="positive">Positive</TabsTrigger>
        <TabsTrigger value="negative">Critical</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <ReviewItem 
              key={review.id}
              review={review}
              isUsersReview={review.reviewer_id === userReviewId}
              onEdit={() => onEditReview(review)}
              onDelete={onDeleteReview}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-6">No reviews yet. Be the first to review this seller!</p>
        )}
      </TabsContent>
      
      <TabsContent value="positive" className="space-y-4">
        {reviews.filter(review => review.rating >= 4).length > 0 ? (
          reviews
            .filter(review => review.rating >= 4)
            .map(review => (
              <ReviewItem 
                key={review.id}
                review={review}
                isUsersReview={review.reviewer_id === userReviewId}
                onEdit={() => onEditReview(review)}
                onDelete={onDeleteReview}
              />
            ))
        ) : (
          <p className="text-center text-muted-foreground py-6">No positive reviews yet</p>
        )}
      </TabsContent>
      
      <TabsContent value="negative" className="space-y-4">
        {reviews.filter(review => review.rating < 4).length > 0 ? (
          reviews
            .filter(review => review.rating < 4)
            .map(review => (
              <ReviewItem 
                key={review.id}
                review={review}
                isUsersReview={review.reviewer_id === userReviewId}
                onEdit={() => onEditReview(review)}
                onDelete={onDeleteReview}
              />
            ))
        ) : (
          <p className="text-center text-muted-foreground py-6">No critical reviews yet</p>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ReviewsList;
