import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger, 
  SidebarHeader,
  SidebarRail,
  useSidebar
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
import { CalendarIcon, Loader2, MessageSquare, Users, Building, ArrowRight, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useMultipleConversationUnreadCounts } from '@/hooks/useConversationUnreadCount';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';

// Create a custom sidebar toggle button component that uses useSidebar
const SidebarToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === "expanded";
  
  return (
    <button 
      onClick={toggleSidebar}
      className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 z-[100] bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg transition-all duration-300",
        "flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring",
        "md:h-16 md:w-8",
        "h-14 w-7",
        "border-r border-t border-b border-primary-foreground/20",
        isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <ArrowRight size={20} className="animate-pulse" />
    </button>
  );
};

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { conversations, isLoadingConversations, conversationsError, refetchConversations, unreadCount } = useConversations();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("messages");
  const [retryCount, setRetryCount] = useState(0);
  
  // Enhanced debug logging for conversations
  useEffect(() => {
    console.log('Inbox - Conversations data:', conversations);
    console.log('Inbox - Loading state:', isLoadingConversations);
    console.log('Inbox - Error state:', conversationsError);
    console.log('Inbox - Selected request ID:', selectedRequestId);
    console.log('Inbox - User ID:', user?.id);
    
    if (conversationsError) {
      console.error('Detailed conversation error:', conversationsError);
    }
  }, [conversations, isLoadingConversations, conversationsError, selectedRequestId, user]);
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  const handleRequestClick = (requestId: string) => {
    console.log('Request clicked:', requestId);
    setSelectedRequestId(requestId);
    setActiveTab("messages");
    setRetryCount(0); // Reset retry count when switching requests
  };
  
  // Get the selected request details
  const selectedRequest = userRequests?.find(req => req.id === selectedRequestId);
  
  // Filter conversations for the selected request with debugging
  const requestConversations = conversations?.filter(
    conv => conv.request_id === selectedRequestId
  ) || [];
  
  // Get unread counts for all conversations in the selected request
  const conversationIds = requestConversations.map(conv => conv.id);
  const { data: conversationUnreadCounts = {} } = useMultipleConversationUnreadCounts(conversationIds);
  
  // Calculate total unread count for the selected request
  const requestUnreadCount = Object.values(conversationUnreadCounts).reduce((total, count) => total + count, 0);
  
  console.log('Filtered conversations for request:', selectedRequestId, requestConversations);
  console.log('Conversation unread counts:', conversationUnreadCounts);

  // Enhanced retry handler with better feedback
  const handleRetryConversations = () => {
    console.log('Retrying conversation fetch, attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    refetchConversations();
    
    toast({
      title: "Retrying...",
      description: `Attempting to reload conversations (${retryCount + 1}/3)`,
    });
  };

  // Enhanced error message based on error type
  const getErrorMessage = (error: any) => {
    if (!error) return "Unknown error occurred";
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('syntax error')) {
      return "Database query error. Please try refreshing or contact support.";
    }
    if (errorMessage.includes('timeout')) {
      return "Request timed out. Please check your connection and try again.";
    }
    if (errorMessage.includes('authentication')) {
      return "Authentication error. Please log in again.";
    }
    
    return errorMessage;
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Notification Prompt */}
        <NotificationPrompt className="mx-4 mt-4 mb-2" />
        
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-full min-h-[calc(100vh-128px)] w-full relative">
            <SidebarToggleButton />
            
            <Sidebar side="left">
              <SidebarHeader className="border-b border-border p-4">
                <h2 className="text-lg font-semibold">Your Requests</h2>
              </SidebarHeader>
              <SidebarContent>
                {
                  isLoadingUserRequests ? (
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
                )
                }
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
                        Messages ({requestConversations.length})
                        {requestUnreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                            {requestUnreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="providers">
                        <Users className="h-4 w-4 mr-2" />
                        View Providers
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="messages">
                      <div className="space-y-4">
                        {conversationsError ? (
                          <Alert variant="destructive" className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex flex-col gap-2">
                                <span className="font-medium">Failed to load messages</span>
                                <span className="text-sm">
                                  {getErrorMessage(conversationsError)}
                                </span>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button 
                                    onClick={handleRetryConversations} 
                                    variant="outline" 
                                    size="sm"
                                    disabled={retryCount >= 3}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {retryCount >= 3 ? 'Max retries reached' : `Retry (${retryCount}/3)`}
                                  </Button>
                                  <Button 
                                    onClick={() => window.location.reload()} 
                                    variant="outline" 
                                    size="sm"
                                  >
                                    <Database className="h-4 w-4 mr-2" />
                                    Refresh Page
                                  </Button>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : isLoadingConversations ? (
                          <div className="flex justify-center py-8">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Loading messages...</span>
                            </div>
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
                          requestConversations.map((conversation) => {
                            const unreadCount = conversationUnreadCounts[conversation.id] || 0;
                            
                            return (
                              <Card key={conversation.id} className={cn(
                                "relative transition-all",
                                unreadCount > 0 && "border-blue-200 bg-blue-50/30"
                              )}>
                                {unreadCount > 0 && (
                                  <div className="absolute top-2 right-2">
                                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                      {unreadCount} new
                                    </Badge>
                                  </div>
                                )}
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{conversation.service_providers.name || "Service Provider"}</span>
                                    <div className="flex items-center gap-2">
                                      {conversation.latest_quotation && (
                                        <Badge variant="secondary" className="bg-green-50 text-green-700">
                                          ₹{conversation.latest_quotation.toLocaleString()}
                                        </Badge>
                                      )}
                                    </div>
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
                                        <p className="text-sm font-medium mt-1 text-green-600">
                                          Latest quotation: ₹{conversation.latest_quotation.toLocaleString()}
                                        </p>
                                      )}
                                      {unreadCount > 0 && (
                                        <p className="text-sm font-medium mt-1 text-blue-600">
                                          {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm" 
                                        className={cn(
                                          "ml-2",
                                          unreadCount > 0 && "bg-blue-600 hover:bg-blue-700"
                                        )}
                                        onClick={() => window.location.href = `/messages/${conversation.id}`}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        {unreadCount > 0 ? 'View New Messages' : 'View Chat'}
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
                    
                    <TabsContent value="providers">
                      <div className="border rounded-lg p-4 shadow-sm">
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

export default Inbox;
