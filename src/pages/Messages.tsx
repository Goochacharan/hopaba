import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { useConversations } from '@/hooks/useConversations';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Set the default active tab based on URL parameters or provider status
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    // Default tab
    return "requests";
  });
  
  const { 
    getConversationWithMessages,
    sendMessage,
    isSendingMessage,
    markMessagesAsRead 
  } = useConversations();

  // Fetch user's role (whether they're a service provider or not)
  const { data: providerData, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['provider-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id, category, subcategory')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Provider data from query:', data);
      return data;
    },
    enabled: !!user
  });
  
  // User is a service provider if they have a provider record
  const isServiceProvider = !!providerData;
  console.log('Is Service Provider:', isServiceProvider);
  
  // Fetch conversation with messages when in single conversation view
  const { 
    data: conversationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationWithMessages(id!),
    enabled: !!id && !!user
  });
  
  // Update the URL when tab changes without a full page reload
  useEffect(() => {
    if (!id) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', activeTab);
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [activeTab, id, navigate, location.search]);
  
  // Determine if current user is the service provider or the requester
  const isProvider = conversationData?.conversation?.service_providers?.user_id === user?.id;
  
  // Get the name of the other party
  const otherPartyName = isProvider 
    ? "Requester" // If we're the provider, the other party is the requester
    : conversationData?.conversation?.service_providers?.name || "Provider"; // Otherwise it's the provider
  
  // Mark messages as read when viewing the conversation
  useEffect(() => {
    if (id && user && conversationData) {
      // Fix: Pass both arguments as required
      markMessagesAsRead(id, isProvider ? 'provider' : 'user');
    }
  }, [id, user, conversationData, markMessagesAsRead, isProvider]);
  
  const handleSendMessage = () => {
    if (!id || !user || !message.trim()) return;
    
    const messageContent = quotationMode 
      ? `Quotation: ${quotationPrice ? `₹${quotationPrice}` : 'Price not specified'} - ${message}`
      : message;
    
    sendMessage({
      conversationId: id,
      content: messageContent,
      senderType: isProvider ? 'provider' : 'user',
      quotationPrice: quotationMode ? Number(quotationPrice) : undefined
    });
    
    setMessage('');
    setQuotationMode(false);
    setQuotationPrice('');
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
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="conversations">All Conversations</TabsTrigger>
              
              {/* Always show the provider tab for debugging - will be controlled by isServiceProvider */}
              <TabsTrigger value="provider">
                <MessageSquare className="h-4 w-4 mr-2" />
                Service Requests
                {!isServiceProvider && (
                  <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 rounded px-1">
                    (Provider Only)
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests">
              <RequestConversationsPanel />
            </TabsContent>
            
            <TabsContent value="conversations">
              <div className="space-y-4">
                <RequestConversationsPanel showAllConversations />
              </div>
            </TabsContent>
            
            <TabsContent value="provider">
              {isServiceProvider && providerData ? (
                <ServiceProviderDashboard 
                  providerId={providerData.id}
                  category={providerData.category}
                  subcategory={providerData.subcategory}
                />
              ) : (
                <div className="text-center py-12 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Service Provider Profile Required</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You need to create a service provider profile to view and respond to service requests.
                    Once your profile is created and approved, you'll be able to see matching requests here.
                  </p>
                  <Button onClick={() => navigate('/profile')}>Create Provider Profile</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Debug information - can be removed in production */}
          <div className="mt-8 p-4 border rounded bg-gray-50 text-xs text-gray-500">
            <h4 className="font-medium mb-1">Debug Info:</h4>
            <p>Provider Data: {providerData ? `ID: ${providerData.id}, Category: ${providerData.category}` : 'None'}</p>
            <p>Is Service Provider: {isServiceProvider ? 'Yes' : 'No'}</p>
            <p>Current Tab: {activeTab}</p>
          </div>
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
