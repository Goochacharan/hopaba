import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useConversations } from '@/hooks/useConversations';
import { usePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { Loader2, MessageSquare, AlertTriangle } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';

const MessagesListing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    conversations, 
    isLoadingConversations,
    conversationsError,
    refetchConversations
  } = useConversations();

  // Initialize general presence tracking
  usePresence('general');

  const isProvider = (conversation: any) => {
    if (!user || !conversation?.service_providers) return false;
    return conversation.service_providers.user_id === user.id;
  };

  // Get name of the other party based on whether the current user is the provider or requester
  const getOtherPartyName = (conversation: any) => {
    if (isProvider(conversation)) {
      return "Requester"; // If current user is provider, other party is requester
    } else {
      return conversation.service_providers?.name || "Provider"; // Otherwise it's the provider
    }
  };

  const handleRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    refetchConversations();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Notification Prompt */}
        <NotificationPrompt className="mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Conversations with service providers and requesters
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>

        {isLoadingConversations ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : conversationsError ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Messages</h3>
            <p className="text-muted-foreground mb-6">
              There was a problem loading your messages. Please try again.
            </p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Your conversations will appear here once you start messaging.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <ConversationItem 
                key={conversation.id}
                conversation={conversation}
                otherPartyName={getOtherPartyName(conversation)}
                onViewClick={() => navigate(`/messages/${conversation.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

// Separate component for individual conversation items
interface ConversationItemProps {
  conversation: any;
  otherPartyName: string;
  onViewClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  otherPartyName,
  onViewClick
}) => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence(`conversation-${conversation.id}`);
  
  // Determine the other party's user ID
  const otherPartyUserId = conversation.service_providers?.user_id === user?.id 
    ? conversation.user_id  // If current user is provider, other party is the requester
    : conversation.service_providers?.user_id; // Otherwise, other party is the provider
  
  // Check if both parties are online
  const currentUserOnline = user ? isUserOnline(user.id) : false;
  const otherPartyOnline = otherPartyUserId ? isUserOnline(otherPartyUserId) : false;
  const bothPartiesOnline = currentUserOnline && otherPartyOnline;

  return (
    <Card 
      key={conversation.id} 
      className="hover:bg-accent/10 transition-colors cursor-pointer"
      onClick={onViewClick}
    >
      <div className="p-4 flex items-center gap-4">
        <Avatar>
          <AvatarFallback>
            {otherPartyName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium truncate">
              {otherPartyName}
            </h3>
            <Badge variant="outline" className="truncate max-w-[200px]">
              {conversation.service_requests?.title || "Request"}
            </Badge>
            {/* Online indicator when both parties are online */}
            <OnlineIndicator 
              isOnline={bothPartiesOnline} 
              size="sm"
              className="ml-1"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">
              {conversation.service_requests?.category || ""}
              {conversation.service_requests?.subcategory && 
                ` / ${conversation.service_requests.subcategory}`}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">
              {formatDistanceToNow(parseISO(conversation.last_message_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        <Button size="sm" className="shrink-0">
          <MessageSquare className="h-4 w-4 mr-2" />
          View
        </Button>
      </div>
    </Card>
  );
};

export default MessagesListing;
