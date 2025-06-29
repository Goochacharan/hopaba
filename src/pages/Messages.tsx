import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useConversationsOptimized } from '@/hooks/useConversationsOptimized';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { Link } from 'react-router-dom';

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
  } = useConversationsOptimized();

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

  // Fetch user's role (whether they're a service provider or not) - optimized
  const { data: providerData, isLoading: isLoadingProviderData } = useQuery({
    queryKey: ['provider-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('service_providers')
        .select('id, category, subcategory, city')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Provider data fetched:', data);
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  // User is a service provider if they have a provider record
  const isServiceProvider = !!providerData;
  
  // Fetch conversation with messages when in single conversation view - optimized
  const { 
    data: conversationData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversationWithMessages(id!),
    enabled: !!id && !!user,
    staleTime: 30 * 1000, // 30 seconds for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: undefined, // Real-time subscription handles updates
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // Determine if current user is the service provider or the requester
  const isProvider = conversationData?.conversation?.service_providers?.user_id === user?.id;
  
  // Get the name of the other party
  const otherPartyName = isProvider 
    ? "Requester" // If we're the provider, the other party is the requester
    : conversationData?.conversation?.service_providers?.name || "Provider"; // Otherwise it's the provider
  
  // Mark messages as read quickly for better UX
  useEffect(() => {
    if (!id || !user || !conversationData) return;
    
    const timeoutId = setTimeout(() => {
      console.log('Marking messages as read:', { id, isProvider });
      markMessagesAsRead(id, isProvider ? 'provider' : 'user');
    }, 1000); // Reduced to 1 second for faster response
    
    return () => clearTimeout(timeoutId);
  }, [id, user, conversationData, markMessagesAsRead, isProvider]);
  
  const handleSendMessage = (attachments: string[] = []) => {
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
    
    // Validate that we have either content or attachments
    const messageContent = message.trim();
    if (!messageContent && attachments.length === 0 && !quotationMode) {
      toast({
        title: "Empty message",
        description: "Please enter a message or attach images.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Sending message:', { 
      conversationId: id,
      senderType: isProvider ? 'provider' : 'user',
      hasQuotation: quotationMode && !!quotationPrice,
      hasAttachments: attachments.length > 0
    });
    
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
        quotationPrice: parsedQuotationPrice,
        attachments: attachments
      });
      
      setMessage('');
      if (quotationMode && parsedQuotationPrice !== undefined) {
        setQuotationMode(false);
        setQuotationPrice('');
      }
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
      <div className="min-h-screen w-full bg-background flex flex-col items-center relative">
        {/* Header */}
        <header className="w-full sticky top-0 z-50 glass border-b border-border/50 px-6 py-4">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <Link to="/shop" className="flex items-center">
              <span className="text-xl font-bold text-foreground">Chowkashi</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {!user && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button size="sm" onClick={() => navigate('/signup')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="w-full flex-1 overflow-y-auto">
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
                  <RequestConversationsPanel showAllConversations={true} />
                </div>
              </TabsContent>
              
              {isServiceProvider && (
                <TabsContent value="provider">
                  {providerData && (
                    <ServiceProviderDashboard 
                      providerId={providerData.id}
                      category={providerData.category}
                      subcategory={providerData.subcategory}
                      providerCity={providerData.city}
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center relative">
        {/* Header */}
        <header className="w-full sticky top-0 z-50 glass border-b border-border/50 px-6 py-4">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <Link to="/shop" className="flex items-center">
              <span className="text-xl font-bold text-foreground">Chowkashi</span>
            </Link>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Conversation</h2>
            <p className="text-muted-foreground mb-6">
              There was a problem loading this conversation.
            </p>
            <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <header className="w-full sticky top-0 z-50 glass border-b border-border/50 px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link to="/shop" className="flex items-center">
            <span className="text-xl font-bold text-foreground">Chowkashi</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {!user && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Notification Prompt */}
      <NotificationPrompt className="mx-4 mt-4 mb-2 flex-shrink-0" />
      
      {/* Chat Container - fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversationData ? (
          <>
            {/* Conversation Header - sticky */}
            <div className="flex-shrink-0 sticky top-0 z-40 bg-background">
              <ConversationHeader 
                otherPartyName={otherPartyName}
                conversation={conversationData.conversation}
                requestInfo={conversationData.conversation.service_requests}
              />
            </div>
            
            {/* Messages Container - scrollable area */}
            <div className="flex-1 min-h-0">
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
                  messages={conversationData.messages.map(msg => ({
                    ...msg,
                    sender_type: msg.sender_type as "user" | "provider",
                    pricing_type: msg.pricing_type as "fixed" | "negotiable" | "wholesale"
                  }))} 
                  userId={user?.id || ''}
                  otherPartyName={otherPartyName}
                  isProvider={isProvider}
                  businessName={conversationData.conversation.service_providers?.name}
                  providerId={conversationData.conversation.provider_id}
                />
              )}
            </div>
            
            {/* Message Input - fixed at bottom */}
            <div className="flex-shrink-0">
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
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Messages;
