
import React from 'react';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface Review {
  id: string;
  name: string;
  date: string;
  rating: number;
  text?: string;
  isMustVisit?: boolean;
  isHiddenGem?: boolean;
  userId?: string | null;
  criteriaRatings?: Record<string, number>;
}

interface ReviewsListProps {
  reviews: Review[];
  totalReviews: number;
  locationRating: number;
}

const ReviewsList = ({
  reviews,
  totalReviews,
  locationRating
}: ReviewsListProps) => {
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(locationRating)
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="font-semibold">{locationRating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">({totalReviews} reviews)</span>
      </div>
      
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to share your experience!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-t pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{review.name}</h4>
                  <div className="flex items-center mt-1 space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {review.date}
                    </span>
                  </div>
                  
                  {/* Badges for Must Visit and Hidden Gem */}
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
              
              {/* Display detailed criteria ratings if available */}
              {review.criteriaRatings && Object.keys(review.criteriaRatings).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-muted-foreground mb-1">Detailed ratings:</p>
                  {Object.entries(review.criteriaRatings).map(([criterionId, rating]) => {
                    // Use the criterion ID's first characters as a placeholder, will be updated by RatingProgressBars
                    const criterionName = `Rating ${criterionId.substring(0, 4)}`;
                    return (
                      <div key={criterionId} className="flex items-center gap-2">
                        <div className="text-xs w-24 truncate">{criterionName}</div>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
