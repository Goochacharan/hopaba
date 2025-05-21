
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
import { MatchingProvidersContent } from '@/components/request/MatchingProvidersDialog';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, MessageSquare, Users, Building, ArrowRight } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

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
          <div className="flex h-full min-h-[calc(100vh-128px)] w-full relative">
            {/* Custom sidebar toggle button that's visible when sidebar is collapsed */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground p-2 rounded-r-md shadow-md transition-opacity",
                "flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring",
                "md:h-12 md:w-6",
                "h-10 w-5",
                sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
              aria-label="Open sidebar"
            >
              <ArrowRight size={18} />
            </button>
            
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
                                  {conversation.service_providers.name || "Service Provider"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Last message: {conversation.last_message_at ? 
                                        format(new Date(conversation.last_message_at), 'MMM d, yyyy, h:mm a') : 
                                        "No messages yet"}
                                    </p>
                                    {conversation.latest_quotation && (
                                      <p className="text-sm font-medium mt-1">
                                        Latest quotation: ₹{conversation.latest_quotation}
                                      </p>
                                    )}
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

// Types
interface MatchingProviderResult {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  user_id: string;
}

export default Inbox;
