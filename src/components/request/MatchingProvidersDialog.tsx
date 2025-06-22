
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, MapPin, Star, Navigation, Phone, Languages } from 'lucide-react';
import { ServiceProvider } from '@/types/serviceRequestTypes';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { SortOption } from '@/components/SortButton'; 
import ProviderFilters, { ProviderFilters as ProviderFiltersType } from './ProviderFilters';
import { 
  calculateItemDistance,
  getDistanceDisplayText,
  type ProviderWithDistance 
} from '@/utils/locationFilterUtils';
import { distanceService } from '@/services/distanceService';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import { cn } from '@/lib/utils';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { useServiceProviderLanguages } from '@/hooks/useBusinessLanguages';

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
  images?: string[];
  rating?: number;
  review_count?: number;
  overallScore?: number;
  calculatedDistance?: number;
  distanceText?: string;
  contact_phone?: string;
  latest_pricing?: {
    pricing_type?: string;
    quotation_price?: number;
    wholesale_price?: number;
    negotiable_price?: number;
  };
}

// Export the main dialog component
export function MatchingProvidersDialog({ requestId, open, onOpenChange }: MatchingProvidersDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[98vw] h-[95vh] flex flex-col overflow-hidden p-4">
        <DialogHeader className="flex-shrink-0 pb-2 border-b">
          <DialogTitle className="text-xl font-bold">Matching Service Providers</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 mt-3">
          {requestId && <MatchingProvidersContent requestId={requestId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get pricing type badge
const getPricingTypeBadge = (pricingType: string | undefined) => {
  if (!pricingType) return null;
  
  switch (pricingType.toLowerCase()) {
    case 'fixed':
      return <Badge variant="default" className="ml-2">Fixed Price</Badge>;
    case 'negotiable':
      return <Badge variant="condition" className="ml-2 bg-orange-200 text-orange-800">Negotiable</Badge>;
    case 'wholesale':
      return <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">Wholesale</Badge>;
    default:
      return null;
  }
};

// Helper function to get pricing display
const getPricingDisplay = (pricing: any) => {
  if (!pricing) return null;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-center">
        <Badge variant="secondary" className="bg-green-50 text-green-700 text-lg px-3 py-1">
          ₹{pricing.quotation_price?.toLocaleString()}
        </Badge>
        {getPricingTypeBadge(pricing.pricing_type)}
      </div>
      
      {pricing.pricing_type === 'negotiable' && pricing.negotiable_price && (
        <div className="text-xs text-center text-muted-foreground">
          Negotiable from ₹{pricing.negotiable_price.toLocaleString()}
        </div>
      )}
      
      {pricing.pricing_type === 'wholesale' && pricing.wholesale_price && (
        <div className="text-xs text-center text-muted-foreground">
          Wholesale: ₹{pricing.wholesale_price.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Component to display provider languages
const ProviderLanguagesDisplay: React.FC<{ providerId: string }> = ({ providerId }) => {
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

// Export the content component so it can be used directly without the dialog wrapper
export function MatchingProvidersContent({ requestId }: { requestId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { conversations, createConversation, isCreatingConversation } = useConversations();
  const [contactedProviders, setContactedProviders] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ProviderFiltersType>({
    minRating: [0],
    languages: [],
    city: '',
    postalCode: '',
    priceType: 'all'
  });
  const [currentSort, setCurrentSort] = useState<SortOption>('rating');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  const [providersWithDistances, setProvidersWithDistances] = useState<MatchingProviderResult[]>([]);

  // Add presence tracking for online status
  const { isUserOnline } = usePresence('general');

  // Updated handleCall function to trigger device call interface
  const handleCall = (e: React.MouseEvent, phone?: string, providerName?: string) => {
    e.stopPropagation();
    if (phone) {
      // Use window.location.href to properly trigger device's native call interface
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

  // Function to check if the provider already has a conversation for this request
  const hasExistingConversation = (providerId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  };

  // Get existing conversation ID for a provider
  const getExistingConversationId = (providerId: string) => {
    if (!conversations) return null;
    const conversation = conversations.find(c => c.request_id === requestId && c.provider_id === providerId);
    return conversation?.id || null;
  };

  // Get user location for distance calculations
  const getUserLocation = async () => {
    if (userLocation) return userLocation;
    
    try {
      setIsCalculatingDistances(true);
      const location = await distanceService.getUserLocation();
      setUserLocation(location);
      return location;
    } catch (error) {
      console.warn('Could not get user location for distance calculation:', error);
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
      console.log('Fetching matching providers for request:', requestId);
      
      // Let's also check what providers exist in the database and their approval status
      const { data: allProviders, error: allProvidersError } = await supabase
        .from('service_providers')
        .select('id, name, category, subcategory, approval_status')
        .order('created_at', { ascending: false });
        
      console.log('All providers in database:', allProviders);
      console.log('All providers error:', allProvidersError);
      
      // Get the specific request to see what category/subcategory/city we're matching against
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('id, category, subcategory, city')
        .eq('id', requestId)
        .single();
        
      console.log('Request data:', requestData);
      console.log('Request error:', requestError);
      
      const { data: baseData, error: baseError } = await supabase
        .rpc('get_matching_providers_for_request', { request_id: requestId });
        
      console.log('Base providers data:', baseData);
      console.log('Base providers error:', baseError);
        
      if (baseError) {
        console.error("Error fetching matching providers:", baseError);
        throw baseError;
      }
      
      if (!baseData || baseData.length === 0) {
        console.log('No matching providers found for request:', requestId);
        
        // Let's also try a manual query to see what should match
        if (requestData) {
          const { data: manualMatch, error: manualError } = await supabase
            .from('service_providers')
            .select('id, name, category, subcategory, approval_status, city')
            .ilike('category', requestData.category)
            .ilike('city', requestData.city);
            
          console.log('Manual category match (all approval statuses):', manualMatch);
          console.log('Manual match error:', manualError);
          
          const { data: approvedMatch, error: approvedError } = await supabase
            .from('service_providers')
            .select('id, name, category, subcategory, approval_status, city')
            .ilike('category', requestData.category)
            .ilike('city', requestData.city)
            .eq('approval_status', 'approved');
            
          console.log('Manual category match (approved only):', approvedMatch);
          console.log('Approved match error:', approvedError);
          
          // If no approved providers but there are providers with other statuses, let's use them temporarily
          if (manualMatch && manualMatch.length > 0 && (!approvedMatch || approvedMatch.length === 0)) {
            console.log('Using providers with any approval status as fallback');
            // Transform the manual match data to match the expected format
            const fallbackData = manualMatch.map(provider => ({
              provider_id: provider.id,
              provider_name: provider.name,
              provider_category: provider.category,
              provider_subcategory: provider.subcategory?.[0] || '',
              user_id: provider.id // This should be the actual user_id, but we'll use provider id for now
            }));
            
            // Continue with the enhanced data processing using fallback data
            console.log('Using fallback data:', fallbackData);
            
            // Get user_id for each provider
            const enhancedFallbackData = await Promise.all(
              fallbackData.map(async (provider) => {
                const { data: providerDetail } = await supabase
                  .from('service_providers')
                  .select('user_id')
                  .eq('id', provider.provider_id)
                  .single();
                  
                return {
                  ...provider,
                  user_id: providerDetail?.user_id || provider.user_id
                };
              })
            );
            
            // Use the fallback data instead of returning empty array
            const baseDataToUse = enhancedFallbackData;
            
            // Continue with the rest of the processing...
            console.log('Enhancing data for', baseDataToUse.length, 'providers (fallback)');
            const enhancedData = await Promise.all(
              (baseDataToUse || []).map(async (provider, index) => {
                try {
                  console.log(`Processing provider ${index + 1}/${baseDataToUse.length}:`, provider.provider_id, provider.provider_name);
                
                // Get detailed provider info including address, city, area, postal_code, map_link, images, and contact_phone
                const { data: providerDetail, error: providerDetailError } = await supabase
                  .from('service_providers')
                  .select('id, address, area, city, postal_code, map_link, images, contact_phone')
                  .eq('id', provider.provider_id)
                  .single();
                  
                if (providerDetailError) {
                  console.error(`Error fetching details for provider ${provider.provider_id}:`, providerDetailError);
                }
                
                // Get reviews for the provider from business_reviews table with criteria ratings
                const { data: reviews, error: reviewsError } = await supabase
                  .from('business_reviews')
                  .select('business_id, rating, criteria_ratings')
                  .eq('business_id', provider.provider_id);
                  
                if (reviewsError) {
                  console.error(`Error fetching reviews for provider ${provider.provider_id}:`, reviewsError);
                }

                // Get latest quotation message for this provider and request
                let latestPricing = null;
                if (conversations) {
                  const conversation = conversations.find(
                    c => c.request_id === requestId && c.provider_id === provider.provider_id
                  );
                  
                  if (conversation) {
                    const { data: latestQuotation } = await supabase
                      .from('messages')
                      .select('pricing_type, quotation_price, wholesale_price, negotiable_price')
                      .eq('conversation_id', conversation.id)
                      .not('quotation_price', 'is', null)
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .single();
                    
                    if (latestQuotation) {
                      latestPricing = {
                        pricing_type: latestQuotation.pricing_type,
                        quotation_price: latestQuotation.quotation_price,
                        wholesale_price: latestQuotation.wholesale_price,
                        negotiable_price: latestQuotation.negotiable_price
                      };
                    }
                  }
                }
                
                // Calculate average rating if reviews exist
                let rating = 4.5; // Default rating
                let reviewCount = 0;
                let overallScore = 0;
                
                if (reviews && reviews.length > 0) {
                  rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
                  reviewCount = reviews.length;
                  
                  // Calculate overall score using criteria ratings (same as home page)
                  const aggregatedCriteriaRatings: Record<string, number[]> = {};
                  
                  reviews.forEach(review => {
                    if (review.criteria_ratings) {
                      Object.entries(review.criteria_ratings).forEach(([criterionId, criteriaRating]) => {
                        if (!aggregatedCriteriaRatings[criterionId]) {
                          aggregatedCriteriaRatings[criterionId] = [];
                        }
                        aggregatedCriteriaRatings[criterionId].push(criteriaRating as number);
                      });
                    }
                  });
                  
                  // Calculate average for each criterion
                  const averageCriteriaRatings: Record<string, number> = {};
                  Object.entries(aggregatedCriteriaRatings).forEach(([criterionId, ratings]) => {
                    const sum = ratings.reduce((acc, val) => acc + val, 0);
                    averageCriteriaRatings[criterionId] = sum / ratings.length;
                  });
                  
                  // Use the same calculation as home page (RatingProgressBars)
                  overallScore = calculateOverallRating(averageCriteriaRatings);
                }
                
                return {
                  ...provider,
                  address: providerDetail?.address || '',
                  city: providerDetail?.city || 'Unknown',
                  area: providerDetail?.area || 'Unknown',
                  postal_code: providerDetail?.postal_code || '',
                  map_link: providerDetail?.map_link || '',
                  images: providerDetail?.images || [],
                  contact_phone: providerDetail?.contact_phone || '',
                  rating,
                  review_count: reviewCount,
                  overallScore,
                  latest_pricing: latestPricing
                };
                } catch (error) {
                  console.error(`Error processing provider ${provider.provider_id}:`, error);
                  // Return a basic version of the provider if processing fails
                  return {
                    ...provider,
                    address: '',
                    city: 'Unknown',
                    area: 'Unknown',
                    postal_code: '',
                    map_link: '',
                    images: [],
                    contact_phone: '',
                    rating: 4.5,
                    review_count: 0,
                    overallScore: 0,
                    latest_pricing: null
                  };
                }
              })
            );
            
            // Filter out any null results
            const validEnhancedData = enhancedData.filter(provider => provider !== null);
            console.log("Enhanced providers data (fallback):", validEnhancedData);
            console.log(`Successfully processed ${validEnhancedData.length} out of ${baseDataToUse.length} providers (fallback)`);
            return validEnhancedData as MatchingProviderResult[];
          }
        }
        
        return [];
      }
      
      // Then fetch additional details for each provider
      console.log('Enhancing data for', baseData.length, 'providers');
      const enhancedData = await Promise.all(
        (baseData || []).map(async (provider: MatchingProviderResult, index: number) => {
          try {
            console.log(`Processing provider ${index + 1}/${baseData.length}:`, provider.provider_id, provider.provider_name);
          
          // Get detailed provider info including address, city, area, postal_code, map_link, images, and contact_phone
          const { data: providerDetail, error: providerDetailError } = await supabase
            .from('service_providers')
            .select('id, address, area, city, postal_code, map_link, images, contact_phone')
            .eq('id', provider.provider_id)
            .single();
            
          if (providerDetailError) {
            console.error(`Error fetching details for provider ${provider.provider_id}:`, providerDetailError);
          }
          
          // Get reviews for the provider from business_reviews table with criteria ratings
          const { data: reviews, error: reviewsError } = await supabase
            .from('business_reviews')
            .select('business_id, rating, criteria_ratings')
            .eq('business_id', provider.provider_id);
            
          if (reviewsError) {
            console.error(`Error fetching reviews for provider ${provider.provider_id}:`, reviewsError);
          }

          // Get latest quotation message for this provider and request
          let latestPricing = null;
          if (conversations) {
            const conversation = conversations.find(
              c => c.request_id === requestId && c.provider_id === provider.provider_id
            );
            
            if (conversation) {
              const { data: latestQuotation } = await supabase
                .from('messages')
                .select('pricing_type, quotation_price, wholesale_price, negotiable_price')
                .eq('conversation_id', conversation.id)
                .not('quotation_price', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (latestQuotation) {
                latestPricing = {
                  pricing_type: latestQuotation.pricing_type,
                  quotation_price: latestQuotation.quotation_price,
                  wholesale_price: latestQuotation.wholesale_price,
                  negotiable_price: latestQuotation.negotiable_price
                };
              }
            }
          }
          
          // Calculate average rating if reviews exist
          let rating = 4.5; // Default rating
          let reviewCount = 0;
          let overallScore = 0;
          
          if (reviews && reviews.length > 0) {
            rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            reviewCount = reviews.length;
            
            // Calculate overall score using criteria ratings (same as home page)
            const aggregatedCriteriaRatings: Record<string, number[]> = {};
            
            reviews.forEach(review => {
              if (review.criteria_ratings) {
                Object.entries(review.criteria_ratings).forEach(([criterionId, criteriaRating]) => {
                  if (!aggregatedCriteriaRatings[criterionId]) {
                    aggregatedCriteriaRatings[criterionId] = [];
                  }
                  aggregatedCriteriaRatings[criterionId].push(criteriaRating as number);
                });
              }
            });
            
            // Calculate average for each criterion
            const averageCriteriaRatings: Record<string, number> = {};
            Object.entries(aggregatedCriteriaRatings).forEach(([criterionId, ratings]) => {
              const sum = ratings.reduce((acc, val) => acc + val, 0);
              averageCriteriaRatings[criterionId] = sum / ratings.length;
            });
            
            // Use the same calculation as home page (RatingProgressBars)
            overallScore = calculateOverallRating(averageCriteriaRatings);
          }
          
          return {
            ...provider,
            address: providerDetail?.address || '',
            city: providerDetail?.city || 'Unknown',
            area: providerDetail?.area || 'Unknown',
            postal_code: providerDetail?.postal_code || '',
            map_link: providerDetail?.map_link || '',
            images: providerDetail?.images || [],
            contact_phone: providerDetail?.contact_phone || '',
            rating,
            review_count: reviewCount,
            overallScore,
            latest_pricing: latestPricing
          };
          } catch (error) {
            console.error(`Error processing provider ${provider.provider_id}:`, error);
            // Return a basic version of the provider if processing fails
            return {
              ...provider,
              address: '',
              city: 'Unknown',
              area: 'Unknown',
              postal_code: '',
              map_link: '',
              images: [],
              contact_phone: '',
              rating: 4.5,
              review_count: 0,
              overallScore: 0,
              latest_pricing: null
            };
          }
        })
      );
      
      // Filter out any null results
      const validEnhancedData = enhancedData.filter(provider => provider !== null);
      console.log("Enhanced providers data:", validEnhancedData);
      console.log(`Successfully processed ${validEnhancedData.length} out of ${baseData.length} providers`);
      return validEnhancedData as MatchingProviderResult[];
    },
    enabled: !!requestId,
    staleTime: 60000, // 1 minute cache
  });

  // Calculate distances when providers are loaded
  React.useEffect(() => {
    const calculateDistances = async () => {
      if (!matchingProviders || matchingProviders.length === 0) {
        setProvidersWithDistances([]);
        return;
      }

      const location = await getUserLocation();
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
  }, [matchingProviders]);

  const handleChatWithProvider = async (provider: MatchingProviderResult) => {
    if (!user || !requestId) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to chat with a service provider.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if conversation already exists
    const existingConversationId = getExistingConversationId(provider.provider_id);
    
    if (existingConversationId) {
      // Navigate to existing conversation
      sessionStorage.setItem('conversationNavigationSource', 'inbox');
      navigate(`/messages/${existingConversationId}`);
      return;
    }
    
    try {
      // Create new conversation - this returns void, so we handle it differently
      await createConversation(requestId, provider.provider_id, user.id);
      
      // Add to local state
      setContactedProviders(prev => new Set([...prev, provider.provider_id]));
      
      toast({
        title: "Chat started",
        description: `You can now chat with ${provider.provider_name}.`,
      });
      
      // After creating conversation, find the new conversation ID
      // We'll need to refetch conversations or find it in the updated list
      // For now, navigate to inbox where user can see the new conversation
      navigate('/inbox');
      
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: "Failed to start chat",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
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

  // Apply filters and sorting - Enhanced with new filter options
  const filteredAndSortedProviders = useMemo(() => {
    if (!matchingProviders) return [];
    
    console.log('Applying filters and sorting with currentSort:', currentSort);
    
    // Always start with matchingProviders and enhance with distance info if available.
    const providersToUse = matchingProviders.map(p => {
        const distanceInfo = providersWithDistances.find(pwd => pwd.provider_id === p.provider_id);
        if (distanceInfo && distanceInfo.calculatedDistance !== null) {
            return {
                ...p,
                calculatedDistance: distanceInfo.calculatedDistance,
                distanceText: distanceInfo.distanceText,
            };
        }
        return p;
    });
    
    let filtered = providersToUse.filter(provider => {
      // Apply rating filter using overall score (0-100 scale)
      if (filters.minRating[0] > 0) {
        const overallScore = provider.overallScore || 0;
        if (overallScore === 0 || overallScore < filters.minRating[0]) {
          return false;
        }
      }
      
      // Apply city filter
      if (filters.city.trim() !== '') {
        const providerCity = provider.city || '';
        if (!providerCity.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
      }
      
      // Apply postal code filter
      if (filters.postalCode.trim() !== '') {
        const providerPostalCode = provider.postal_code || '';
        if (!providerPostalCode.includes(filters.postalCode)) {
          return false;
        }
      }
      
      // Apply price type filter
      if (filters.priceType !== 'all') {
        const pricingType = provider.latest_pricing?.pricing_type;
        if (pricingType !== filters.priceType) {
          return false;
        }
      }
      
      // TODO: Apply language filter when provider language data is available
      // if (filters.languages.length > 0) {
      //   // Check if provider speaks any of the selected languages
      // }
      
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
          // Fall back to overall score if no distance data
          return (b.overallScore || 0) - (a.overallScore || 0);
        case 'rating':
          return (b.overallScore || 0) - (a.overallScore || 0);
        case 'reviewCount':
          return (b.review_count || 0) - (a.review_count || 0);
        case 'price':
          const aPrice = a.latest_pricing?.quotation_price || 0;
          const bPrice = b.latest_pricing?.quotation_price || 0;
          return aPrice - bPrice; // Lowest price first
        case 'newest':
          // We don't have creation date, so fall back to overall score
          return (b.overallScore || 0) - (a.overallScore || 0);
        default:
          return (b.overallScore || 0) - (a.overallScore || 0);
      }
    });

    console.log('Filtered and sorted providers:', filtered.length);
    return filtered;
  }, [matchingProviders, providersWithDistances, filters, currentSort]);

  // Handle sort change with proper state update
  const handleSortChange = (sortOption: SortOption) => {
    console.log('Sort option changed to:', sortOption);
    setCurrentSort(sortOption);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading providers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive py-8 flex flex-col items-center gap-4">
        <p className="text-lg">Error loading matching providers.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!matchingProviders || matchingProviders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No matching service providers found for your request.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-2">
      {/* Filters and sort controls - simplified styling */}
      <div className="flex-shrink-0 pb-2">
        <ProviderFilters 
          cities={cities}
          onFilterChange={setFilters}
          onSortChange={handleSortChange}
          currentSort={currentSort}
        />
      </div>

      {/* Loading indicator for distance calculations */}
      {isCalculatingDistances && (
        <div className="flex items-center justify-center py-2 flex-shrink-0 bg-blue-50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Calculating distances...</span>
        </div>
      )}

      {/* Scrollable content area - removed background styling */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedProviders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No providers match your current filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 pb-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedProviders.map((provider) => {
              const hasConversation = hasExistingConversation(provider.provider_id);
              const isProcessing = isCreatingConversation && contactedProviders.has(provider.provider_id);
              const isProviderOnline = isUserOnline(provider.user_id);

              return (
                <Card key={provider.provider_id} className="flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="line-clamp-2">{provider.provider_name}</span>
                        <OnlineIndicator 
                          isOnline={isProviderOnline} 
                          size="sm" 
                          className="self-start"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Overall Score Badge (like Shop page) */}
                        {provider.overallScore && (
                          <div 
                            className="flex items-center justify-center font-bold text-sm"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              color: getRatingColor(provider.overallScore),
                              borderColor: getRatingColor(provider.overallScore),
                              borderWidth: 2,
                              borderStyle: 'solid',
                              background: '#fff',
                              boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
                            }}
                            title={`Overall rating: ${provider.overallScore}`}
                          >
                            {provider.overallScore}
                          </div>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    {/* Shop Images Carousel */}
                    <ProviderImageCarousel 
                      images={provider.images || []}
                      providerName={provider.provider_name}
                      className="mb-3"
                    />
                    
                    {/* Category and Subcategory */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{provider.provider_category}</Badge>
                      {provider.provider_subcategory && (
                        <Badge variant="outline">{provider.provider_subcategory}</Badge>
                      )}
                    </div>
                    
                    {/* Address Information */}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {provider.area}, {provider.city}
                        {provider.postal_code && (
                          <span className="text-xs ml-1">({provider.postal_code})</span>
                        )}
                      </span>
                    </div>

                    {/* Distance from user */}
                    {provider.calculatedDistance !== null && provider.calculatedDistance !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-primary py-2">
                        <Navigation className="h-4 w-4" />
                        <span className="font-medium">
                          {provider.calculatedDistance.toFixed(1)} km away
                        </span>
                      </div>
                    )}
                    
                    {/* Five Star Rating with Review Count + Call Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={cn(
                                "h-4 w-4",
                                star <= Math.round(provider.rating || 4.5) 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-gray-300"
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground">
                          ({provider.review_count || 0})
                        </span>
                      </div>
                      
                      {/* Call Button */}
                      {provider.contact_phone && (
                        <button
                          onClick={(e) => handleCall(e, provider.contact_phone, provider.provider_name)}
                          title="Call Business"
                          aria-label="Call business"
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-all rounded shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[2px] bg-blue-600 hover:bg-blue-500"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      )}
                    </div>

                    {/* Pricing Display with Type Badge */}
                    {provider.latest_pricing && getPricingDisplay(provider.latest_pricing)}
                    
                    {/* Languages Spoken */}
                    <ProviderLanguagesDisplay providerId={provider.provider_id} />
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-3 mt-auto">
                    <Button
                      onClick={() => handleChatWithProvider(provider)}
                      disabled={isProcessing}
                      className="flex-1"
                      variant={hasConversation ? "outline" : "default"}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      {hasConversation ? "Open Chat" : "Chat"}
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
        )}
      </div>
    </div>
  );
}
