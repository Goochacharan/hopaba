
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

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
    console.log('Creating conversation with params:', { requestId, providerId, userId });
    
    if (!user) throw new Error('User not authenticated');
    
    // Verify the provider belongs to the current user if the request is coming from a provider
    const { data: providerData, error: providerError } = await supabase
      .from('service_providers')
      .select('user_id')
      .eq('id', providerId)
      .single();
      
    if (providerError) {
      console.error('Error verifying provider:', providerError);
      throw new Error('Could not verify service provider');
    }
    
    // Check if we're creating as a provider and if we have permission
    if (providerData.user_id === user.id) {
      console.log('Creating conversation as provider - verified ownership');
    } else if (userId === user.id) {
      console.log('Creating conversation as requester - verified ownership');
    } else {
      throw new Error('You do not have permission to create this conversation');
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        request_id: requestId,
        provider_id: providerId,
        user_id: userId
      })
      .select();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('No conversation data returned');
    }
    
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
  const sendMessageFn = async ({
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
    
    // Validate content and quotation price
    if (!content.trim() && !quotationPrice) {
      throw new Error('Message content cannot be empty');
    }
    
    // Ensure quotation price is a valid number if provided
    if (quotationPrice !== undefined) {
      if (isNaN(quotationPrice) || quotationPrice <= 0) {
        throw new Error('Quotation price must be a positive number');
      }
    }
    
    console.log('Sending message with params:', { 
      conversationId, 
      content, 
      senderType, 
      userId: user.id,
      quotationPrice
    });
    
    try {
      // First, verify this user can send a message in this conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          provider_id,
          service_providers (id, user_id)
        `)
        .eq('id', conversationId)
        .single();
        
      if (conversationError) {
        console.error('Error verifying conversation permissions:', conversationError);
        throw new Error('Could not verify conversation permissions');
      }
      
      // Check that the user has permission to send a message as this sender type
      const isRequester = conversation.user_id === user.id;
      const isProvider = conversation.service_providers && 
                         conversation.service_providers.user_id === user.id;
      
      const isRequesterAndAuthorized = senderType === 'user' && isRequester;
      const isProviderAndAuthorized = senderType === 'provider' && isProvider;
      
      if (!isRequesterAndAuthorized && !isProviderAndAuthorized) {
        console.error('User not authorized to send message:', {
          userId: user.id,
          senderType,
          conversationUserId: conversation.user_id,
          providerUserId: conversation.service_providers?.user_id,
          isRequester,
          isProvider
        });
        
        if (isRequester && senderType === 'provider') {
          throw new Error('You cannot send messages as a provider in this conversation');
        } else if (isProvider && senderType === 'user') {
          throw new Error('You cannot send messages as a requester in this conversation');
        } else {
          throw new Error('You are not authorized to send messages in this conversation');
        }
      }
      
      console.log('Authorization check passed, sending message');

      // Prepare message data with validated quotation price
      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: senderType,
        content: content.trim(),
        attachments,
        quotation_price: quotationPrice
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No message data returned');
      }
      
      return data[0] as Message;
    } catch (error) {
      console.error('Error in sendMessageFn:', error);
      throw error;
    }
  };

  // Mark messages as read
  const markMessagesAsReadFn = async ({
    conversationId,
    senderType
  }: {
    conversationId: string;
    senderType: 'user' | 'provider';
  }) => {
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

  // Update sendMessageMutation to improve error handling and success feedback
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageFn,
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      
      // Don't show success toast here as it's handled in the QuotationDialog component
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      // Re-throw the error so it can be handled by the calling component
      throw error;
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: (params: { requestId: string; providerId: string; userId: string }) => 
      createConversationFn(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversation Started',
        description: 'You have started a new conversation.',
      });
    },
    onError: (error: any) => {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: `Failed to start conversation: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });

  const markMessagesAsReadMutation = useMutation({
    mutationFn: (params: { conversationId: string; senderType: 'user' | 'provider' }) => 
      markMessagesAsReadFn(params),
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
    createConversation: (requestId: string, providerId: string, userId: string) => {
      return createConversationMutation.mutate({ requestId, providerId, userId });
    },
    isCreatingConversation: createConversationMutation.isPending,
    sendMessage: async (params: {
      conversationId: string;
      content: string;
      senderType: 'user' | 'provider';
      attachments?: string[];
      quotationPrice?: number;
    }) => {
      try {
        return await sendMessageMutation.mutateAsync(params);
      } catch (error) {
        throw error;
      }
    },
    isSendingMessage: sendMessageMutation.isPending,
    getConversationWithMessages,
    getConversationsForRequest,
    markMessagesAsRead: (conversationId: string, senderType: 'user' | 'provider') => {
      return markMessagesAsReadMutation.mutate({ conversationId, senderType });
    }
  };
};
