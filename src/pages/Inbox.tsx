import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversationsOptimized } from '@/hooks/useConversationsOptimized';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, Clock, MapPin, Star, Navigation, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedDistance } from '@/hooks/useUnifiedDistance';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import { useBusinessReviews } from '@/hooks/useBusinessReviews';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { usePresence } from '@/hooks/usePresence';
import { useInboxFilters } from '@/hooks/useSearchFilters';

type ConversationWithDistance = {
  id: string;
  user_id: string;
  provider_id: string;
  request_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  service_requests: any;
  service_providers: any;
  latest_quotation: any;
  calculatedDistance?: number | null;
  distanceText?: string | null;
};

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get user requests
  const { 
    userRequests, 
    isLoadingUserRequests, 
    userRequestsError 
  } = useServiceRequests();
  
  // Get conversations with optimized loading
  const {
    conversations,
    unreadCount,
    isLoading: isLoadingConversations,
    markMessagesAsRead
  } = useConversationsOptimized();

  // Distance calculation
  const { userLocation, calculateDistances } = useUnifiedDistance();
  
  // State for distance-enhanced conversations
  const [conversationsWithDistance, setConversationsWithDistance] = useState<ConversationWithDistance[]>([]);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);

  // Use the inbox filters hook
  const { filters, setters } = useInboxFilters();

  // Add presence tracking for online status
  const { isUserOnline } = usePresence('general');

  // Calculate distances when conversations or user location changes
  useEffect(() => {
    const calculateConversationDistances = async () => {
      if (!conversations || conversations.length === 0) {
        setConversationsWithDistance([]);
        return;
      }

      if (!userLocation) {
        // If no user location, just set conversations without distance but preserve all properties
        const conversationsWithoutDistance = conversations.map(conv => ({
          ...conv,
          unread_count: 0, // Add default unread_count since it might be missing from the original data
          calculatedDistance: null,
          distanceText: null
        }));
        setConversationsWithDistance(conversationsWithoutDistance);
        return;
      }

      setIsCalculatingDistances(true);
      try {
        // Prepare business location data for distance calculation
        const businessLocationData = conversations.map(conv => ({
          id: conv.provider_id,
          name: conv.service_providers?.name || 'Unknown',
          latitude: conv.service_providers?.latitude,
          longitude: conv.service_providers?.longitude,
          address: conv.service_providers?.address,
          area: conv.service_providers?.area,
          city: conv.service_providers?.city,
          postal_code: conv.service_providers?.postal_code
        }));

        // Calculate distances
        const distanceResults = await calculateDistances(businessLocationData);

        // Enhance conversations with distance data while preserving all original properties
        const enhancedConversations = conversations.map(conv => {
          const distanceResult = distanceResults.get(conv.provider_id);
          return {
            ...conv,
            unread_count: 0, // Add default unread_count since it might be missing from the original data
            calculatedDistance: distanceResult?.distance || null,
            distanceText: distanceResult?.distanceText || null
          };
        });

        setConversationsWithDistance(enhancedConversations);
      } catch (error) {
        console.error('Error calculating distances for conversations:', error);
        // Fallback to conversations without distance data but preserve all properties
        const conversationsWithoutDistance = conversations.map(conv => ({
          ...conv,
          unread_count: 0, // Add default unread_count since it might be missing from the original data
          calculatedDistance: null,
          distanceText: null
        }));
        setConversationsWithDistance(conversationsWithoutDistance);
      } finally {
        setIsCalculatingDistances(false);
      }
    };

    calculateConversationDistances();
  }, [conversations, userLocation, calculateDistances]);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    if (!conversationsWithDistance) return [];
    
    let filtered = [...conversationsWithDistance];

    // Apply filters
    if (filters.sortBy !== 'latest') {
      filtered = filtered.filter(conv => {
        if (filters.sortBy === 'rating') {
          return conv.unread_count > 0;
        }
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
            return a.calculatedDistance - b.calculatedDistance;
          }
          if (a.calculatedDistance !== null) return -1;
          if (b.calculatedDistance !== null) return 1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        case 'rating':
          return new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime();
        case 'latest':
        default:
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
    });

    return filtered;
  }, [conversationsWithDistance, filters]);

  // Filter user requests
  const filteredRequests = useMemo(() => {
    if (!userRequests) return [];
    
    let filtered = [...userRequests];

    // Sort by creation date (most recent first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [userRequests]);

  const handleConversationClick = async (conversation: ConversationWithDistance) => {
    try {
      // Mark messages as read
      await markMessagesAsRead(conversation.id, 'user');
      
      // Navigate to the conversation
      sessionStorage.setItem('conversationNavigationSource', 'inbox');
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error opening conversation:', error);
      toast({
        title: "Error",
        description: "Failed to open conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRequestClick = (requestId: string) => {
    navigate(`/requests/${requestId}`);
  };

  // Handle call functionality
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your inbox</h1>
          <Button onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = isLoadingConversations || isLoadingUserRequests;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Manage your conversations and service requests
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Distance calculation indicator */}
      {isCalculatingDistances && (
        <div className="flex items-center justify-center py-2 bg-blue-50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Calculating distances...</span>
        </div>
      )}

      <Tabs defaultValue="messages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            My Requests
            {filteredRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filteredRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  When you start chatting with service providers, your conversations will appear here.
                </p>
                <Button onClick={() => navigate('/requests')}>
                  Post a Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredConversations.map((conversation) => {
                const provider = conversation.service_providers;
                const request = conversation.service_requests;
                const lastMessageTime = formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true });
                const isProviderOnline = isUserOnline(provider?.user_id);

                return (
                  <Card 
                    key={conversation.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{provider?.name || 'Unknown Provider'}</CardTitle>
                            <OnlineIndicator 
                              isOnline={isProviderOnline} 
                              size="sm" 
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Request: {request?.title || 'Unknown Request'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {provider?.area && provider?.city ? 
                                `${provider.area}, ${provider.city}` : 
                                'Location not specified'
                              }
                            </span>
                          </div>
                          {conversation.calculatedDistance !== null && conversation.calculatedDistance !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <Navigation className="h-4 w-4" />
                              <span>{conversation.calculatedDistance.toFixed(1)} km away</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-muted-foreground">{lastMessageTime}</span>
                          {conversation.latest_quotation && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              ₹{conversation.latest_quotation.toLocaleString()}
                            </Badge>
                          )}
                          {provider?.contact_phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleCall(e, provider.contact_phone, provider.name)}
                              className="h-8"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No service requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first service request to get started with finding providers.
                </p>
                <Button onClick={() => navigate('/post-request')}>
                  Post a Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => {
                const createdTime = formatDistanceToNow(new Date(request.created_at), { addSuffix: true });
                
                return (
                  <Card 
                    key={request.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRequestClick(request.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{request.category}</Badge>
                            {request.subcategory && (
                              <Badge variant="secondary">{request.subcategory}</Badge>
                            )}
                            <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{request.area}, {request.city}</span>
                          </div>
                          {request.budget && (
                            <p className="text-sm text-muted-foreground">
                              Budget: ₹{request.budget.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-muted-foreground">{createdTime}</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
