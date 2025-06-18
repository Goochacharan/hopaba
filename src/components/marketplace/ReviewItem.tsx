
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import StarRating from './StarRating';
import { SellerReview } from '@/hooks/useSellerDetails';

interface ReviewItemProps {
  review: SellerReview;
  isUsersReview: boolean;
  onEdit: (review: SellerReview) => void;
  onDelete: () => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ 
  review, 
  isUsersReview, 
  onEdit, 
  onDelete 
}) => {
  // Extract first name from reviewer_name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0] || fullName;
  };

  return (
    <div className="border-b pb-4 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} showCount={false} />
            <span className="font-medium">{getFirstName(review.reviewer_name)}</span>
            {isUsersReview && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Your Review</span>
            )}
          </div>
        </div>
      </div>
      
      <p className="text-sm mb-2">{review.comment}</p>
      
      {isUsersReview && (
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8" 
            onClick={() => onEdit(review)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive" 
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
