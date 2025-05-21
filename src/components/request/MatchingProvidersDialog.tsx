
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, MessageSquare, MapPin, Building } from 'lucide-react';
import { ServiceProvider } from '@/types/serviceRequestTypes';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import StarRating from '@/components/marketplace/StarRating';
import { SortOption } from '@/components/SortButton'; 
import ProviderFilters, { ProviderFilters as ProviderFiltersType } from './ProviderFilters';
import RatingProgressBars from '@/components/RatingProgressBars';

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
  city?: string;
  area?: string;
  rating?: number;
  review_count?: number;
}

// Export the main dialog component
export function MatchingProvidersDialog({ requestId, open, onOpenChange }: MatchingProvidersDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Matching Service Providers</DialogTitle>
          <DialogDescription>
            These providers match your service request category and can help you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
  const [currentSort, setCurrentSort] = useState<SortOption>('rating');
  const [filters, setFilters] = useState<ProviderFiltersType>({
    minRating: 0,
    city: null
  });

  // Function to check if the provider already has a conversation for this request
  const hasExistingConversation = (providerId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
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
          // Get detailed provider info including city, area
          const { data: providerDetail } = await supabase
            .from('service_providers')
            .select('city, area')
            .eq('id', provider.provider_id)
            .single();
          
          // Get reviews for the provider to calculate average rating
          const { data: reviews } = await supabase
            .from('seller_reviews')
            .select('rating')
            .eq('seller_id', provider.user_id);
          
          // Calculate average rating if reviews exist
          let rating = 4.5; // Default rating
          let reviewCount = 0;
          
          if (reviews && reviews.length > 0) {
            rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            reviewCount = reviews.length;
          }
          
          return {
            ...provider,
            city: providerDetail?.city || 'Unknown',
            area: providerDetail?.area || 'Unknown',
            rating,
            review_count: reviewCount
          };
        })
      );
      
      console.log("Enhanced providers data:", enhancedData);
      return enhancedData as MatchingProviderResult[];
    },
    enabled: !!requestId,
    staleTime: 60000, // 1 minute cache
  });

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
    if (!matchingProviders) return [];
    const uniqueCities = new Set<string>();
    matchingProviders.forEach(provider => {
      if (provider.city) uniqueCities.add(provider.city);
    });
    return Array.from(uniqueCities).sort();
  }, [matchingProviders]);

  // Apply sorting and filtering to providers
  const filteredAndSortedProviders = useMemo(() => {
    if (!matchingProviders) return [];
    
    // Apply filters
    let filtered = matchingProviders.filter(provider => {
      const meetsRatingFilter = provider.rating !== undefined && provider.rating >= filters.minRating;
      const meetsCityFilter = !filters.city || provider.city === filters.city;
      return meetsRatingFilter && meetsCityFilter;
    });
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (currentSort) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviewCount':
          return (b.review_count || 0) - (a.review_count || 0);
        case 'newest':
          // Since we don't have a 'created_at' field in our data, we'll use alphabetical order
          return a.provider_name.localeCompare(b.provider_name);
        default:
          return 0;
      }
    });
  }, [matchingProviders, filters, currentSort]);

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
    <>
      {/* Add filters and sort buttons */}
      <ProviderFilters 
        cities={cities}
        onFilterChange={setFilters}
        onSortChange={setCurrentSort}
        currentSort={currentSort}
      />
    
      {filteredAndSortedProviders.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No providers match your current filters.
        </div>
      ) : (
        filteredAndSortedProviders.map((provider) => {
          const isContacted = hasExistingConversation(provider.provider_id) || 
                            contactedProviders.has(provider.provider_id);
                            
          // Calculate numerical rating score (out of 100) - same calculation as used in RatingProgressBars
          let allRatings = [provider.rating || 4.5];
          const averageRaw = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
          const ratingScore = Math.round((averageRaw / 10) * 100);  // Update to match RatingProgressBars calculation
          const ratingColor = getOverallRatingColor(ratingScore);
                            
          return (
            <Card key={provider.provider_id} className="overflow-hidden border-l-4 border-l-primary mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <button 
                    onClick={() => goToProviderShop(provider.provider_id, provider.user_id)}
                    className="hover:underline text-primary"
                  >
                    {provider.provider_name}
                  </button>
                  
                  {/* Add circular rating display with updated calculation */}
                  <div 
                    title="Overall rating"
                    className="flex items-center justify-center border-4 font-bold ml-auto"
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: '50%',
                      color: ratingColor,
                      borderColor: ratingColor,
                      fontSize: 18,
                      background: '#fff',
                      boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
                    }}
                  >
                    {ratingScore}
                  </div>
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-1 items-center">
                  <Badge variant="secondary">{provider.provider_category}</Badge>
                  {provider.provider_subcategory && (
                    <Badge variant="outline">{provider.provider_subcategory}</Badge>
                  )}
                  {/* Display star rating with review count */}
                  <div className="flex items-center gap-1">
                    <StarRating rating={provider.rating || 4.5} size="small" />
                    <span className="text-xs text-muted-foreground">
                      ({provider.review_count || 0})
                    </span>
                  </div>
                </div>
                {/* Location information */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{provider.area}, {provider.city}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-2 text-sm text-muted-foreground">
                <p>This service provider specializes in {provider.provider_category.toLowerCase()}
                {provider.provider_subcategory ? ` with focus on ${provider.provider_subcategory.toLowerCase()}` : ''}.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goToProviderShop(provider.provider_id, provider.user_id)}
                  className="flex items-center gap-1"
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  variant={isContacted ? "outline" : "default"}
                  onClick={() => handleContactProvider(provider)}
                  disabled={isCreatingConversation || isContacted}
                  className="flex items-center gap-1"
                >
                  {isCreatingConversation && contactedProviders.has(provider.provider_id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {isContacted ? "Contacted" : "Contact Provider"}
                </Button>
              </CardFooter>
            </Card>
          );
        })
      )}
    </>
  );
}
