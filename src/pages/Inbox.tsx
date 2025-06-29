
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Calendar, MapPin, Users, Clock, Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MatchingProvidersDialog } from '@/components/request/MatchingProvidersDialog';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';
import InboxFilters from '@/components/InboxFilters';
import { useConversationUnreadCount } from '@/hooks/useConversationUnreadCount';
import { useServiceProviderUnreadCount } from '@/hooks/useServiceProviderUnreadCount';
import { useWishlist } from '@/contexts/WishlistContext';
import WishlistBusinessCard from '@/components/business/WishlistBusinessCard';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  area: string;
  city: string;
  status: string;
  created_at: string;
}

interface Conversation {
  id: string;
  request_id: string;
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  last_message: string;
  last_message_at: string;
  provider_images: string[];
  provider_area: string;
  provider_city: string;
  provider_contact_phone: string;
}

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations } = useConversations();
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showProvidersDialog, setShowProvidersDialog] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    city: 'all',
  });

  // Convert provider data to business object for wishlist
  const convertProviderToBusiness = (provider: any) => {
    return {
      id: provider.provider_id || provider.id,
      name: provider.provider_name || provider.name,
      category: provider.provider_category || provider.category,
      subcategory: provider.provider_subcategory ? [provider.provider_subcategory] : [], // Convert to array
      description: provider.description || '',
      area: provider.area || '',
      city: provider.city || '',
      contact_phone: provider.contact_phone || '',
      images: provider.images || [],
      address: provider.address || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'business' as const
    };
  };

  // Handle wishlist toggle for providers
  const handleProviderWishlistToggle = (e: React.MouseEvent, provider: any) => {
    e.stopPropagation();
    const businessItem = convertProviderToBusiness(provider);
    toggleWishlist(businessItem);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  const filteredRequests = userRequests.filter(request => {
    if (filters.status !== 'all' && request.status !== filters.status) {
      return false;
    }
    if (filters.category !== 'all' && request.category !== filters.category) {
      return false;
    }
    if (filters.city !== 'all' && request.city !== filters.city) {
      return false;
    }
    return true;
  });

  const getConversationsForRequest = (requestId: string) => {
    return conversations.filter(conversation => conversation.request_id === requestId);
  };

  const { data: unreadCount, isLoading: unreadCountsLoading } = useConversationUnreadCount(
    conversations.map(c => c.id).join(',')
  );

  const getUnreadCount = (conversationId: string) => {
    return unreadCountsLoading ? 0 : unreadCount || 0;
  };

  const { data: totalUnreadCount } = useServiceProviderUnreadCount();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your inbox</h2>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Inbox</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <Tabs defaultValue="requests" className="h-full flex flex-col">
                <div className="px-4 pb-3">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="requests" className="text-xs">
                      Your Requests
                      {totalUnreadCount > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs px-1 py-0 min-w-[16px] h-4">
                          {totalUnreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="wishlist" className="text-xs">
                      Wishlist
                      {wishlist.filter(item => item.type === 'business').length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 min-w-[16px] h-4">
                          {wishlist.filter(item => item.type === 'business').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="requests" className="flex-1 mt-0 px-4 pb-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      <InboxFilters
                        onFilterChange={handleFilterChange}
                        requests={userRequests}
                      />
                      {filteredRequests.map((request) => (
                        <div key={request.id} className="space-y-2">
                          <Card 
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setSelectedRequest(request.id);
                              setShowRequestDetails(true);
                            }}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm line-clamp-1">{request.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {request.status}
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {request.description}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <MapPin className="h-3 w-3" />
                                <span>{request.area}, {request.city}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRequest(request.id);
                                      setShowProvidersDialog(true);
                                    }}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Providers
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Conversations for this request */}
                          {getConversationsForRequest(request.id).map((conversation) => (
                            <Card 
                              key={conversation.id}
                              className="ml-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary/20"
                              onClick={() => {
                                sessionStorage.setItem('conversationNavigationSource', 'inbox');
                                navigate(`/messages/${conversation.id}`);
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex gap-3">
                                  {/* Provider Images with Wishlist Icon */}
                                  <div className="relative w-12 h-12 flex-shrink-0">
                                    <ProviderImageCarousel 
                                      images={conversation.service_providers?.images || []}
                                      providerName={conversation.service_providers?.name || 'Provider'}
                                      className="w-12 h-12 rounded-md overflow-hidden"
                                    />
                                    {/* Wishlist Heart Icon */}
                                    <button
                                      onClick={(e) => handleProviderWishlistToggle(e, {
                                        provider_id: conversation.provider_id,
                                        provider_name: conversation.service_providers?.name,
                                        provider_category: conversation.service_requests?.category,
                                        provider_subcategory: conversation.service_requests?.subcategory,
                                        images: conversation.service_providers?.images || [],
                                        area: '',
                                        city: '',
                                        contact_phone: ''
                                      })}
                                      className="absolute -top-1 -left-1 p-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all duration-200 z-10"
                                      title={isInWishlist(conversation.provider_id || '', 'business') ? "Remove from wishlist" : "Add to wishlist"}
                                    >
                                      <Heart 
                                        className={`h-3 w-3 transition-colors ${
                                          isInWishlist(conversation.provider_id || '', 'business')
                                            ? 'fill-red-500 text-red-500' 
                                            : 'text-gray-600 hover:text-red-500'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-medium text-sm truncate">
                                        {conversation.service_providers?.name || 'Provider'}
                                      </h4>
                                      {getUnreadCount(conversation.id) > 0 && (
                                        <Badge variant="destructive" className="text-xs px-1 py-0 min-w-[16px] h-4">
                                          {getUnreadCount(conversation.id)}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <Badge variant="secondary" className="text-xs mb-1">
                                      {conversation.service_requests?.category || 'Service'}
                                    </Badge>
                                    
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                                      </span>
                                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="wishlist" className="flex-1 mt-0 px-4 pb-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {wishlist.filter(item => item.type === 'business').length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-lg font-medium mb-2">Your wishlist is empty</p>
                          <p className="text-sm">Save businesses you like to see them here</p>
                        </div>
                      ) : (
                        wishlist
                          .filter(item => item.type === 'business')
                          .map((business) => (
                            <WishlistBusinessCard 
                              key={business.id} 
                              business={business as any}
                            />
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to your Inbox</h3>
                <p className="text-sm">
                  Select a conversation from the sidebar to start chatting with service providers, 
                  or view your service requests and their matching providers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MatchingProvidersDialog
        requestId={selectedRequest}
        open={showProvidersDialog}
        onOpenChange={setShowProvidersDialog}
      />

      <RequestDetailsDialog
        request={filteredRequests.find(r => r.id === selectedRequest) || null}
        open={showRequestDetails}
        onOpenChange={setShowRequestDetails}
      />
    </div>
  );
};

export default Inbox;
