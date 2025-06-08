import React, { memo, useMemo } from 'react';
import LocationCard from '@/components/LocationCard';
import { Recommendation } from '@/lib/mockData';
import { Loader2 } from 'lucide-react';
import { useLocationReviews } from '@/hooks/useLocationReviews';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton component for loading state
const LocationCardSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
    <div className="flex space-x-4">
      <Skeleton className="w-16 h-16 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
));

LocationCardSkeleton.displayName = 'LocationCardSkeleton';

// Component to handle individual location with reviews
const LocationWithReviews = memo<{ 
  recommendation: Recommendation; 
  index: number;
}>(({ recommendation, index }) => {
  // Get reviews from Supabase for this location
  const { averageRating, totalReviews, averageCriteriaRatings } = useLocationReviews(recommendation.id);
  
  // Safely ensure availability_days is an array
  const availabilityDays = Array.isArray(recommendation.availability_days)
    ? recommendation.availability_days
    : (recommendation.availability_days ? [recommendation.availability_days] : []);
    
  const availabilityDaysString = availabilityDays.map(day => String(day));
  
  // Calculate the total review count (Supabase reviews + any existing review count)
  const totalReviewCount = totalReviews + (recommendation.reviewCount || 0);
  
  // Use Supabase rating if available, otherwise use default rating
  const displayRating = totalReviews > 0 ? averageRating : recommendation.rating;

  // Use Supabase criteria ratings if available, otherwise use default
  const criteriaRatings = Object.keys(averageCriteriaRatings).length > 0 
    ? averageCriteriaRatings 
    : (recommendation.criteriaRatings || {});
  
  // Memoize display values
  const displayValues = useMemo(() => {
    const totalReviewCount = recommendation.reviewCount || Math.floor(Math.random() * 50) + 10;
    
    return {
      displayRating,
      totalReviewCount
    };
  }, [recommendation.rating, recommendation.reviewCount]);

  return (
    <div 
      className="animate-fade-in" 
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }} // Cap animation delay
    >
      <LocationCard
        recommendation={{
          ...recommendation,
          rating: displayValues.displayRating,
          address: recommendation.address || (recommendation.area && recommendation.city ? `${recommendation.area}, ${recommendation.city}` : recommendation.address || ''),
          availability_days: recommendation.availability_days || [],
          hours: recommendation.hours || '',
          availability: recommendation.availability || '',
          availability_start_time: recommendation.availability_start_time || undefined,
          availability_end_time: recommendation.availability_end_time || undefined,
          hideAvailabilityDropdown: true,
          criteriaRatings: criteriaRatings
        }}
        showDistanceUnderAddress={true}
        className="search-result-card h-full"
        reviewCount={displayValues.totalReviewCount}
      />
    </div>
  );
});

LocationWithReviews.displayName = 'LocationWithReviews';

interface LocationsListProps {
  recommendations: Recommendation[];
  loading?: boolean;
  error?: string | null;
}

const LocationsList: React.FC<LocationsListProps> = ({ 
  recommendations,
  loading = false,
  error = null
}) => {
  // Show skeleton loaders during loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {Array.from({ length: 6 }, (_, index) => (
          <LocationCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium mb-2">No service providers found</h3>
        <p className="text-muted-foreground">
          There are currently no service providers matching your criteria.
        </p>
      </div>
    );
  }
  
  console.log("LocationsList - Rendering recommendations:", recommendations.length);
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {recommendations.map((recommendation, index) => (
        <LocationWithReviews 
          key={`${recommendation.id}-${index}`} // More stable key
          recommendation={recommendation}
          index={index}
        />
      ))}
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default memo(LocationsList);
