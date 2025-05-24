import React from 'react';
import LocationCard from '@/components/LocationCard';
import { Recommendation } from '@/lib/mockData';
import { Loader2 } from 'lucide-react';
import { useLocationReviews } from '@/hooks/useLocationReviews';

// Component to handle individual location with reviews
const LocationWithReviews: React.FC<{ 
  recommendation: Recommendation; 
  index: number;
}> = ({ recommendation, index }) => {
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
  
  return (
    <div 
      key={recommendation.id} 
      className="animate-fade-in" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <LocationCard
        recommendation={{
          ...recommendation,
          rating: displayRating,
          address: recommendation.address || (recommendation.area && recommendation.city ? `${recommendation.area}, ${recommendation.city}` : recommendation.address || ''),
          availability_days: availabilityDaysString,
          hours: recommendation.hours || '',
          availability: recommendation.availability || '',
          availability_start_time: recommendation.availability_start_time || undefined,
          availability_end_time: recommendation.availability_end_time || undefined,
          hideAvailabilityDropdown: true,
          criteriaRatings: criteriaRatings
        }}
        showDistanceUnderAddress={true}
        className="search-result-card h-full"
        reviewCount={totalReviewCount}
      />
    </div>
  );
};

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
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
  
  console.log("LocationsList - Rendering recommendations:", recommendations);
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {recommendations.map((recommendation, index) => {
        console.log(`LocationsList - Processing recommendation ${index}:`, recommendation.id);
        console.log(`Availability days:`, recommendation.availability_days);
        console.log(`Hours:`, recommendation.hours);
        console.log(`Start time:`, recommendation.availability_start_time);
        console.log(`End time:`, recommendation.availability_end_time);
        
        return (
          <LocationWithReviews 
            key={recommendation.id}
            recommendation={recommendation}
            index={index}
          />
        );
      })}
    </div>
  );
};

export default LocationsList;
