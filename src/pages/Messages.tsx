
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { useConversations } from '@/hooks/useConversations';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, ArrowLeft, Image, DollarSign, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message, ServiceRequest } from '@/types/serviceRequestTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MessageItem: React.FC<{
  message: Message;
  isUser: boolean;
  otherPartyName: string;
}> = ({ message, isUser, otherPartyName }) => {
  const hasQuotation = message.quotation_price !== null && message.quotation_price !== undefined;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-2",
        isUser ? "flex-row" : "flex-row-reverse"
      )}>
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}>
          {hasQuotation && (
            <div className={cn(
              "mb-2 rounded-lg p-3 border",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Price Quote</span>
              </div>
              <div className="text-xl font-bold mb-1">₹{message.quotation_price}</div>
              <div className="text-sm opacity-80">
                {message.content}
              </div>
            </div>
          )}
          
          {!hasQuotation && (
            <div className={cn(
              "rounded-lg p-3 text-sm",
              isUser 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              {message.content}
            </div>
          )}
          
          {hasAttachments && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {message.attachments.map((attachment, index) => (
                <img 
                  key={index}
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="rounded-md object-cover w-full aspect-square"
                />
              ))}
            </div>
          )}
          
          <div className={cn(
            "text-xs text-muted-foreground mt-1",
            isUser ? "text-right" : "text-left"
          )}>
            {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessagesList: React.FC<{
  messages: Message[];
  userId: string;
  otherPartyName: string;
  isProvider: boolean;
}> = ({ messages, userId, otherPartyName, isProvider }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(message => (
        <MessageItem 
          key={message.id} 
          message={message}
          // For providers, messages sent as 'provider' are from the user (current user)
          // For regular users, messages sent as 'user' are from the user (current user)
          isUser={(isProvider && message.sender_type === 'provider') || 
                 (!isProvider && message.sender_type === 'user')}
          otherPartyName={otherPartyName}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

// New component for displaying requests and their conversations
const RequestConversationsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { conversations, isLoadingConversations } = useConversations();
  
  // Get conversations for a specific request
  const getConversationsForRequest = (requestId: string) => {
    if (!conversations) return [];
    return conversations.filter(conv => conv.request_id === requestId);
  };
  
  // Toggle expand/collapse for a request
  const toggleRequestExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };
  
  if (isLoadingUserRequests || isLoadingConversations) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userRequests || userRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No requests found</h3>
        <p className="text-muted-foreground mb-6">
          You haven't created any service requests yet.
        </p>
        <Button onClick={() => navigate('/post-request')}>
          Create a Request
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {userRequests.map(request => {
        const requestConversations = getConversationsForRequest(request.id);
        const hasResponses = requestConversations.length > 0;
        
        return (
          <Card key={request.id} className="overflow-hidden">
            <div 
              className="p-4 cursor-pointer border-b hover:bg-accent/5" 
              onClick={() => toggleRequestExpand(request.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{request.title}</h3>
                    <Badge variant={request.status === 'open' ? 'default' : 'outline'}>
                      {request.status === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.category}
                    {request.subcategory && ` / ${request.subcategory}`}
                    {request.budget && ` • Budget: ₹${request.budget}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {hasResponses && (
                    <Badge variant="secondary">
                      {requestConversations.length} {requestConversations.length === 1 ? 'response' : 'responses'}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" className="ml-2">
                    {expandedRequest === request.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            {expandedRequest === request.id && (
              <div className="p-4 space-y-4 bg-accent/5">
                {/* Request details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Description:</p>
                    <p className="text-muted-foreground">{request.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {request.date_range_start ? (
                          <>
                            {format(parseISO(request.date_range_start), 'dd MMM yyyy')}
                            {request.date_range_end && (
                              <> - {format(parseISO(request.date_range_end), 'dd MMM yyyy')}</>
                            )}
                          </>
                        ) : (
                          'No date specified'
                        )}
                      </span>
                    </div>
                    <div>
                      <span>Location: {request.area}, {request.city}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Provider responses */}
                <div>
                  <h4 className="font-medium mb-2">Provider Responses</h4>
                  
                  {hasResponses ? (
                    <div className="space-y-3">
                      {requestConversations.map(conversation => {
                        const providerName = conversation.service_providers?.name || "Provider";
                        
                        return (
                          <Card key={conversation.id} className="hover:bg-accent/10 cursor-pointer" onClick={() => navigate(`/messages/${conversation.id}`)}>
                            <div className="p-3 flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{providerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <h5 className="font-medium">{providerName}</h5>
                                <p className="text-xs text-muted-foreground">
                                  Last message: {formatDistanceToNow(parseISO(conversation.last_message_at), { addSuffix: true })}
                                </p>
                              </div>
                              
                              <Button size="sm">
                                View Messages
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No providers have responded to this request yet.</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/request/${request.id}`)}>
                    View Full Request
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const Messages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState('');
  const [quotationMode, setQuotationMode] = useState(false);
  const [quotationPrice, setQuotationPrice] = useState<string>('');
  
  const { 
    getConversationWithMessages,
    sendMessage,
    isSendingMessage,
    markMessagesAsRead 
  } = useConversations();
  
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
  
  // Determine if current user is the service provider or the requester
  const isProvider = conversationData?.conversation?.service_providers?.user_id === user?.id;
  
  // Get the name of the other party
  const otherPartyName = isProvider 
    ? "Requester" // If we're the provider, the other party is the requester
    : conversationData?.conversation?.service_providers?.name || "Provider"; // Otherwise it's the provider
  
  // Mark messages as read when viewing the conversation
  useEffect(() => {
    if (id && user && conversationData) {
      // Fix: Call markMessagesAsRead with the correct parameters
      markMessagesAsRead(
        id,
        isProvider ? 'provider' : 'user'
      );
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
  
  // Handle keypress event for sending messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              View your service requests and conversations with providers
            </p>
          </div>
          
          <Tabs defaultValue="requests">
            <TabsList className="mb-6">
              <TabsTrigger value="requests">My Requests</TabsTrigger>
              <TabsTrigger value="conversations">All Conversations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests">
              <RequestConversationsPanel />
            </TabsContent>
            
            <TabsContent value="conversations">
              <div className="space-y-4">
                {/* Show the existing conversations list component */}
                <Button onClick={() => navigate('/messages')}>
                  View All Conversations
                </Button>
              </div>
            </TabsContent>
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
        {/* Header */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversationData ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-1"
                  onClick={() => navigate('/messages')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium line-clamp-1">{otherPartyName}</h3>
                    {conversationData.conversation.service_requests && (
                      <Badge variant="outline" className="truncate max-w-[200px]">
                        {conversationData.conversation.service_requests.title}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conversationData.conversation.service_requests?.category}
                    {conversationData.conversation.service_requests?.subcategory && 
                      ` / ${conversationData.conversation.service_requests.subcategory}`}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/request/${conversationData.conversation.request_id}`)}
                >
                  View Request
                </Button>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
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
            <div className="border-t p-4">
              {quotationMode && isProvider && (
                <div className="mb-3 p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Send a Price Quote</h3>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex items-center">
                      <span className="px-3 bg-background border rounded-l-md h-10 flex items-center">₹</span>
                      <Input 
                        type="number" 
                        placeholder="Amount"
                        className="rounded-l-none"
                        value={quotationPrice}
                        onChange={(e) => setQuotationPrice(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => setQuotationMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {isProvider && !quotationMode && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setQuotationMode(true)}
                      title="Send price quote"
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSendingMessage || !message.trim()}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default Messages;
