import React, { useState, useEffect, memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Languages, Star, Globe, Instagram, Mail, Film, Navigation, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Business } from '@/hooks/useBusinesses';
import { supabase } from '@/integrations/supabase/client';
import RatingProgressBars from '@/components/RatingProgressBars';
import BusinessActionButtons from '@/components/business/BusinessActionButtons';
import { useBusinessReviews } from '@/hooks/useBusinessReviews';
import StarRating from '@/components/marketplace/StarRating';
import { useToast } from '@/hooks/use-toast';
import { useServiceProviderLanguages } from '@/hooks/useBusinessLanguages';
import { useLocation } from '@/contexts/LocationContext';
import { useWishlist, BusinessWishlistItem } from '@/contexts/WishlistContext';
import { cn } from '@/lib/utils';

interface BusinessCardPublicProps {
  business: Business & {
    latitude?: number;
    longitude?: number;
    calculatedDistance?: number;
    distanceText?: string;
  };
  className?: string;
}

const BusinessCardPublic: React.FC<BusinessCardPublicProps> = memo(({ business, className }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Use global location context only for checking if location is enabled
  const { isLocationEnabled } = useLocation();
  
  // Use the new hook to fetch business languages - memoized to prevent unnecessary calls
  const { data: businessLanguages } = useServiceProviderLanguages(business.id || '');
  
  // Use the new Supabase-based review hook - memoized
  const {
    averageRating,
    averageCriteriaRatings,
    totalReviews
  } = useBusinessReviews(business.id || '');
  
  // Create wishlist item for this business
  const businessWishlistItem: BusinessWishlistItem = useMemo(() => ({
    id: business.id || '',
    name: business.name,
    category: business.category,
    subcategory: business.subcategory,
    area: business.area,
    city: business.city,
    images: business.images,
    contact_phone: business.contact_phone,
    type: 'business'
  }), [business]);
  
  // Check if business is in wishlist
  const isBusinessInWishlist = isInWishlist(business.id || '', 'business');
  
  // Handle wishlist toggle
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(businessWishlistItem);
  };
  
  // Memoize expensive calculations
  const formattedPrice = useMemo(() => {
    if (business.price_range_min && business.price_range_max) {
      return `₹${business.price_range_min} - ₹${business.price_range_max} ${business.price_unit || ''}`;
    } else if (business.price_range_min) {
      return `₹${business.price_range_min} ${business.price_unit || ''}`;
    } else if (business.price_range_max) {
      return `Up to ₹${business.price_range_max} ${business.price_unit || ''}`;
    }
    return 'Not specified';
  }, [business.price_range_min, business.price_range_max, business.price_unit]);

  // Memoize availability days formatting
  const formattedAvailabilityDays = useMemo(() => {
    const dayMap: Record<string, string> = {
      '0': 'Sun',
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat'
    };

    if (!business.availability_days || business.availability_days.length === 0) return 'Not specified';
    return business.availability_days.map(day => dayMap[day] || day).join(', ');
  }, [business.availability_days]);

  // Memoize display distance
  const displayDistance = useMemo(() => (
    business.calculatedDistance !== null && business.calculatedDistance !== undefined 
      ? {
          distance: business.calculatedDistance,
          isPrecise: false,
          text: business.distanceText || `${business.calculatedDistance.toFixed(1)} km away`
        }
      : null
  ), [business.calculatedDistance, business.distanceText]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleCardClick = useMemo(() => () => {
    navigate(`/business/${business.id}`);
  }, [navigate, business.id]);
  
  const handleInstagramClick = useMemo(() => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (business.instagram) {
      window.open(`https://instagram.com/${business.instagram.replace('@', '')}`, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening video content",
        description: `Visiting ${business.name}'s video content`,
        duration: 2000
      });
    }
  }, [business.instagram, business.name, toast]);

  // Memoize image source and alt text
  const imageProps = useMemo(() => ({
    src: business.images && business.images.length > 0 ? business.images[0] : null,
    alt: business.name
  }), [business.images, business.name]);

  return (
    <Card 
      className={`overflow-hidden border-primary/20 h-full ${className} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={handleCardClick}
    >
      <div className="aspect-video w-full overflow-hidden relative">
        {imageProps.src ? (
          <img 
            src={imageProps.src} 
            alt={imageProps.alt} 
            className="object-cover w-full h-full" 
            loading="lazy" // Add lazy loading for better performance
            decoding="async" // Improve image loading performance
            style={{ contentVisibility: 'auto' }} // CSS containment for better performance
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}
        
        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white transition-all shadow-sm"
          aria-label={isBusinessInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              isBusinessInWishlist
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            )}
          />
        </button>
        
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-primary/90">
            {business.category}
          </Badge>
        </div>
        {business.subcategory && (
          <div className="absolute top-12 right-2">
            <Badge variant="outline" className="bg-background/90 border-primary/40">
              {business.subcategory}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-2">{business.name}</h3>
          <div>
            <StarRating 
              rating={averageRating} 
              showCount={true} 
              count={totalReviews} 
              size="medium"
            />
          </div>
        </div>
        
        {business.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {business.description}
          </p>
        )}
        
        {/* Display tags if available (above the location info) */}
        {business.tags && business.tags.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1.5">
              {business.tags.slice(0, 3).map((tag, index) => ( // Limit tags for performance
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary text-xs">
                  {tag}
                </Badge>
              ))}
              {business.tags.length > 3 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  +{business.tags.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Real Criteria Rating Progress Bars from Supabase */}
        {Object.keys(averageCriteriaRatings).length > 0 && (
          <div className="mt-2 mb-2">
            <RatingProgressBars 
              criteriaRatings={averageCriteriaRatings}
              locationId={business.id}
            />
          </div>
        )}
        
        {/* Languages badges - displayed above price details */}
        {businessLanguages && businessLanguages.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1.5">
              {businessLanguages.slice(0, 3).map((language, index) => ( // Limit languages for performance
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                >
                  {language.name}
                </Badge>
              ))}
              {businessLanguages.length > 3 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  +{businessLanguages.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="grid gap-2 text-sm">
          {(business.area || business.city) && (
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="line-clamp-1">
                  {[business.area, business.city].filter(Boolean).join(', ')}
                </span>
              </div>
              {business.instagram && (
                <button 
                  onClick={handleInstagramClick}
                  className="text-pink-600 hover:text-pink-700 transition-colors"
                  title="View video content"
                >
                  <Film className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Display distance if available */}
          {displayDistance && (
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {displayDistance.text}
              </span>
            </div>
          )}
          
          {/* Availability */}
          {business.availability_days && business.availability_days.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formattedAvailabilityDays}
              </span>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary">
              {formattedPrice}
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="pt-2">
          <BusinessActionButtons 
            businessId={business.id || ''}
            name={business.name}
            phone={business.contact_phone}
            whatsapp={business.contact_phone}
            instagram={business.instagram}
            location={[business.area, business.city].filter(Boolean).join(', ')}
            mapLink={business.map_link}
          />
        </div>
      </CardContent>
    </Card>
  );
});

// Add display name for debugging
BusinessCardPublic.displayName = 'BusinessCardPublic';

export default BusinessCardPublic;
