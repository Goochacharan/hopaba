import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, MessageSquare, MapPin, Building, Star } from 'lucide-react';
import { ServiceProvider } from '@/types/serviceRequestTypes';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import StarRating from '@/components/marketplace/StarRating';
import { SortOption } from '@/components/SortButton'; 
import ProviderFilters, { ProviderFilters as ProviderFiltersType } from './ProviderFilters';
import { 
  calculateItemDistance,
  getDistanceDisplayText,
  type ProviderWithDistance 
} from '@/utils/locationFilterUtils';
import { distanceService } from '@/services/distanceService';

interface MatchingProvidersDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MatchingProviderResult {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  user_id: string;
  address?: string;
  city?: string;
  area?: string;
  postal_code?: string;
  map_link?: string;
  rating?: number;
  review_count?: number;
  overallScore?: number;
  calculatedDistance?: number;
  distanceText?: string;
}

// Export the main dialog component
export function MatchingProvidersDialog({ requestId, open, onOpenChange }: MatchingProvidersDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-xl">Matching Service Providers</DialogTitle>
          <DialogDescription>
            These providers match your service request category and can help you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {requestId && <MatchingProvidersContent requestId={requestId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the content component so it can be used directly without the dialog wrapper
export function MatchingProvidersContent({ requestId }: { requestId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, createConversation, isCreatingConversation } = useConversations();
  const [contactedProviders, setContactedProviders] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ProviderFiltersType>({
    minRating: 0,
    city: null
  });
  const [currentSort, setCurrentSort] = useState<SortOption>('rating');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  const [providersWithDistances, setProvidersWithDistances] = useState<MatchingProviderResult[]>([]);

  // Function to check if the provider already has a conversation for this request
  const hasExistingConversation = (providerId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  };

  // Get user location for distance calculations when sorting by distance
  const getUserLocationForSorting = async () => {
    if (userLocation) return userLocation;
    
    try {
      setIsCalculatingDistances(true);
      const location = await distanceService.getUserLocation();
      setUserLocation(location);
      return location;
    } catch (error) {
      console.warn('Could not get user location for distance sorting:', error);
      return null;
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Fetch matching providers using the database function with expanded details
  const { data: matchingProviders, isLoading, error, refetch } = useQuery({
    queryKey: ['matchingProviders', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      // First get the matching providers
      const { data: baseData, error: baseError } = await supabase
        .rpc('get_matching_providers_for_request', { request_id: requestId });
        
      if (baseError) {
        console.error("Error fetching matching providers:", baseError);
        throw baseError;
      }
      
      // Then fetch additional details for each provider
      const enhancedData = await Promise.all(
        (baseData || []).map(async (provider: MatchingProviderResult) => {
          // Get detailed provider info including address, city, area, postal_code, map_link
          const { data: providerDetail } = await supabase
            .from('service_providers')
            .select('id, address, area, city, postal_code, map_link')
            .eq('id', provider.provider_id)
            .single();
          
          // Get reviews for the provider from business_reviews table (same as Messages tab)
          const { data: reviews } = await supabase
            .from('business_reviews')
            .select('business_id, rating')
            .eq('business_id', provider.provider_id);
          
          // Calculate average rating if reviews exist
          let rating = 4.5; // Default rating
          let reviewCount = 0;
          
          if (reviews && reviews.length > 0) {
            rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            reviewCount = reviews.length;
          }
          
          // Calculate overall score (out of 100) - same calculation as used in Messages tab
          const averageRaw = rating;
          const overallScore = Math.round((averageRaw / 5) * 100); // Convert 5-star rating to 100-point scale
          
          return {
            ...provider,
            address: providerDetail?.address || '',
            city: providerDetail?.city || 'Unknown',
            area: providerDetail?.area || 'Unknown',
            postal_code: providerDetail?.postal_code || '',
            map_link: providerDetail?.map_link || '',
            rating,
            review_count: reviewCount,
            overallScore
          };
        })
      );
      
      console.log("Enhanced providers data:", enhancedData);
      return enhancedData as MatchingProviderResult[];
    },
    enabled: !!requestId,
    staleTime: 60000, // 1 minute cache
  });

  // Calculate distances when sorting by distance
  React.useEffect(() => {
    const calculateDistances = async () => {
      if (currentSort !== 'distance' || !matchingProviders || matchingProviders.length === 0) {
        setProvidersWithDistances([]);
        return;
      }

      const location = await getUserLocationForSorting();
      if (!location) {
        setProvidersWithDistances([]);
        return;
      }

      setIsCalculatingDistances(true);
      try {
        // Calculate distances for all providers
        const providersWithDistanceData = await Promise.all(
          matchingProviders.map(async (provider) => {
            const distanceData = await calculateItemDistance(location, provider as ProviderWithDistance);
            
            return {
              ...provider,
              calculatedDistance: distanceData?.distance || null,
              distanceText: distanceData?.distanceText || null
            };
          })
        );

        setProvidersWithDistances(providersWithDistanceData);
      } catch (error) {
        console.error('Error calculating distances:', error);
        setProvidersWithDistances([]);
      } finally {
        setIsCalculatingDistances(false);
      }
    };

    calculateDistances();
  }, [currentSort, matchingProviders, userLocation]);

  const handleContactProvider = (provider: MatchingProviderResult) => {
    if (!user || !requestId) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to contact a service provider.",
        variant: "destructive"
      });
      return;
    }
    
    // Call the createConversation function
    createConversation(requestId, provider.provider_id, user.id);
    
    // Add to local state to show as contacted
    setContactedProviders(prev => new Set([...prev, provider.provider_id]));
    
    toast({
      title: "Provider contacted",
      description: `You've initiated a conversation with ${provider.provider_name}.`,
    });
  };

  // Navigate to provider's business profile page
  const goToProviderShop = (providerId: string, userId: string) => {
    // Updated to navigate to the business page instead of seller page
    navigate(`/business/${providerId}`);
  };

  // Get unique cities for filtering
  const cities = useMemo(() => {
    const uniqueCities = new Set<string>();
    (matchingProviders || []).forEach(provider => {
      if (provider.city) uniqueCities.add(provider.city);
    });
    return Array.from(uniqueCities).sort();
  }, [matchingProviders]);

  // Apply filters and sorting
  const filteredAndSortedProviders = useMemo(() => {
    if (!matchingProviders) return [];
    
    // Use providers with distances if sorting by distance and distances are calculated
    const providersToUse = currentSort === 'distance' && providersWithDistances.length > 0 
      ? providersWithDistances 
      : matchingProviders;
    
    let filtered = providersToUse.filter(provider => {
      // Apply rating filter
      if (filters.minRating > 0 && (provider.rating || 0) < filters.minRating) {
        return false;
      }
      
      // Apply city filter
      if (filters.city && provider.city !== filters.city) {
        return false;
      }
      
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (currentSort) {
        case 'distance':
          // Sort by calculated distance if available
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          // Fall back to rating if no distance data
          return (b.rating || 0) - (a.rating || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviewCount':
          return (b.review_count || 0) - (a.review_count || 0);
        case 'newest':
          // We don't have creation date, so fall back to rating
          return (b.rating || 0) - (a.rating || 0);
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return filtered;
  }, [matchingProviders, providersWithDistances, filters, currentSort]);

  const getOverallRatingColor = (ratingNum: number) => {
    if (ratingNum <= 30) return '#ea384c'; // dark red
    if (ratingNum <= 50) return '#F97316'; // orange
    if (ratingNum <= 70) return '#d9a404'; // dark yellow (custom, close to golden)
    if (ratingNum <= 85) return '#68cd77'; // light green
    return '#00ee24'; // bright green as requested for highest rating
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive py-4 flex flex-col items-center gap-2">
        <p>Error loading matching providers.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!matchingProviders || matchingProviders.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No matching service providers found for your request.
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Add filters and sort buttons */}
      <div className="flex-shrink-0">
        <ProviderFilters 
          cities={cities}
          onFilterChange={setFilters}
          onSortChange={setCurrentSort}
          currentSort={currentSort}
        />
      </div>

      {/* Loading indicator for distance calculations */}
      {isCalculatingDistances && currentSort === 'distance' && (
        <div className="flex items-center justify-center py-2 flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Calculating distances...</span>
        </div>
      )}

      {filteredAndSortedProviders.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground flex-1 flex items-center justify-center">
          No providers match your current filters.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 pb-4">
            {filteredAndSortedProviders.map((provider) => {
              const isContacted = hasExistingConversation(provider.provider_id) || 
                                contactedProviders.has(provider.provider_id);
                                
              // Calculate numerical rating score (out of 100) - same calculation as used in RatingProgressBars
              let allRatings = [provider.rating || 4.5];
              const averageRaw = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
              const ratingScore = Math.round((averageRaw / 10) * 100);  // Update to match RatingProgressBars calculation
              const ratingColor = getOverallRatingColor(ratingScore);

              return (
                <Card key={provider.provider_id} className="relative flex-shrink-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{provider.provider_name}</span>
                      <div className="flex items-center gap-2">
                        {/* Distance badge - only show if distance was calculated */}
                        {provider.calculatedDistance !== null && provider.calculatedDistance !== undefined && (
                          <Badge variant="outline" className="ml-2">
                            📍 {getDistanceDisplayText(provider)}
                          </Badge>
                        )}
                        {/* Overall Score Badge (like Messages tab) */}
                        {provider.overallScore && (
                          <div 
                            className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg"
                            style={{ backgroundColor: getOverallRatingColor(provider.overallScore) }}
                          >
                            {provider.overallScore}
                          </div>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {/* Category and Subcategory */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{provider.provider_category}</Badge>
                        {provider.provider_subcategory && (
                          <Badge variant="outline">{provider.provider_subcategory}</Badge>
                        )}
                      </div>
                      
                      {/* Address Information (like Messages tab) */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {provider.address ? 
                            `${provider.address}, ${provider.area}, ${provider.city}` :
                            `${provider.area}, ${provider.city}`
                          }
                          {provider.postal_code && (
                            <span className="text-xs ml-1">({provider.postal_code})</span>
                          )}
                        </span>
                      </div>
                      
                      {/* Rating and Reviews Information (like Messages tab) */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{(provider.rating || 4.5).toFixed(1)}</span>
                          <span className="text-muted-foreground">Average Rating</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">{provider.review_count || 0}</span> Reviews
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3">
                    <Button
                      onClick={() => handleContactProvider(provider)}
                      disabled={isContacted || isCreatingConversation}
                      className="flex-1"
                      variant={isContacted ? "outline" : "default"}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {isContacted ? "Already Contacted" : "Contact Provider"}
                    </Button>
                    
                    <Button
                      onClick={() => goToProviderShop(provider.provider_id, provider.user_id)}
                      variant="outline"
                      size="sm"
                    >
                      View Profile
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
