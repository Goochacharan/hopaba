
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

// Add this interface for the mark messages as read params
interface MarkMessagesAsReadParams {
  conversationId: string;
  senderType: 'user' | 'provider';
}

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's conversations
  const getUserConversations = async () => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        service_requests (id, title, category, subcategory),
        service_providers (id, name, user_id)
      `)
      .or(`user_id.eq.${user.id},service_providers.user_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    // Get latest quotations for each conversation
    const conversationsWithQuotations = await Promise.all(
      data.map(async (conversation) => {
        const { data: quotationMessage } = await supabase
          .from('messages')
          .select('quotation_price')
          .eq('conversation_id', conversation.id)
          .not('quotation_price', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);
          
        const latestQuotation = quotationMessage && quotationMessage.length > 0 
          ? quotationMessage[0].quotation_price 
          : undefined;
          
        return {
          ...conversation,
          latest_quotation: latestQuotation
        };
      })
    );

    return conversationsWithQuotations as (Conversation & {
      service_requests: { id: string; title: string; category: string; subcategory?: string };
      service_providers: { id: string; name: string; user_id: string };
      latest_quotation?: number;
    })[];
  };

  // Create a new conversation
  const createConversationFn = async ({
    requestId,
    providerId,
    userId
  }: {
    requestId: string;
    providerId: string;
    userId: string;
  }) => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        request_id: requestId,
        provider_id: providerId,
        user_id: userId
      })
      .select();

    if (error) throw error;
    return data[0] as Conversation;
  };

  // Get conversations for a specific request
  const getConversationsForRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        service_providers (id, name, user_id)
      `)
      .eq('request_id', requestId)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    // Get latest quotations for each conversation
    const conversationsWithQuotations = await Promise.all(
      data.map(async (conversation) => {
        const { data: quotationMessage } = await supabase
          .from('messages')
          .select('quotation_price')
          .eq('conversation_id', conversation.id)
          .not('quotation_price', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);
          
        const latestQuotation = quotationMessage && quotationMessage.length > 0 
          ? quotationMessage[0].quotation_price 
          : undefined;
          
        return {
          ...conversation,
          latest_quotation: latestQuotation
        };
      })
    );

    return conversationsWithQuotations as (Conversation & {
      service_providers: { id: string; name: string; user_id: string };
      latest_quotation?: number;
    })[];
  };

  // Get a single conversation by id with messages
  const getConversationWithMessages = async (conversationId: string) => {
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        service_requests (id, title, category, subcategory),
        service_providers (id, name, user_id)
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError) throw conversationError;

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    return {
      conversation: conversation as (Conversation & {
        service_requests: { id: string; title: string; category: string; subcategory?: string };
        service_providers: { id: string; name: string; user_id: string };
      }),
      messages: messages as Message[]
    };
  };

  // Send a message in a conversation
  const sendMessage = async ({
    conversationId,
    content,
    senderType,
    attachments = [],
    quotationPrice
  }: {
    conversationId: string;
    content: string;
    senderType: 'user' | 'provider';
    attachments?: string[];
    quotationPrice?: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: senderType,
        content,
        attachments,
        quotation_price: quotationPrice
      })
      .select();

    if (error) throw error;
    return data[0] as Message;
  };

  // Mark messages as read - updated to use the new params interface
  const markMessagesAsRead = async ({
    conversationId,
    senderType
  }: MarkMessagesAsReadParams) => {
    if (!user) throw new Error('User not authenticated');

    // Only mark messages as read that were sent by the other party
    const otherSenderType = senderType === 'user' ? 'provider' : 'user';

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', otherSenderType)
      .eq('read', false);

    if (error) throw error;
    
    // Invalidate queries to refresh the unread count
    queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
  };

  // Get count of unread messages for the current user
  const getUnreadCount = async () => {
    if (!user) return 0;

    const { data, error } = await supabase
      .rpc('get_unread_message_count', { user_uuid: user.id });

    if (error) throw error;
    return data as number;
  };

  // Use queries and mutations
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: getUserConversations,
    enabled: !!user
  });

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: getUnreadCount,
    enabled: !!user
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: createConversationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversation Started',
        description: 'You have started a new conversation.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to start conversation: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const markMessagesAsReadMutation = useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  // Set up real-time subscriptions for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const message = payload.new as Message;
          
          // Update the conversation cache when a new message arrives
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', message.conversation_id] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
          
          // Show notification for new message if it's not from the current user
          if (message.sender_id !== user.id) {
            toast({
              title: 'New Message',
              description: 'You have received a new message',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    conversations,
    isLoadingConversations,
    conversationsError,
    refetchConversations,
    unreadCount,
    refetchUnreadCount,
    createConversation: (requestId: string, providerId: string, userId: string, options?: any) => {
      return createConversationMutation.mutate({
        requestId,
        providerId,
        userId
      }, options);
    },
    isCreatingConversation: createConversationMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
    getConversationWithMessages,
    getConversationsForRequest,
    markMessagesAsRead: (conversationId: string, senderType: 'user' | 'provider') => {
      return markMessagesAsReadMutation.mutate({
        conversationId,
        senderType
      });
    }
  };
};
