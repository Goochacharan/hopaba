
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversationsOptimized } from '@/hooks/useConversationsOptimized';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Eye, Calendar, MapPin, Phone, Users, Bookmark } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';
import { MatchingProvidersDialog } from '@/components/request/MatchingProvidersDialog';
import { ProviderImageCarousel } from '@/components/providers/ProviderImageCarousel';
import { SavedQuotationsList } from '@/components/messaging/SavedQuotationsList';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { conversations, isLoading: isLoadingConversations } = useConversationsOptimized();
  const { serviceRequests, isLoading: isLoadingRequests } = useServiceRequests();
  
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showMatchingProviders, setShowMatchingProviders] = useState(false);

  // Filter conversations to show only those belonging to the current user
  const userConversations = useMemo(() => {
    if (!conversations || !user) return [];
    return conversations.filter(conv => conv.user_id === user.id);
  }, [conversations, user]);

  // Sort conversations by last message time
  const sortedConversations = useMemo(() => {
    return [...userConversations].sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
  }, [userConversations]);

  // Filter and sort service requests (newest first)
  const sortedRequests = useMemo(() => {
    if (!serviceRequests) return [];
    return [...serviceRequests]
      .filter(request => request.user_id === user?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [serviceRequests, user?.id]);

  const handleConversationClick = (conversationId: string) => {
    sessionStorage.setItem('conversationNavigationSource', 'inbox');
    navigate(`/messages/${conversationId}`);
  };

  const handleViewRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowRequestDetails(true);
  };

  const handleViewProviders = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowMatchingProviders(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your inbox and service requests.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">Manage your conversations, requests, and saved quotations</p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {sortedConversations.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sortedConversations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            My Requests
            {sortedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sortedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Providers
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingConversations ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p>Start a conversation with service providers to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex items-center space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleConversationClick(conversation.id)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {(conversation.service_providers?.name || 'SP').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {conversation.service_providers?.name || 'Service Provider'}
                          </h3>
                          <span className="text-sm text-muted-foreground ml-2">
                            {format(parseISO(conversation.last_message_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Request: {conversation.service_requests?.title || 'Service Request'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {conversation.service_providers?.category || 'Service'}
                          </Badge>
                          {conversation.service_providers?.city && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {conversation.service_providers.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Service Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No service requests yet</h3>
                  <p>Create your first service request to find providers.</p>
                  <Button className="mt-4" onClick={() => navigate('/post-request')}>
                    Post a Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(parseISO(request.created_at), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {request.area}, {request.city}
                              </div>
                              {request.contact_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {request.contact_phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={request.status === 'open' ? 'default' : 'secondary'}
                            className="ml-4"
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{request.category}</Badge>
                          {request.subcategory && (
                            <Badge variant="secondary">{request.subcategory}</Badge>
                          )}
                          {request.budget && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Budget: ₹{request.budget.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {request.description}
                        </p>
                        
                        {request.images && request.images.length > 0 && (
                          <ProviderImageCarousel 
                            images={request.images}
                            providerName="Request Images"
                            className="max-w-md"
                          />
                        )}
                        
                        <Separator />
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRequest(request.id)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleViewProviders(request.id)}
                            className="flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            View Matching Providers
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Service Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a request to view providers</h3>
                <p>Go to "My Requests" tab and click "View Matching Providers" on any request.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Quotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SavedQuotationsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <RequestDetailsDialog
        requestId={selectedRequestId}
        open={showRequestDetails}
        onOpenChange={setShowRequestDetails}
        providerId=""
      />

      {/* Matching Providers Dialog */}
      <MatchingProvidersDialog
        requestId={selectedRequestId}
        open={showMatchingProviders}
        onOpenChange={setShowMatchingProviders}
      />
    </div>
  );
};

export default Inbox;
