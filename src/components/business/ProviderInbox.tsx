
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Calendar, DollarSign, MessageSquare, User, Clock, Navigation } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EnhancedQuotationDialog } from '@/components/request/EnhancedQuotationDialog';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';
import ChatDialog from '@/components/messaging/ChatDialog';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useConversations } from '@/hooks/useConversations';
import { distanceService, type Location } from '@/services/distanceService';
import { ServiceRequestWithDistance } from '@/utils/locationFilterUtils';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { useInboxFilters } from '@/hooks/useSearchFilters';
import InboxFilters from '@/components/InboxFilters';

interface ProviderInboxProps {
  providerId: string;
  category: string;
  subcategory: string[];
  section?: 'new' | 'responded';
  userLocation?: Location | null;
  isLocationEnabled?: boolean;
  providerCity?: string;
  showFilters?: boolean;
}

const ProviderInbox: React.FC<ProviderInboxProps> = ({ 
  providerId, 
  category, 
  subcategory,
  section = 'new',
  userLocation,
  isLocationEnabled = false,
  providerCity,
  showFilters = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getRequestsByCategoryAndSubcategory } = useServiceRequests();
  const { conversations } = useConversations();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [requestDetailsOpen, setRequestDetailsOpen] = useState(false);
  
  // Chat dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Location state
  const [isCalculatingDistances, setIsCalculatingDistances] = useState<boolean>(false);
  const [requestsWithDistance, setRequestsWithDistance] = useState<ServiceRequestWithDistance[]>([]);

  // Add presence tracking for online status
  const { isUserOnline } = usePresence('general');

  // Initialize inbox filters for service provider requests
  const { filters: inboxFilters, setters: inboxSetters } = useInboxFilters();

  // Get matching requests
  const { data: allRequests, isLoading: isLoadingRequests, error: requestsError } = useQuery({
    queryKey: ['matching-requests', category, subcategory, providerCity],
    queryFn: async () => {
      console.log('Fetching requests for category:', category, 'subcategories:', subcategory, 'city:', providerCity);
      
      const requests = await getRequestsByCategoryAndSubcategory(category);
      console.log('Raw requests:', requests);
      
      let filtered = requests;
      
      // Filter by city if provider city is provided
      if (providerCity) {
        filtered = filtered.filter(request => 
          request.city && request.city.toLowerCase() === providerCity.toLowerCase()
        );
        console.log('Filtered requests by city:', filtered);
      }
      
      // Filter by subcategory if provider has specific subcategories
      if (subcategory && subcategory.length > 0) {
        filtered = filtered.filter(request => 
          !request.subcategory || subcategory.includes(request.subcategory)
        );
        console.log('Filtered requests by subcategory:', filtered);
      }
      
      return filtered;
    },
    enabled: !!category
  });

  // Get responded request IDs (conversations that this provider has)
  const respondedRequestIds = useMemo(() => {
    if (!conversations) return new Set<string>();
    return new Set(
      conversations
        .filter(conv => conv.provider_id === providerId)
        .map(conv => conv.request_id)
    );
  }, [conversations, providerId]);

  // Filter requests based on section
  const filteredRequests = useMemo(() => {
    if (!allRequests) return [];
    
    if (section === 'new') {
      // Show requests that haven't been responded to by this provider
      return allRequests.filter(request => !respondedRequestIds.has(request.id));
    } else {
      // Show requests that have been responded to by this provider
      return allRequests.filter(request => respondedRequestIds.has(request.id));
    }
  }, [allRequests, respondedRequestIds, section]);

  const calculateDistancesForRequests = async (requests: ServiceRequest[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const requestsWithDist: ServiceRequestWithDistance[] = await Promise.all(
        requests.map(async (request) => {
          let calculatedDistance = null;
          let distanceText = null;

          if (request.postal_code) {
            try {
              let requestLocation: Location;
              try {
                requestLocation = await distanceService.getCoordinatesFromPostalCodeFallback(request.postal_code);
                console.log(`📍 Geocoded ${request.postal_code} to:`, requestLocation);
              } catch (error) {
                console.warn('⚠️ Fallback geocoding failed, trying Google API...');
                requestLocation = await distanceService.getCoordinatesFromPostalCode(request.postal_code);
                console.log(`📍 Geocoded ${request.postal_code} to:`, requestLocation);
              }

              const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, requestLocation);
              calculatedDistance = straightLineDistance;
              distanceText = `${straightLineDistance.toFixed(1)} km`;
              console.log(`📍 Distance calculated for ${request.title}: ${calculatedDistance.toFixed(2)} km`);
            } catch (error) {
              console.warn(`Failed to calculate distance for ${request.title}:`, error);
            }
          } else {
            console.log(`⚠️ No postal code available for ${request.title}`);
          }

          return {
            ...request,
            calculatedDistance,
            distanceText
          };
        })
      );
      
      setRequestsWithDistance(requestsWithDist);
      console.log('✅ Distance calculation completed for', requestsWithDist.length, 'requests');
      
    } catch (error) {
      console.error('❌ Failed to calculate distances:', error);
      toast({
        title: "Distance calculation failed",
        description: "Using requests without distance data",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Recalculate distances when requests change and location is enabled
  useEffect(() => {
    if (filteredRequests && filteredRequests.length > 0 && userLocation && isLocationEnabled) {
      calculateDistancesForRequests(filteredRequests, userLocation);
    }
  }, [filteredRequests, userLocation, isLocationEnabled]);

  // Apply filters and sort requests
  const filteredAndSortedRequests = useMemo(() => {
    const requestsToFilter: ServiceRequestWithDistance[] = isLocationEnabled && requestsWithDistance.length > 0
      ? requestsWithDistance 
      : filteredRequests.map(req => ({ ...req, calculatedDistance: null, distanceText: null }));

    // Apply filters only if showFilters is true
    let filtered = requestsToFilter;
    
    if (showFilters) {
      filtered = requestsToFilter.filter(request => {
        // Apply city filter
        if (inboxFilters.city.trim() !== '') {
          const requestCity = request.city || '';
          if (!requestCity.toLowerCase().includes(inboxFilters.city.toLowerCase())) {
            return false;
          }
        }
        
        // Apply postal code filter
        if (inboxFilters.postalCode.trim() !== '') {
          const requestPostalCode = request.postal_code || '';
          if (!requestPostalCode.includes(inboxFilters.postalCode)) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Sort the filtered requests only if showFilters is true
    const sorted = [...filtered].sort((a, b) => {
      if (showFilters) {
        switch (inboxFilters.sortBy) {
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
            // Sort by budget (lowest first)
            const aBudget = a.budget || 0;
            const bBudget = b.budget || 0;
            return aBudget - bBudget;
          case 'latest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      } else {
        // Default sort by latest when filters are hidden
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [filteredRequests, requestsWithDistance, isLocationEnabled, inboxFilters, showFilters]);

  // Handle conversation creation and navigation
  const handleSendQuotation = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setQuotationDialogOpen(true);
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setRequestDetailsOpen(true);
  };

  const handleViewConversation = (request: ServiceRequest) => {
    const conversation = conversations?.find(
      conv => conv.request_id === request.id && conv.provider_id === providerId
    );
    
    if (conversation) {
      // Set navigation source for proper back button behavior
      sessionStorage.setItem('conversationNavigationSource', 'service-requests');
      // Open chat dialog instead of navigating
      setSelectedConversationId(conversation.id);
      setChatDialogOpen(true);
    }
  };

  const hasConversation = (requestId: string) => {
    return conversations?.some(
      conv => conv.request_id === requestId && conv.provider_id === providerId
    );
  };

  if (isLoadingRequests) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (requestsError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading requests. Please try again later.</p>
      </div>
    );
  }

  if (!filteredAndSortedRequests || filteredAndSortedRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">
          {section === 'new' ? 'No new requests' : 'No responded requests'}
        </h3>
        <p className="text-muted-foreground">
          {section === 'new' 
            ? 'No new service requests match your business category at the moment.'
            : 'You haven\'t responded to any requests yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls - only show if showFilters is true */}
      {showFilters && (
        <div className="mb-4">
          <InboxFilters
            minRating={inboxFilters.minRating}
            setMinRating={inboxSetters.setMinRating}
            languages={inboxFilters.languages}
            setLanguages={inboxSetters.setLanguages}
            city={inboxFilters.city}
            setCity={inboxSetters.setCity}
            postalCode={inboxFilters.postalCode}
            setPostalCode={inboxSetters.setPostalCode}
            priceType={inboxFilters.priceType}
            setPriceType={inboxSetters.setPriceType}
            sortBy={inboxFilters.sortBy}
            setSortBy={inboxSetters.setSortBy}
            isLocationEnabled={isLocationEnabled}
          />
        </div>
      )}
      
      {/* Request Cards */}
      <div className="grid gap-4">
        {filteredAndSortedRequests.map((request) => {
          // For service requests, we need to get the requester's user_id to check online status
          // Since we don't have direct access to user_id in the request, we'll need to query it
          const isRequesterOnline = request.user_id ? isUserOnline(request.user_id) : false;

          return (
            <Card key={request.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <OnlineIndicator 
                      isOnline={isRequesterOnline} 
                      size="sm" 
                      className="self-start"
                    />
                  </div>
                  <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{request.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{request.area}, {request.city}</span>
                      {request.postal_code && (
                        <span className="text-xs text-muted-foreground">({request.postal_code})</span>
                      )}
                    </div>
                    
                    {request.calculatedDistance !== null && request.calculatedDistance !== undefined && (
                      <div className="flex items-center gap-2 text-primary">
                        <Navigation className="h-4 w-4" />
                        <span className="font-medium">
                          {request.calculatedDistance.toFixed(1)} km away
                        </span>
                      </div>
                    )}
                    
                    {request.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget: ₹{request.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {request.date_range_start ? (
                          <>
                            {format(parseISO(request.date_range_start), 'MMM d, yyyy')}
                            {request.date_range_end && (
                              <> - {format(parseISO(request.date_range_end), 'MMM d, yyyy')}</>
                            )}
                          </>
                        ) : (
                          'Flexible dates'
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Posted {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(request)}
                    className={section === 'responded' ? 'text-xs' : undefined}
                  >
                    View Details
                  </Button>
                  
                  <div className="flex gap-2">
                    {section === 'responded' && hasConversation(request.id) ? (
                      <Button 
                        size="sm"
                        onClick={() => handleViewConversation(request)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View Conversation
                      </Button>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleSendQuotation(request)}
                      >
                        Send Quotation
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialogs */}
      {selectedRequest && (
        <>
          <EnhancedQuotationDialog
            open={quotationDialogOpen}
            onOpenChange={setQuotationDialogOpen}
            request={selectedRequest}
            providerId={providerId}
          />
          <RequestDetailsDialog
            open={requestDetailsOpen}
            onOpenChange={setRequestDetailsOpen}
            request={selectedRequest}
            providerId={providerId}
          />
        </>
      )}

      {/* Chat Dialog */}
      <ChatDialog
        conversationId={selectedConversationId}
        open={chatDialogOpen}
        onOpenChange={setChatDialogOpen}
      />
    </div>
  );
};

export default ProviderInbox;
