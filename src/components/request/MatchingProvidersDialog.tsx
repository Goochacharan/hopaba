
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Star, MapPin, Phone, Mail, Globe, Instagram, MessageSquare, Navigation } from 'lucide-react';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { EnhancedQuotationDialog } from './EnhancedQuotationDialog';
import { useAuth } from '@/hooks/useAuth';
import { distanceService, type Location } from '@/services/distanceService';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from '@/components/ui/use-toast';
import { useInboxFilters } from '@/hooks/useSearchFilters';
import InboxFilters from '@/components/InboxFilters';

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  subcategory: string[] | null;
  description: string;
  area: string;
  city: string;
  postal_code: string;
  contact_phone: string;
  contact_email: string | null;
  whatsapp: string;
  website: string | null;
  instagram: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  price_unit: string | null;
  images: string[] | null;
  languages: string[] | null;
  experience: string | null;
  availability: string | null;
  tags: string[] | null;
  approval_status: string | null;
  created_at: string;
  calculatedDistance?: number | null;
  distanceText?: string | null;
}

interface MatchingProvidersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ServiceRequest;
}

const MatchingProvidersDialog: React.FC<MatchingProvidersDialogProps> = ({
  open,
  onOpenChange,
  request
}) => {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  
  // Location state
  const { userLocation, isLocationEnabled } = useLocation();
  const [isCalculatingDistances, setIsCalculatingDistances] = useState<boolean>(false);
  const [providersWithDistance, setProvidersWithDistance] = useState<ServiceProvider[]>([]);

  // Initialize filters using the same hook as InboxFilters
  const { filters, setters } = useInboxFilters();

  // Fetch matching providers
  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ['matching-providers', request.category, request.subcategory],
    queryFn: async () => {
      console.log('Fetching providers for category:', request.category, 'subcategory:', request.subcategory);
      
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('category', request.category)
        .eq('approval_status', 'approved');

      // Filter by subcategory if specified
      if (request.subcategory) {
        query = query.contains('subcategory', [request.subcategory]);
      }

      // Filter by city if specified
      if (request.city) {
        query = query.eq('city', request.city);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log('Found providers:', data);
      return data as ServiceProvider[];
    },
    enabled: open && !!request
  });

  // Calculate distances when providers change and location is enabled
  React.useEffect(() => {
    if (providers && providers.length > 0 && userLocation && isLocationEnabled) {
      calculateDistancesForProviders(providers, userLocation);
    }
  }, [providers, userLocation, isLocationEnabled]);

  const calculateDistancesForProviders = async (providersList: ServiceProvider[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const providersWithDist: ServiceProvider[] = await Promise.all(
        providersList.map(async (provider) => {
          let calculatedDistance = null;
          let distanceText = null;

          if (provider.postal_code) {
            try {
              let providerLocation: Location;
              try {
                providerLocation = await distanceService.getCoordinatesFromPostalCodeFallback(provider.postal_code);
                console.log(`📍 Geocoded ${provider.postal_code} to:`, providerLocation);
              } catch (error) {
                console.warn('⚠️ Fallback geocoding failed, trying Google API...');
                providerLocation = await distanceService.getCoordinatesFromPostalCode(provider.postal_code);
                console.log(`📍 Geocoded ${provider.postal_code} to:`, providerLocation);
              }

              const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, providerLocation);
              calculatedDistance = straightLineDistance;
              distanceText = `${straightLineDistance.toFixed(1)} km`;
              console.log(`📍 Distance calculated for ${provider.name}: ${calculatedDistance.toFixed(2)} km`);
            } catch (error) {
              console.warn(`Failed to calculate distance for ${provider.name}:`, error);
            }
          } else {
            console.log(`⚠️ No postal code available for ${provider.name}`);
          }

          return {
            ...provider,
            calculatedDistance,
            distanceText
          };
        })
      );
      
      setProvidersWithDistance(providersWithDist);
      console.log('✅ Distance calculation completed for', providersWithDist.length, 'providers');
      
    } catch (error) {
      console.error('❌ Failed to calculate distances:', error);
      toast({
        title: "Distance calculation failed",
        description: "Using providers without distance data",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Apply filters and sort providers
  const filteredAndSortedProviders = useMemo(() => {
    const providersToFilter: ServiceProvider[] = isLocationEnabled && providersWithDistance.length > 0
      ? providersWithDistance 
      : providers.map(provider => ({ ...provider, calculatedDistance: null, distanceText: null }));

    // Apply filters
    let filtered = providersToFilter.filter(provider => {
      // Apply minimum rating filter (providers don't have ratings in the current schema, so skip this)
      
      // Apply language filter
      if (filters.languages.length > 0) {
        const providerLanguages = provider.languages || [];
        const hasMatchingLanguage = filters.languages.some(langId => 
          providerLanguages.includes(langId)
        );
        if (!hasMatchingLanguage) return false;
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
      
      // Apply price type filter (based on price range)
      if (filters.priceType !== 'all') {
        // For providers, we can infer pricing type from their price ranges
        const hasMinPrice = provider.price_range_min !== null;
        const hasMaxPrice = provider.price_range_max !== null;
        
        switch (filters.priceType) {
          case 'fixed':
            if (!hasMinPrice || !hasMaxPrice || provider.price_range_min !== provider.price_range_max) {
              return false;
            }
            break;
          case 'negotiable':
            if (!hasMinPrice || !hasMaxPrice || provider.price_range_min === provider.price_range_max) {
              return false;
            }
            break;
          // wholesale doesn't apply to service providers typically
        }
      }
      
      return true;
    });

    // Sort the filtered providers
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          // Sort by calculated distance if available
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          // Fall back to latest if no distance data
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price':
          // Sort by minimum price (lowest first)
          const aPrice = a.price_range_min || 0;
          const bPrice = b.price_range_min || 0;
          return aPrice - bPrice;
        case 'rating':
          // Providers don't have ratings in current schema, fall back to latest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [providers, providersWithDistance, isLocationEnabled, filters]);

  const handleSendQuotation = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setQuotationDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finding Matching Providers</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Providers</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load matching providers. Please try again.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matching Service Providers ({filteredAndSortedProviders.length})</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filters - Using InboxFilters for consistency */}
            <InboxFilters
              minRating={filters.minRating}
              setMinRating={setters.setMinRating}
              languages={filters.languages}
              setLanguages={setters.setLanguages}
              city={filters.city}
              setCity={setters.setCity}
              postalCode={filters.postalCode}
              setPostalCode={setters.setPostalCode}
              priceType={filters.priceType}
              setPriceType={setters.setPriceType}
              sortBy={filters.sortBy}
              setSortBy={setters.setSortBy}
              isLocationEnabled={isLocationEnabled}
            />

            {/* Providers List */}
            {filteredAndSortedProviders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No providers found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedProviders.map((provider) => (
                  <Card key={provider.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.category}</p>
                          {provider.subcategory && provider.subcategory.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {provider.subcategory.map((sub, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {provider.approval_status === 'approved' && (
                          <Badge variant="default">Verified</Badge>
                        )}
                      </div>

                      <p className="text-sm mb-3">{provider.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{provider.area}, {provider.city}</span>
                            <span className="text-xs text-muted-foreground">({provider.postal_code})</span>
                          </div>
                          
                          {provider.calculatedDistance !== null && provider.calculatedDistance !== undefined && (
                            <div className="flex items-center gap-2 text-primary">
                              <Navigation className="h-4 w-4" />
                              <span className="font-medium">
                                {provider.calculatedDistance.toFixed(1)} km away
                              </span>
                            </div>
                          )}

                          {provider.price_range_min && provider.price_range_max && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Price:</span>
                              <span>₹{provider.price_range_min} - ₹{provider.price_range_max} {provider.price_unit}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{provider.contact_phone}</span>
                          </div>
                          
                          {provider.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-xs">{provider.contact_email}</span>
                            </div>
                          )}
                          
                          {provider.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                                Website
                              </a>
                            </div>
                          )}
                          
                          {provider.instagram && (
                            <div className="flex items-center gap-2">
                              <Instagram className="h-4 w-4" />
                              <a href={`https://instagram.com/${provider.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                                @{provider.instagram}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {provider.languages && provider.languages.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium">Languages: </span>
                          <span className="text-sm text-muted-foreground">{provider.languages.join(', ')}</span>
                        </div>
                      )}

                      {provider.experience && (
                        <div className="mb-3">
                          <span className="text-sm font-medium">Experience: </span>
                          <span className="text-sm text-muted-foreground">{provider.experience}</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button 
                          size="sm"
                          onClick={() => handleSendQuotation(provider)}
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      {selectedProvider && (
        <EnhancedQuotationDialog
          open={quotationDialogOpen}
          onOpenChange={setQuotationDialogOpen}
          request={request}
          providerId={selectedProvider.id}
        />
      )}
    </>
  );
};

export default MatchingProvidersDialog;
