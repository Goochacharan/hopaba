
import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  showCount?: boolean;
  count?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  showCount = false, 
  count = 0,
  className,
  size = 'small'
}) => {
  // Define star sizes - making them smaller overall
  const starSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };
  
  const starSize = starSizes[size];
  const textSize = size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base';
  
  // If rating exists (either from reviews or default set by admin), show stars
  if (rating > 0) {
    // Ensure rating is properly rounded to prevent fractional star display issues
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const totalStars = 5;
    
    return (
      <div className={cn("flex items-center flex-nowrap", className)}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={cn("fill-amber-500 stroke-amber-500", starSize)} />
        ))}
        
        {hasHalfStar && (
          <div className={cn("relative", starSize)}>
            <Star className={cn("absolute stroke-amber-500", starSize)} />
            <div className="absolute overflow-hidden w-[50%]">
              <Star className={cn("fill-amber-500 stroke-amber-500", starSize)} />
            </div>
          </div>
        )}
        
        {[...Array(totalStars - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className={cn("stroke-amber-500", starSize)} />
        ))}

        {showCount && (
          <span className={cn("text-muted-foreground ml-1.5", textSize)}>
            ({count})
          </span>
        )}
      </div>
    );
  }
  
  // If no valid rating and no reviews, show "New Seller"
  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("text-muted-foreground", 
        size === 'small' ? 'text-xs' : 
        size === 'medium' ? 'text-sm' : 'text-base'
      )}>
        New Seller
      </span>
    </div>
  );
};

export default StarRating;
