import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConversationsOptimized } from '@/hooks/useConversationsOptimized';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Search, Star, MapPin, Navigation, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateItemDistance, getDistanceDisplayText, type ProviderWithDistance } from '@/utils/locationFilterUtils';
import { distanceService } from '@/services/distanceService';
import { cn } from '@/lib/utils';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { usePresence } from '@/hooks/usePresence';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  const { isUserOnline } = usePresence('general');

  // Simplified conversations loading with better error handling
  const { 
    conversations = [], 
    unreadCount = 0, 
    isLoading: conversationsLoading 
  } = useConversationsOptimized();

  // Simplified service requests loading
  const { 
    data: userRequests = [], 
    isLoading: requestsLoading 
  } = useServiceRequests();

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

  // Enhanced provider details with error handling
  const { data: enhancedProviderDetails = {} } = useQuery({
    queryKey: ['enhanced-provider-details', conversations.map(c => c.provider_id)],
    queryFn: async () => {
      if (!conversations || conversations.length === 0) return {};
      
      const details: Record<string, any> = {};
      
      try {
        // Get provider details in batches to avoid overwhelming the API
        const batchSize = 5;
        for (let i = 0; i < conversations.length; i += batchSize) {
          const batch = conversations.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (conversation) => {
            try {
              const { data: providerDetail } = await supabase
                .from('service_providers')
                .select('id, name, category, address, area, city, postal_code, contact_phone, images')
                .eq('id', conversation.provider_id)
                .single();
                
              if (providerDetail) {
                details[conversation.provider_id] = providerDetail;
              }
            } catch (error) {
              console.warn(`Failed to fetch details for provider ${conversation.provider_id}:`, error);
              // Set minimal fallback data
              details[conversation.provider_id] = {
                id: conversation.provider_id,
                name: conversation.service_providers?.name || 'Unknown Provider',
                category: 'Unknown',
                area: 'Unknown',
                city: 'Unknown'
              };
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching provider details:', error);
      }
      
      return details;
    },
    enabled: conversations.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1 // Only retry once to avoid hanging
  });

  // Calculate distances with error handling
  useEffect(() => {
    const calculateDistances = async () => {
      if (!conversations || conversations.length === 0) return;

      const location = await getUserLocation();
      if (!location) return;

      setIsCalculatingDistances(true);
      try {
        // Calculate distances for conversations with provider details
        for (const conversation of conversations) {
          const providerDetail = enhancedProviderDetails[conversation.provider_id];
          if (providerDetail && !conversation.calculatedDistance) {
            try {
              const distanceData = await calculateItemDistance(location, providerDetail as ProviderWithDistance);
              conversation.calculatedDistance = distanceData?.distance || null;
            } catch (error) {
              console.warn(`Failed to calculate distance for provider ${conversation.provider_id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error calculating distances:', error);
      } finally {
        setIsCalculatingDistances(false);
      }
    };

    if (Object.keys(enhancedProviderDetails).length > 0) {
      calculateDistances();
    }
  }, [conversations, enhancedProviderDetails]);

  // Simplified unread count calculation
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    try {
      conversations.forEach(conversation => {
        const requestId = conversation.request_id;
        if (!counts[requestId]) {
          counts[requestId] = 0;
        }
        // This would need to be calculated from actual message data
        // For now, using a simplified approach
      });
    } catch (error) {
      console.warn('Error calculating unread counts:', error);
    }
    
    return counts;
  }, [conversations]);

  // Filtered conversations with error handling
  const filteredConversations = useMemo(() => {
    try {
      let filtered = conversations;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(conversation => {
          const providerDetail = enhancedProviderDetails[conversation.provider_id];
          const providerName = providerDetail?.name || conversation.service_providers?.name || '';
          const requestTitle = conversation.service_requests?.title || '';
          
          return providerName.toLowerCase().includes(searchLower) ||
                 requestTitle.toLowerCase().includes(searchLower);
        });
      }

      return filtered;
    } catch (error) {
      console.error('Error filtering conversations:', error);
      return [];
    }
  }, [conversations, enhancedProviderDetails, searchTerm]);

  // Handle call function
  const handleCall = (e: React.MouseEvent, phone?: string, providerName?: string) => {
    e.stopPropagation();
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

  // Loading state
  if (conversationsLoading || requestsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading inbox...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive py-8">
          <p className="text-lg">Please log in to view your inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
        <p className="text-muted-foreground">Manage your service requests, conversations, and provider responses</p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            Service Requests ({userRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {/* Search and filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading indicator for distance calculations */}
          {isCalculatingDistances && (
            <div className="flex items-center justify-center py-2 bg-blue-50 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Calculating distances...</span>
            </div>
          )}

          {/* Conversations list */}
          <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No conversations found</p>
                <p className="text-sm">Start by posting a service request to connect with providers.</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const providerDetails = enhancedProviderDetails[conversation.provider_id];
                const isProviderOnline = isUserOnline(conversation.service_providers?.user_id);

                return (
                  <Card key={conversation.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {providerDetails?.name || conversation.service_providers?.name || 'Unknown Provider'}
                            </h3>
                            <OnlineIndicator 
                              isOnline={isProviderOnline} 
                              size="sm" 
                            />
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            Request: {conversation.service_requests?.title || 'Unknown Request'}
                          </p>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Badge variant="secondary">
                              {providerDetails?.category || conversation.service_requests?.category || 'Unknown'}
                            </Badge>
                          </div>

                          {/* Address Information - Updated to match main shop page format */}
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {[providerDetails?.area, providerDetails?.city].filter(Boolean).join(', ') || 'Location not available'}
                            </span>
                          </div>
                          
                          {/* Distance from user - Updated formatting */}
                          {conversation.calculatedDistance !== null && conversation.calculatedDistance !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-primary py-2">
                              <Navigation className="h-4 w-4" />
                              <span className="font-medium">
                                {conversation.calculatedDistance.toFixed(1)} km away
                              </span>
                            </div>
                          )}

                          {conversation.latest_quotation && (
                            <div className="mt-2">
                              <Badge variant="secondary" className="bg-green-50 text-green-700">
                                Latest Quote: ₹{conversation.latest_quotation.toLocaleString()}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Call Button */}
                          {providerDetails?.contact_phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleCall(e, providerDetails.contact_phone, providerDetails.name)}
                              className="flex items-center gap-2"
                            >
                              <Phone className="h-4 w-4" />
                              Call
                            </Button>
                          )}

                          <Button
                            onClick={() => {
                              sessionStorage.setItem('conversationNavigationSource', 'inbox');
                              navigate(`/messages/${conversation.id}`);
                            }}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Open Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {userRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No service requests yet</p>
              <p className="text-sm mb-4">Create your first service request to find providers.</p>
              <Button onClick={() => navigate('/post-request')}>
                Post Service Request
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.category} • {request.city}
                        </p>
                      </div>
                      <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Posted {new Date(request.created_at).toLocaleDateString()}
                        {request.budget && (
                          <span className="ml-2">• Budget: ₹{request.budget.toLocaleString()}</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inbox;
