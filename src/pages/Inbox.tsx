
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger, 
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchingProvidersDialog } from '@/components/request/MatchingProvidersDialog';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, MessageSquare, Users } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { conversations, isLoadingConversations } = useConversations();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("messages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  const handleRequestClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setActiveTab("messages");
    
    // Close sidebar on mobile when a request is selected
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  // Get the selected request details
  const selectedRequest = userRequests?.find(req => req.id === selectedRequestId);
  
  // Filter conversations for the selected request
  const requestConversations = conversations?.filter(
    conv => conv.request_id === selectedRequestId
  ) || [];
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <SidebarProvider defaultOpen={true} open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <div className="flex h-full min-h-[calc(100vh-128px)] w-full">
            <Sidebar side="left">
              <SidebarHeader className="border-b border-border p-4">
                <h2 className="text-lg font-semibold">Your Requests</h2>
              </SidebarHeader>
              <SidebarContent>
                {isLoadingUserRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !userRequests?.length ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No service requests yet.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {userRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => handleRequestClick(request.id)}
                        className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                          selectedRequestId === request.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium truncate">{request.title}</h3>
                          <Badge variant={request.status === 'open' ? 'default' : 'secondary'} className="ml-2">
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-1 mb-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Category:</span> {request.category}
                          {request.subcategory && (
                            <span> / {request.subcategory}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </SidebarContent>
              <SidebarRail />
            </Sidebar>
            
            <div className="flex-1 overflow-auto p-4">
              {!selectedRequestId ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <h2 className="text-xl font-medium">Select a Request</h2>
                  <p className="text-muted-foreground max-w-md">
                    Choose a service request from the sidebar to view messages and matching providers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold">{selectedRequest?.title}</h1>
                      <p className="text-muted-foreground text-sm">
                        {selectedRequest?.category} {selectedRequest?.subcategory ? `/ ${selectedRequest.subcategory}` : ''}
                      </p>
                    </div>
                    <SidebarTrigger className="md:hidden" />
                  </div>
                  
                  <Tabs defaultValue="messages" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="messages">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </TabsTrigger>
                      <TabsTrigger value="providers">
                        <Users className="h-4 w-4 mr-2" />
                        View Providers
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="messages">
                      <div className="space-y-4">
                        {isLoadingConversations ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : requestConversations.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                            <h3 className="text-lg font-medium">No messages yet</h3>
                            <p className="text-muted-foreground mb-4">
                              You haven't received any messages for this request.
                            </p>
                            <Button 
                              onClick={() => setActiveTab("providers")} 
                              variant="outline" 
                              className="mt-2"
                            >
                              Find Service Providers
                            </Button>
                          </div>
                        ) : (
                          requestConversations.map((conversation) => (
                            <Card key={conversation.id}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">
                                  {conversation.provider_name || "Service Provider"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Last message: {conversation.last_message_text || "No messages yet"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {conversation.last_message_at && format(
                                        new Date(conversation.last_message_at), 
                                        'MMM d, yyyy, h:mm a'
                                      )}
                                    </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="ml-2"
                                    onClick={() => window.location.href = `/messages/${conversation.id}`}
                                  >
                                    View Chat
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="providers">
                      <div className="border rounded-lg p-4 shadow-sm">
                        {/* Reuse the content from MatchingProvidersDialog without the dialog wrapper */}
                        {selectedRequestId && (
                          <MatchingProvidersContent requestId={selectedRequestId} />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </SidebarProvider>
      </div>
    </MainLayout>
  );
};

// Component to display matching providers content without the dialog wrapper
const MatchingProvidersContent: React.FC<{ requestId: string }> = ({ requestId }) => {
  const { user } = useAuth();
  const { conversations, createConversation, isCreatingConversation } = useConversations();
  const [contactedProviders, setContactedProviders] = useState<Set<string>>(new Set());

  // Function to check if the provider already has a conversation for this request
  const hasExistingConversation = (providerId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  };

  // Fetch matching providers using the database function
  const { data: matchingProviders, isLoading, error, refetch } = useQuery({
    queryKey: ['matchingProviders', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .rpc('get_matching_providers_for_request', { request_id: requestId });
        
      if (error) {
        console.error("Error fetching matching providers:", error);
        throw error;
      }
      
      console.log("Matching providers found:", data);
      return data as MatchingProviderResult[];
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

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-xl font-semibold">Matching Service Providers</h2>
        <p className="text-sm text-muted-foreground">
          These providers match your service request category and can help you.
        </p>
      </div>
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-4 flex flex-col items-center gap-2">
            <p>Error loading matching providers.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : !matchingProviders || matchingProviders.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No matching service providers found for your request.
          </div>
        ) : (
          matchingProviders.map((provider) => {
            const isContacted = hasExistingConversation(provider.provider_id) || 
                                contactedProviders.has(provider.provider_id);
                                
            return (
              <Card key={provider.provider_id} className="overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    {provider.provider_name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary">{provider.provider_category}</Badge>
                    {provider.provider_subcategory && (
                      <Badge variant="outline">{provider.provider_subcategory}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm text-muted-foreground">
                  <p>This service provider specializes in {provider.provider_category.toLowerCase()}
                  {provider.provider_subcategory ? ` with focus on ${provider.provider_subcategory.toLowerCase()}` : ''}.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end pt-2 gap-2">
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
      </div>
    </div>
  );
};

// Types
interface MatchingProviderResult {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  user_id: string;
}

// Make sure to add these imports at the top
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default Inbox;
