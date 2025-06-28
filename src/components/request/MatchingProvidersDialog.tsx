import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, Star, Phone, MessageSquare, Building, Navigation, Languages, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { useDistanceCache } from '@/hooks/useDistanceCache';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';
import { useServiceProviderLanguages } from '@/hooks/useBusinessLanguages';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { usePresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface MatchingProvider {
  id: string;
  name: string;
  category: string;
  subcategory?: string | string[];
  area?: string;
  city?: string;
  postal_code?: string;
  contact_phone?: string;
  images?: string[];
  user_id?: string;
  calculatedDistance?: number | null;
  rating?: number;
  reviewCount?: number;
  overallScore?: number;
}

// Local type definition to avoid circular dependency
interface LocalBusinessWishlistItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string | string[];
  area?: string;
  city?: string;
  images?: string[];
  contact_phone?: string;
  type: 'business';
}

interface ProviderLanguagesProps {
  providerId: string;
}

const ProviderLanguages: React.FC<ProviderLanguagesProps> = ({ providerId }) => {
  const { data: languages } = useServiceProviderLanguages(providerId);
  
  if (!languages || languages.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Languages className="h-4 w-4" />
      <span className="line-clamp-1">
        {languages.map(lang => lang.name).join(', ')}
      </span>
    </div>
  );
};

export const MatchingProvidersContent: React.FC<{ requestId: string }> = ({ requestId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isLocationEnabled, userLocation } = useLocation();
  const { calculateDistancesForBusinesses } = useDistanceCache();
  const { isUserOnline } = usePresence('general');
  
  // Simple wishlist state management without external dependencies
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  
  // State for providers with calculated distances
  const [providersWithDistance, setProvidersWithDistance] = useState<MatchingProvider[]>([]);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        const businessIds = parsedWishlist
          .filter((item: any) => item.type === 'business')
          .map((item: any) => item.id);
        setWishlistItems(new Set(businessIds));
      } catch (error) {
        console.error('Error parsing wishlist:', error);
      }
    }
  }, []);

  // Fetch the request details with explicit typing
  const { data: request } = useQuery<ServiceRequest>({
    queryKey: ['serviceRequest', requestId],
    queryFn: async (): Promise<ServiceRequest> => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (error) throw error;
      return data as ServiceRequest;
    },
    enabled: !!requestId,
  });

  // Fetch matching providers with explicit typing
  const { data: providers = [], isLoading } = useQuery<MatchingProvider[]>({
    queryKey: ['matchingProviders', requestId, request?.category, request?.subcategory, request?.city],
    queryFn: async (): Promise<MatchingProvider[]> => {
      if (!request) return [];
      
      let query = supabase
        .from('service_providers')
        .select('id, name, category, subcategory, area, city, postal_code, contact_phone, images, user_id')
        .eq('category', request.category)
        .eq('status', 'approved');

      // Add subcategory filter if specified
      if (request.subcategory) {
        query = query.contains('subcategory', [request.subcategory]);
      }

      // Add city filter if specified
      if (request.city) {
        query = query.eq('city', request.city);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch reviews for all providers
      const providerIds = data?.map((p: any) => p.id) || [];
      if (providerIds.length === 0) return [];

      const { data: reviewsData } = await supabase
        .from('business_reviews')
        .select('business_id, rating, criteria_ratings')
        .in('business_id', providerIds);

      const reviews = reviewsData || [];

      // Process providers with rating data and ensure calculatedDistance is included
      const processedProviders: MatchingProvider[] = data.map((provider: any) => {
        const providerReviews = reviews.filter((r: any) => r.business_id === provider.id);
        
        let rating = 4.5; // Default rating
        let reviewCount = 0;
        let overallScore = 0;
        
        if (providerReviews.length > 0) {
          rating = providerReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / providerReviews.length;
          reviewCount = providerReviews.length;
          
          // Calculate overall score using criteria ratings
          const aggregatedCriteriaRatings: Record<string, number[]> = {};
          
          providerReviews.forEach((review: any) => {
            // Safely cast Json to our expected type
            const criteriaRatings = review.criteria_ratings as Record<string, number> | null;
            if (criteriaRatings && typeof criteriaRatings === 'object') {
              Object.entries(criteriaRatings).forEach(([criterionId, criteriaRating]) => {
                if (typeof criteriaRating === 'number') {
                  if (!aggregatedCriteriaRatings[criterionId]) {
                    aggregatedCriteriaRatings[criterionId] = [];
                  }
                  aggregatedCriteriaRatings[criterionId].push(criteriaRating);
                }
              });
            }
          });
          
          // Calculate average for each criterion
          const averageCriteriaRatings: Record<string, number> = {};
          Object.entries(aggregatedCriteriaRatings).forEach(([criterionId, ratings]) => {
            const sum = ratings.reduce((acc, val) => acc + val, 0);
            averageCriteriaRatings[criterionId] = sum / ratings.length;
          });
          
          overallScore = calculateOverallRating(averageCriteriaRatings);
        }

        return {
          ...provider,
          rating,
          reviewCount,
          overallScore,
          calculatedDistance: null // Initialize calculatedDistance
        } as MatchingProvider;
      });

      return processedProviders;
    },
    enabled: !!request,
  });

  // Calculate distances when location is enabled
  useEffect(() => {
    let isMounted = true;

    const calculateDistances = async () => {
      if (!providers?.length || !userLocation || !isLocationEnabled) {
        if (isMounted) {
          setProvidersWithDistance(providers || []);
        }
        return;
      }

      if (isMounted) {
        setIsCalculatingDistances(true);
      }

      try {
        // Prepare businesses data for distance calculation
        const businessesForDistanceCalc = providers
          .filter((provider: MatchingProvider) => provider.postal_code) // Only include providers with postal codes
          .map((provider: MatchingProvider) => ({
            id: provider.id,
            name: provider.name,
            postal_code: provider.postal_code,
            latitude: undefined,
            longitude: undefined,
            map_link: undefined
          }));

        // Use cached distance calculation
        const distanceResults = await calculateDistancesForBusinesses(userLocation, businessesForDistanceCalc);
        
        // Create a map of provider_id to distance
        const distanceMap = new Map();
        distanceResults.forEach(result => {
          if (result.distance !== null) {
            distanceMap.set(result.business.id, result.distance);
          }
        });

        // Apply distances to providers
        const providersWithDistanceData: MatchingProvider[] = providers.map((provider: MatchingProvider) => ({
          ...provider,
          calculatedDistance: distanceMap.get(provider.id) || null
        }));

        if (isMounted) {
          setProvidersWithDistance(providersWithDistanceData);
        }
      } catch (error) {
        console.error('Error calculating distances for matching providers:', error);
        if (isMounted) {
          setProvidersWithDistance(providers || []);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingDistances(false);
        }
      }
    };

    calculateDistances();

    return () => {
      isMounted = false;
    };
  }, [providers?.length, userLocation?.lat, userLocation?.lng, isLocationEnabled]);

  // Use providers with distance if available, otherwise use original providers
  const displayProviders: MatchingProvider[] = isLocationEnabled && providersWithDistance.length > 0
    ? providersWithDistance
    : (providers || []).map((p: any) => ({ ...p, calculatedDistance: null } as MatchingProvider));

  // Sort providers by distance if location is enabled, otherwise by rating
  const sortedProviders = useMemo(() => {
    const sorted = [...displayProviders].sort((a, b) => {
      if (isLocationEnabled && a.calculatedDistance !== null && b.calculatedDistance !== null) {
        return a.calculatedDistance - b.calculatedDistance;
      } else if (isLocationEnabled && a.calculatedDistance !== null) {
        return -1;
      } else if (isLocationEnabled && b.calculatedDistance !== null) {
        return 1;
      } else {
        // Sort by overall score (highest first)
        return (b.overallScore || 0) - (a.overallScore || 0);
      }
    });
    return sorted;
  }, [displayProviders, isLocationEnabled]);

  const handleCall = (phone: string, providerName: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
      toast({
        title: "Calling business",
        description: `Dialing ${phone}...`,
        duration: 2000
      });
    } else {
      toast({
        title: "Phone number not available",
        description: "This business has not provided a phone number",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleSendMessage = async (providerId: string, providerName: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create or get existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', requestId)
        .eq('provider_id', providerId)
        .single();

      if (existingConversation) {
        toast({
          title: "Existing conversation found",
          description: `Opening existing conversation with ${providerName}`,
        });
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            request_id: requestId,
            provider_id: providerId,
            user_id: user.id
          })
          .select('id')
          .single();

        if (error) throw error;

        toast({
          title: "New conversation started",
          description: `Started conversation with ${providerName}`,
        });
      }

      // Navigate to inbox
      navigate('/inbox');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle wishlist toggle for providers
  const handleProviderWishlistToggle = (provider: MatchingProvider, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const businessWishlistItem: LocalBusinessWishlistItem = {
      id: provider.id,
      name: provider.name,
      category: provider.category,
      subcategory: provider.subcategory,
      area: provider.area,
      city: provider.city,
      images: provider.images,
      contact_phone: provider.contact_phone,
      type: 'business'
    };
    
    // Simple wishlist toggle logic
    const newWishlistItems = new Set(wishlistItems);
    const isInWishlist = wishlistItems.has(provider.id);
    
    if (isInWishlist) {
      newWishlistItems.delete(provider.id);
      toast({
        title: "Removed from wishlist",
        description: `${provider.name} has been removed from your wishlist.`,
        duration: 3000,
      });
    } else {
      newWishlistItems.add(provider.id);
      toast({
        title: "Added to wishlist",
        description: `${provider.name} has been added to your wishlist.`,
        duration: 3000,
      });
    }
    
    setWishlistItems(newWishlistItems);
    
    // Update localStorage
    const savedWishlist = localStorage.getItem('wishlist');
    let currentWishlist = [];
    if (savedWishlist) {
      try {
        currentWishlist = JSON.parse(savedWishlist);
      } catch (error) {
        console.error('Error parsing wishlist:', error);
      }
    }
    
    if (isInWishlist) {
      // Remove from wishlist
      currentWishlist = currentWishlist.filter((item: any) => !(item.id === provider.id && item.type === 'business'));
    } else {
      // Add to wishlist
      currentWishlist.push(businessWishlistItem);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(currentWishlist));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sortedProviders.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-lg font-medium">No matching providers found</h3>
        <p className="text-muted-foreground">
          Try expanding your search criteria or check back later for new providers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Matching Providers ({sortedProviders.length})
        </h3>
        {isLocationEnabled && isCalculatingDistances && (
          <div className="text-sm text-muted-foreground">
            Calculating distances...
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {sortedProviders.map((provider) => {
          const isProviderOnline = isUserOnline(provider.user_id);
          const isProviderInWishlist = wishlistItems.has(provider.id);
          
          return (
            <Card key={provider.id} className="relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span>{provider.name}</span>
                    <OnlineIndicator 
                      isOnline={isProviderOnline} 
                      size="sm" 
                      showText={true}
                      className="mt-1"
                    />
                  </div>
                  {provider.overallScore && (
                    <div 
                      className="flex items-center justify-center font-bold"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        color: getRatingColor(provider.overallScore),
                        borderColor: getRatingColor(provider.overallScore),
                        borderWidth: 3,
                        borderStyle: 'solid',
                        fontSize: 20,
                        background: '#fff',
                        boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
                      }}
                      title={`Overall rating: ${provider.overallScore}`}
                    >
                      {provider.overallScore}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Provider Images Carousel with Wishlist Heart */}
                  {provider.images && provider.images.length > 0 && (
                    <div className="relative">
                      <ProviderImageCarousel 
                        images={provider.images}
                        providerName={provider.name}
                        className="mb-3"
                      />
                      {/* Wishlist Heart Icon Overlay */}
                      <button
                        onClick={(e) => handleProviderWishlistToggle(provider, e)}
                        className="absolute top-2 left-2 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white transition-all shadow-sm"
                        aria-label={isProviderInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isProviderInWishlist
                              ? "fill-red-500 text-red-500"
                              : "text-gray-600 hover:text-red-500"
                          )}
                        />
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{provider.category}</Badge>
                      {provider.subcategory && (
                        <Badge variant="secondary">
                          {Array.isArray(provider.subcategory) ? provider.subcategory.join(', ') : provider.subcategory}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[provider.area, provider.city].filter(Boolean).join(', ')}
                        {provider.postal_code && (
                          <span className="text-xs ml-1">({provider.postal_code})</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Distance */}
                    {provider.calculatedDistance !== null && provider.calculatedDistance !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">
                          {provider.calculatedDistance.toFixed(1)} km away
                        </span>
                      </div>
                    )}
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={cn(
                              "h-4 w-4",
                              star <= Math.round(provider.rating || 0) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-gray-300"
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        ({provider.reviewCount || 0})
                      </span>
                    </div>
                    
                    {/* Languages */}
                    <ProviderLanguages providerId={provider.id} />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/business/${provider.id}`)}
                    >
                      <Building className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    
                    {provider.contact_phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCall(provider.contact_phone!, provider.name)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={() => handleSendMessage(provider.id, provider.name)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const MatchingProvidersDialog: React.FC<{ requestId: string; trigger?: React.ReactNode }> = ({ 
  requestId, 
  trigger 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View Matching Providers
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Matching Service Providers</DialogTitle>
        </DialogHeader>
        <MatchingProvidersContent requestId={requestId} />
      </DialogContent>
    </Dialog>
  );
};

export default MatchingProvidersDialog;
