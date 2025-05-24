import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { useConversations } from '@/hooks/useConversations';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';

// Import refactored components
import MessagesList from '@/components/messaging/MessagesList';
import RequestConversationsPanel from '@/components/messaging/RequestConversationsPanel';
import MessageInput from '@/components/messaging/MessageInput';
import ConversationHeader from '@/components/messaging/ConversationHeader';
import ServiceProviderDashboard from '@/components/messaging/ServiceProviderDashboard';

const Messages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [quotationMode, setQuotationMode] = useState(false);
  const [quotationPrice, setQuotationPrice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('requests');
  
  // Initialize presence tracking for the current conversation
  usePresence(id ? `conversation-${id}` : 'general');
  
  const { 
    getConversationWithMessages,
    sendMessage,
    isSendingMessage,
    markMessagesAsRead 
  } = useConversations();

  // Check for quotationMode param in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldActivateQuotation = queryParams.get('quotationMode') === 'true';
    
    if (shouldActivateQuotation) {
      setQuotationMode(true);
      
      // Clean up the URL by removing the parameter
      const newUrl = `${location.pathname}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  // Fetch user's role (whether they're a service provider or not)
  const { data: providerData, isLoading: isLoadingProviderData } = useQuery({
    queryKey: ['provider-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id, category, subcategory')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Provider data fetched:', data);
      return data;
    },
    enabled: !!user,
    staleTime: 60000 // Cache for 1 minute to prevent frequent refetching
  });
  
  // User is a service provider if they have a provider record
  const isServiceProvider = !!providerData;
  
  // Debug logging
  useEffect(() => {
    console.log('User is service provider:', isServiceProvider);
    console.log('Provider data:', providerData);
  }, [isServiceProvider, providerData]);
  
  // Fetch conversation with messages when in single conversation view
  const { 
    data: conversationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationWithMessages(id!),
    enabled: !!id && !!user,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: undefined, // Don't automatically poll
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes (garbage collection time)
  });
  
  // Determine if current user is the service provider or the requester
  const isProvider = conversationData?.conversation?.service_providers?.user_id === user?.id;
  
  // Get the name of the other party
  const otherPartyName = isProvider 
    ? "Requester" // If we're the provider, the other party is the requester
    : conversationData?.conversation?.service_providers?.name || "Provider"; // Otherwise it's the provider
  
  // Optimized: Mark messages as read with debouncing to prevent excessive API calls
  useEffect(() => {
    if (!id || !user || !conversationData) return;
    
    // Use a timeout to debounce API calls
    const timeoutId = setTimeout(() => {
      console.log('Marking messages as read (optimized):', { id, isProvider });
      markMessagesAsRead(id, isProvider ? 'provider' : 'user');
    }, 2000); // Increased debounce to 2 seconds to further reduce API calls
    
    // Clean up the timeout if the component unmounts or dependencies change
    return () => clearTimeout(timeoutId);
  }, [id, user, conversationData, markMessagesAsRead, isProvider]);
  
  const handleSendMessage = () => {
    if (!id || !user) {
      console.error('Cannot send message: Missing conversation ID or user');
      return;
    }
    
    if (quotationMode && (!quotationPrice.trim() || isNaN(parseFloat(quotationPrice)))) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your quotation.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Sending message:', { 
      conversationId: id,
      senderType: isProvider ? 'provider' : 'user',
      hasQuotation: quotationMode && !!quotationPrice
    });
    
    const messageContent = message.trim();
    let parsedQuotationPrice: number | undefined = undefined;
    
    if (quotationMode && quotationPrice.trim()) {
      parsedQuotationPrice = parseFloat(quotationPrice);
      if (isNaN(parsedQuotationPrice)) {
        console.error('Invalid quotation price:', quotationPrice);
        return;
      }
    }
    
    try {
      sendMessage({
        conversationId: id,
        content: messageContent,
        senderType: isProvider ? 'provider' : 'user',
        quotationPrice: parsedQuotationPrice
      });
      
      setMessage('');
      if (quotationMode && parsedQuotationPrice !== undefined) {
        setQuotationMode(false);
        setQuotationPrice('');
      }
      
      // Don't force an immediate refetch - the real-time subscription will handle this
      // This prevents duplicate API calls as the subscription already triggers a refresh
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // If we're not viewing a specific conversation, show the list of requests and conversations
  if (!id) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">My Messages</h1>
            <p className="text-muted-foreground">
              {isServiceProvider 
                ? "Manage service requests and client communications" 
                : "View your service requests and conversations with providers"}
            </p>
          </div>
          
          <Tabs defaultValue={isServiceProvider ? "provider" : "requests"} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="conversations">All Conversations</TabsTrigger>
              {isServiceProvider && (
                <TabsTrigger value="provider">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Service Requests
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="requests">
              <RequestConversationsPanel />
            </TabsContent>
            
            <TabsContent value="conversations">
              <div className="space-y-4">
                <RequestConversationsPanel showAllConversations />
              </div>
            </TabsContent>
            
            {isServiceProvider && (
              <TabsContent value="provider">
                {providerData && (
                  <ServiceProviderDashboard 
                    providerId={providerData.id}
                    category={providerData.category}
                    subcategory={providerData.subcategory}
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Conversation</h2>
          <p className="text-muted-foreground mb-6">
            There was a problem loading this conversation.
          </p>
          <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)]">
        {/* Notification Prompt */}
        <NotificationPrompt className="mx-4 mt-4 mb-2" />
        
        {/* Header */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversationData ? (
          <>
            <ConversationHeader 
              otherPartyName={otherPartyName}
              conversation={conversationData.conversation}
              requestInfo={conversationData.conversation.service_requests}
            />
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto">
              {conversationData.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                    <p className="text-muted-foreground">
                      Start the conversation by sending a message.
                    </p>
                  </div>
                </div>
              ) : (
                <MessagesList 
                  messages={conversationData.messages} 
                  userId={user?.id || ''}
                  otherPartyName={otherPartyName}
                  isProvider={isProvider}
                  businessName={conversationData.conversation.service_providers?.name}
                  providerId={conversationData.conversation.provider_id}
                />
              )}
            </div>
            
            {/* Message Input */}
            <MessageInput 
              message={message}
              setMessage={setMessage}
              quotationMode={quotationMode}
              setQuotationMode={setQuotationMode}
              quotationPrice={quotationPrice}
              setQuotationPrice={setQuotationPrice}
              handleSendMessage={handleSendMessage}
              isSendingMessage={isSendingMessage}
              isProvider={isProvider}
              requestDetails={conversationData.conversation.service_requests}
            />
          </>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default Messages;
