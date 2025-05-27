import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useServiceProviderUnreadCount } from '@/hooks/useServiceProviderUnreadCount';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Building2, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from '@/components/ui/online-indicator';

interface RequestConversationsPanelProps {
  onConversationSelect?: (conversationId: string) => void;
  showCreateRequestButton?: boolean;
}

interface ConversationWithDetails {
  id: string;
  request_id: string;
  provider_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  request_title: string;
  request_description: string;
  request_category: string;
  request_budget: number | null;
  provider_name: string;
  provider_category: string;
  provider_user_id: string;
  unread_count: number;
  last_message_preview: string | null;
  last_message_created_at: string | null;
}

const RequestConversationsPanel: React.FC<RequestConversationsPanelProps> = ({
  onConversationSelect,
  showCreateRequestButton = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations } = useConversations();
  const { unreadCount: totalUnreadCount } = useServiceProviderUnreadCount();
  
  // Add presence tracking for online status
  const { isUserOnline } = usePresence('general');

  const { data: conversationsWithDetails, isLoading, error } = useQuery(
    ['conversationsWithDetails'],
    async () => {
      if (!user) return null;

      // Fetch conversations with additional details
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          request_id,
          provider_id,
          user_id,
          created_at,
          updated_at,
          last_message_at,
          service_requests (
            title,
            description,
            category,
            budget
          ),
          service_providers (
            business_name,
            category,
            user_id
          ),
          messages (
            created_at,
            content
          )
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching conversations with details:', error);
        throw error;
      }

      if (!data) return null;

      // Map the data to the desired format
      const mappedData = data.map((conversation: any) => {
        const request = conversation.service_requests ? conversation.service_requests[0] : null;
        const provider = conversation.service_providers ? conversation.service_providers[0] : null;
        const lastMessage = conversation.messages ? conversation.messages[0] : null;

        return {
          id: conversation.id,
          request_id: conversation.request_id,
          provider_id: conversation.provider_id,
          user_id: conversation.user_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          last_message_at: conversation.last_message_at,
          request_title: request ? request.title : 'Unknown Request',
          request_description: request ? request.description : 'No Description',
          request_category: request ? request.category : 'Unknown Category',
          request_budget: request ? request.budget : null,
          provider_name: provider ? provider.business_name : 'Unknown Provider',
          provider_category: provider ? provider.category : 'Unknown Category',
          provider_user_id: provider ? provider.user_id : 'Unknown User',
          unread_count: 0, // You'll need to fetch this separately
          last_message_preview: lastMessage ? lastMessage.content : null,
          last_message_created_at: lastMessage ? lastMessage.created_at : null,
        };
      });

      return mappedData as ConversationWithDetails[];
    },
    {
      enabled: !!user,
      staleTime: 60000, // 1 minute
    }
  );

  const handleConversationClick = (conversationId: string) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    } else {
      sessionStorage.setItem('conversationNavigationSource', 'inbox');
      navigate(`/messages/${conversationId}`);
    }
  };

  const handleCreateRequest = () => {
    navigate('/post-request');
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading conversations</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const conversationsList = conversationsWithDetails || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Service Requests</h2>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {totalUnreadCount}
            </Badge>
          )}
        </div>
        {showCreateRequestButton && (
          <Button 
            onClick={handleCreateRequest}
            className="w-full"
            size="sm"
          >
            + Post New Request
          </Button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversationsList.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Start by posting a service request to connect with providers</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {conversationsList.map((conversation) => {
              const isProviderOnline = isUserOnline(conversation.provider_user_id);
              
              return (
                <Card 
                  key={conversation.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    conversation.unread_count > 0 && "ring-2 ring-primary/20 bg-primary/5"
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Building2 className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-sm font-medium truncate">
                              {conversation.provider_name}
                            </CardTitle>
                            {isProviderOnline && (
                              <OnlineIndicator 
                                isOnline={isProviderOnline} 
                                size="sm" 
                                showText={false}
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {conversation.provider_category}
                          </p>
                          <p className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                            {conversation.request_title}
                          </p>
                          {conversation.last_message_preview && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {conversation.last_message_preview}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="rounded-full text-xs px-2 py-1">
                            {conversation.unread_count}
                          </Badge>
                        )}
                        {conversation.request_budget && (
                          <Badge variant="outline" className="text-xs">
                            ₹{conversation.request_budget.toLocaleString()}
                          </Badge>
                        )}
                        {conversation.last_message_created_at && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(conversation.last_message_created_at), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestConversationsPanel;
