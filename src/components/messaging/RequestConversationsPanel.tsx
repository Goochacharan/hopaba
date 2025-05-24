import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useConversations } from '@/hooks/useConversations';
import { usePresence } from '@/hooks/usePresence';
import { Loader2, ChevronDown, ChevronUp, Calendar, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ServiceRequest } from '@/types/serviceRequestTypes';

// New component for displaying a quotation summary
interface QuotationSummaryProps {
  providerId: string;
  providerName: string;
  amount?: number;
  lastMessageTime: string;
  onViewClick: () => void;
}

const QuotationSummary: React.FC<QuotationSummaryProps> = ({ 
  providerId, 
  providerName, 
  amount, 
  lastMessageTime, 
  onViewClick 
}) => {
  return (
    <Card key={providerId} className="hover:bg-accent/10 transition-colors">
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{providerName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h5 className="font-medium">{providerName}</h5>
          <div className="flex items-center gap-2 text-sm">
            {amount && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Quoted: ₹{amount}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(lastMessageTime), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button size="sm" onClick={onViewClick}>
          View Messages
        </Button>
      </div>
    </Card>
  );
};

// Conversation card component for showing all conversations
interface ConversationCardProps {
  conversation: any;
  onViewClick: () => void;
  isProvider: boolean;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onViewClick,
  isProvider
}) => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence(`conversation-${conversation.id}`);
  
  // Determine if this is a service request conversation
  const isServiceRequest = !!conversation.service_requests;
  const name = isProvider ? "Requester" : conversation.service_providers?.name || "Provider";
  
  // Determine the other party's user ID
  const otherPartyUserId = conversation.service_providers?.user_id === user?.id 
    ? conversation.user_id  // If current user is provider, other party is the requester
    : conversation.service_providers?.user_id; // Otherwise, other party is the provider
  
  // Check if both parties are online
  const currentUserOnline = user ? isUserOnline(user.id) : false;
  const otherPartyOnline = otherPartyUserId ? isUserOnline(otherPartyUserId) : false;
  const bothPartiesOnline = currentUserOnline && otherPartyOnline;
  
  return (
    <Card className="hover:bg-accent/10 transition-colors">
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-medium">{name}</h5>
            {isServiceRequest && (
              <Badge variant="outline">
                {conversation.service_requests.title}
              </Badge>
            )}
            {/* Online indicator when both parties are online */}
            <OnlineIndicator 
              isOnline={bothPartiesOnline} 
              size="sm"
              className="ml-1"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            {conversation.latest_quotation && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Quoted: ₹{conversation.latest_quotation}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(conversation.last_message_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <Button size="sm" variant="outline" onClick={onViewClick}>
          <MessageSquare className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
};

// Enhanced RequestConversationsPanel with sorting and expanded quotation view
interface RequestConversationsPanelProps {
  showAllConversations?: boolean;
}

const RequestConversationsPanel: React.FC<RequestConversationsPanelProps> = ({ showAllConversations = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'responses'>('date');
  
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { conversations, isLoadingConversations } = useConversations();
  
  // Get conversations for a specific request
  const getConversationsForRequest = (requestId: string) => {
    if (!conversations) return [];
    return conversations.filter(conv => conv.request_id === requestId);
  };
  
  // Get the latest quotation amount from a conversation
  const getLatestQuotation = (conversationId: string) => {
    if (!conversations) return undefined;
    
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || !conversation.latest_quotation) return undefined;
    
    return conversation.latest_quotation;
  };
  
  // Toggle expand/collapse for a request
  const toggleRequestExpand = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };
  
  // Sort requests based on selected criteria
  const getSortedRequests = (requests: ServiceRequest[]) => {
    if (!requests) return [];
    
    if (sortBy === 'responses') {
      return [...requests].sort((a, b) => {
        const aResponses = getConversationsForRequest(a.id).length;
        const bResponses = getConversationsForRequest(b.id).length;
        return bResponses - aResponses;
      });
    }
    
    // Default sort by date (newest first)
    return [...requests].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };
  
  // Check if the current user is a provider
  const isProvider = (conversation: any) => {
    return conversation.service_providers?.user_id === user?.id;
  };
  
  // Render all conversations view
  if (showAllConversations) {
    if (isLoadingConversations) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!conversations || conversations.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground mb-6">
            Your conversations with service providers will appear here.
          </p>
        </div>
      );
    }
    
    return (
      <div>
        <h2 className="text-lg font-medium mb-4">All Conversations</h2>
        <div className="space-y-3">
          {conversations.map(conversation => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              onViewClick={() => navigate(`/messages/${conversation.id}`)}
              isProvider={isProvider(conversation)}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Original requests view
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
  
  const sortedRequests = getSortedRequests(userRequests);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Your Service Requests</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={sortBy === 'date' ? 'bg-accent' : ''} 
            onClick={() => setSortBy('date')}
          >
            Newest
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={sortBy === 'responses' ? 'bg-accent' : ''} 
            onClick={() => setSortBy('responses')}
          >
            Most Responses
          </Button>
        </div>
      </div>
    
      <div className="space-y-4">
        {sortedRequests.map(request => {
          const requestConversations = getConversationsForRequest(request.id);
          const hasResponses = requestConversations.length > 0;
          const responseCount = requestConversations.length;
          
          return (
            <Card key={request.id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer border-b hover:bg-accent/5 transition-colors" 
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
                      <Badge variant={responseCount > 0 ? "success" : "secondary"}>
                        {responseCount} {responseCount === 1 ? 'response' : 'responses'}
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
                  
                  {/* Provider responses with quotations */}
                  <div>
                    <h4 className="font-medium mb-2">Provider Responses</h4>
                    
                    {hasResponses ? (
                      <div className="space-y-3">
                        {requestConversations.map(conversation => {
                          const providerName = conversation.service_providers?.name || "Provider";
                          const quotation = getLatestQuotation(conversation.id);
                          
                          return (
                            <QuotationSummary
                              key={conversation.id}
                              providerId={conversation.provider_id}
                              providerName={providerName}
                              amount={quotation}
                              lastMessageTime={conversation.last_message_at}
                              onViewClick={() => navigate(`/messages/${conversation.id}`)}
                            />
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
    </div>
  );
};

export default RequestConversationsPanel;
