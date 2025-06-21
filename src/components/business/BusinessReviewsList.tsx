
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/marketplace/StarRating';
import { BusinessReview } from '@/hooks/useBusinessDetail';
import { supabase } from '@/integrations/supabase/client';

interface BusinessReviewsListProps {
  reviews: BusinessReview[];
}

const BusinessReviewsList: React.FC<BusinessReviewsListProps> = ({ reviews }) => {
  // Helper function to extract first name from email or full name
  const getFirstName = (fullName: string): string => {
    // If it's an email, extract the part before @
    if (fullName.includes('@')) {
      const emailPart = fullName.split('@')[0];
      // If the email part has dots or underscores, take the first part
      const firstPart = emailPart.split(/[._]/)[0];
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    }
    
    // If it's a full name, take the first word
    return fullName.split(' ')[0] || fullName;
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
              <h4 className="font-semibold">{getFirstName(review.name)}</h4>
              <div className="flex items-center mt-1">
                <StarRating rating={review.rating} showCount={true} className="mr-2" />
              </div>
              
              {/* Badges */}
              {(review.isMustVisit || review.isHiddenGem) && (
                <div className="flex space-x-2 mt-2">
                  {review.isMustVisit && (
                    <Badge variant="default" className="bg-green-500">Must Visit</Badge>
                  )}
                  {review.isHiddenGem && (
                    <Badge>Hidden Gem</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {review.text && (
            <p className="mt-2 text-sm">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BusinessReviewsList;
