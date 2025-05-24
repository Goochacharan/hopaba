
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Star } from 'lucide-react';
import { SellerReview } from '@/hooks/useSellerDetails';

interface ReviewFormProps {
  initialRating?: number;
  initialComment?: string;
  isSubmitting: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  onSubmit: (review: { rating: number; comment: string }) => Promise<void>;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  initialRating = 5,
  initialComment = '',
  isSubmitting,
  isEditMode,
  onCancel,
  onSubmit
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Please add a comment',
        description: 'Your review needs to include a comment',
        variant: 'destructive',
      });
      return;
    }

    await onSubmit({ rating, comment });
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Your rating</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="focus:outline-none"
                onClick={() => setRating(value)}
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? 'fill-amber-500 stroke-amber-500'
                      : 'stroke-amber-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Your review</p>
          <Textarea
            placeholder="Share your experience with this seller..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : isEditMode ? 'Update Review' : 'Submit Review'}
        </Button>
      </DialogFooter>
    </>
  );
};

export default ReviewForm;
