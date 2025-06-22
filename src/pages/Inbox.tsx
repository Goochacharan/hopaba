import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, MapPin, User, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { distanceService, type Location } from '@/services/distanceService';
import { calculateItemDistance, type ProviderWithDistance } from '@/utils/locationFilterUtils';
import { useInboxFilters } from '@/hooks/useSearchFilters';
import InboxFilters from '@/components/InboxFilters';

interface Conversation {
  id: string;
  user_id: string;
  provider_id: string;
  request_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  city: string;
  area: string;
  postal_code: string;
}

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  subcategory: string[];
  address: string;
  city: string;
  area: string;
  postal_code: string;
}

interface ConversationWithDetails {
  id: string;
  user_id: string;
  provider_id: string;
  request_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  service_requests: {
    title: string;
    description: string;
    category: string;
    subcategory: string;
    city: string;
    area: string;
    postal_code: string;
  } | null;
  service_providers: {
    name: string;
    category: string;
    subcategory: string[];
    address: string;
    city: string;
    area: string;
    postal_code: string;
  } | null;
  latest_quotation: {
    pricing_type: string;
    quotation_price: number;
    wholesale_price: number;
    negotiable_price: number;
  } | null;
}

interface ConversationWithDistance extends ConversationWithDetails {
  calculatedDistance?: number | null;
  distanceText?: string | null;
}

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations } = useConversations();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  const [conversationsWithDistance, setConversationsWithDistance] = useState<ConversationWithDistance[]>([]);
  
  // Initialize inbox filters
  const { filters: inboxFilters, setters: inboxSetters } = useInboxFilters();

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

  const calculateDistancesForConversations = async (convs: ConversationWithDetails[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const conversationsWithDist: ConversationWithDistance[] = await Promise.all(
        convs.map(async (conversation) => {
          const providerDetails = conversation.service_providers;
          
          if (!providerDetails) {
            return {
              ...conversation,
              calculatedDistance: null,
              distanceText: null
            };
          }

          const distanceData = await calculateItemDistance(userLoc, providerDetails as ProviderWithDistance);
          
          return {
            ...conversation,
            calculatedDistance: distanceData?.distance || null,
            distanceText: distanceData?.distanceText || null
          };
        })
      );
      
      setConversationsWithDistance(conversationsWithDist);
    } catch (error) {
      console.error('Failed to calculate distances:', error);
      setConversationsWithDistance(convs.map(conv => ({
        ...conv,
        calculatedDistance: null,
        distanceText: null
      })));
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  const { data: conversationsWithDetails, isLoading, error } = useQuery({
    queryKey: ['conversations-with-details', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          provider_id,
          request_id,
          last_message_at,
          created_at,
          updated_at,
          service_requests (
            title,
            description,
            category,
            subcategory,
            city,
            area,
            postal_code
          ),
          service_providers (
            name,
            category,
            subcategory,
            address,
            city,
            area,
            postal_code
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get unread counts for each conversation
      const conversationsWithUnreadCounts = await Promise.all(
        (data || []).map(async (conversation) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('sender_type', 'provider')
            .eq('read', false);

          // Get latest quotation for each conversation
          const { data: latestQuotationData } = await supabase
            .from('messages')
            .select('pricing_type, quotation_price, wholesale_price, negotiable_price')
            .eq('conversation_id', conversation.id)
            .not('quotation_price', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conversation,
            unread_count: count || 0,
            latest_quotation: latestQuotationData || null
          };
        })
      );

      return conversationsWithUnreadCounts as ConversationWithDetails[];
    },
    enabled: !!user?.id,
  });

  // Calculate distances when conversations are loaded
  useEffect(() => {
    const calculateDistances = async () => {
      if (!conversationsWithDetails || conversationsWithDetails.length === 0) {
        setConversationsWithDistance([]);
        return;
      }

      const location = await getUserLocation();
      if (!location) {
        setConversationsWithDistance(conversationsWithDetails.map(conv => ({
          ...conv,
          calculatedDistance: null,
          distanceText: null
        })));
        return;
      }

      await calculateDistancesForConversations(conversationsWithDetails, location);
    };

    calculateDistances();
  }, [conversationsWithDetails]);

  // Apply filters and sorting
  const filteredAndSortedConversations = useMemo(() => {
    const conversationsToFilter = conversationsWithDistance.length > 0 
      ? conversationsWithDistance 
      : (conversationsWithDetails || []).map(conv => ({
          ...conv,
          calculatedDistance: null,
          distanceText: null
        }));

    // Apply filters
    let filtered = conversationsToFilter.filter(conversation => {
      const providerDetails = conversation.service_providers;
      const requestDetails = conversation.service_requests;
      
      // Apply status filter
      if (inboxFilters.status !== 'all') {
        if (inboxFilters.status === 'unread' && conversation.unread_count === 0) {
          return false;
        }
        if (inboxFilters.status === 'read' && conversation.unread_count > 0) {
          return false;
        }
      }
      
      // Apply category filter
      if (inboxFilters.category.trim() !== '') {
        const categoryMatches = 
          (providerDetails?.category?.toLowerCase().includes(inboxFilters.category.toLowerCase())) ||
          (requestDetails?.category?.toLowerCase().includes(inboxFilters.category.toLowerCase()));
        if (!categoryMatches) {
          return false;
        }
      }
      
      return true;
    });

    // Sort the filtered conversations
    const sorted = [...filtered].sort((a, b) => {
      switch (inboxFilters.sortBy) {
        case 'distance':
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        case 'oldest':
          return new Date(a.last_message_at).getTime() - new Date(b.last_message_at).getTime();
        case 'newest':
        default:
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
    });

    return sorted;
  }, [conversationsWithDistance, conversationsWithDetails, inboxFilters]);

  const handleConversationClick = (conversationId: string) => {
    sessionStorage.setItem('conversationNavigationSource', 'inbox');
    navigate(`/messages/${conversationId}`);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your messages</h1>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Error loading conversations. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
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
          status={inboxFilters.status}
          setStatus={inboxSetters.setStatus}
          category={inboxFilters.category}
          setCategory={inboxSetters.setCategory}
          isLocationEnabled={!!userLocation}
        />
      </div>

      {/* Loading indicator for distance calculations */}
      {isCalculatingDistances && (
        <div className="flex items-center justify-center py-4 mb-4 bg-blue-50 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Calculating distances...</span>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              When you contact service providers, your conversations will appear here.
            </p>
            <Button onClick={() => navigate('/requests')}>
              Browse Service Requests
            </Button>
          </div>
        ) : (
          filteredAndSortedConversations.map((conversation) => {
            const requestDetails = conversation.service_requests;
            const providerDetails = conversation.service_providers;
            const hasUnreadMessages = conversation.unread_count > 0;

            return (
              <Card 
                key={conversation.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${hasUnreadMessages ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''}`}
                onClick={() => handleConversationClick(conversation.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {providerDetails ? (
                        <>
                          <User className="h-5 w-5" />
                          {providerDetails.name}
                        </>
                      ) : (
                        'Service Provider'
                      )}
                      {hasUnreadMessages && (
                        <Badge variant="destructive" className="ml-2">
                          {conversation.unread_count} new
                        </Badge>
                      )}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {requestDetails && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Service Request:</h4>
                      <p className="font-medium">{requestDetails.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {requestDetails.description}
                      </p>
                    </div>
                  )}
                  
                  {providerDetails && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {providerDetails.area}, {providerDetails.city}
                        {providerDetails.postal_code && (
                          <span className="text-xs ml-1">({providerDetails.postal_code})</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Distance from user */}
                  {conversation.calculatedDistance !== null && conversation.calculatedDistance !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Navigation className="h-4 w-4" />
                      <span className="font-medium">
                        {conversation.calculatedDistance.toFixed(1)} km away
                      </span>
                    </div>
                  )}

                  {/* Latest Quotation Display */}
                  {conversation.latest_quotation && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Latest Quote:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-700">
                          ₹{conversation.latest_quotation.quotation_price?.toLocaleString()}
                        </span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {conversation.latest_quotation.pricing_type || 'Fixed'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Inbox;
