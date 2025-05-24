
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's conversations with FIXED SQL query syntax
  const getUserConversations = async () => {
    if (!user) throw new Error('User not authenticated');
    
    console.log('Fetching conversations for user:', user.id);
    
    try {
      // FIXED: Corrected SQL query syntax for proper PostgREST filtering
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          service_requests!inner (id, title, category, subcategory, user_id),
          service_providers!inner (id, name, user_id)
        `)
        .or(`user_id.eq.${user.id},service_providers.user_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Database error fetching conversations:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log('Raw conversation data:', data);
      
      if (!data || data.length === 0) {
        console.log('No conversations found for user');
        return [];
      }
      
      // Get latest quotations for each conversation with improved error handling
      const conversationsWithQuotations = await Promise.all(
        data.map(async (conversation) => {
          try {
            const { data: quotationMessage, error: quotationError } = await supabase
              .from('messages')
              .select('quotation_price, created_at')
              .eq('conversation_id', conversation.id)
              .not('quotation_price', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (quotationError) {
              console.error('Error fetching quotation for conversation:', conversation.id, quotationError);
            }
            
            const latestQuotation = quotationMessage && quotationMessage.length > 0 
              ? quotationMessage[0].quotation_price 
              : undefined;
              
            const result = {
              ...conversation,
              latest_quotation: latestQuotation
            };
            
            console.log('Processed conversation with quotation:', result);
            return result;
          } catch (error) {
            console.error('Error processing conversation:', conversation.id, error);
            return {
              ...conversation,
              latest_quotation: undefined
            };
          }
        })
      );

      console.log('Final conversations with quotations:', conversationsWithQuotations);
      return conversationsWithQuotations as (Conversation & {
        service_requests: { id: string; title: string; category: string; subcategory?: string; user_id: string };
        service_providers: { id: string; name: string; user_id: string };
        latest_quotation?: number;
      })[];
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw error;
    }
  };

  // Create a new conversation with better duplicate prevention
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
    
    try {
      // Check for existing conversation first with better query
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('request_id', requestId)
        .eq('provider_id', providerId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.error('Error checking existing conversations:', fetchError);
        throw new Error('Could not check for existing conversations');
      }
      
      if (existingConversations && existingConversations.length > 0) {
        console.log('Using existing conversation:', existingConversations[0].id);
        return existingConversations[0] as Conversation;
      }
      
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
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Created new conversation:', data);
      return data as Conversation;
    } catch (error) {
      console.error('Error in createConversationFn:', error);
      throw error;
    }
  };

  // Get conversations for a specific request with improved error handling
  const getConversationsForRequest = async (requestId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    console.log('Fetching conversations for request:', requestId);
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          service_providers!inner (id, name, user_id)
        `)
        .eq('request_id', requestId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations for request:', error);
        throw new Error(`Failed to fetch conversations for request: ${error.message}`);
      }
      
      console.log('Conversations for request:', data);
      
      if (!data || data.length === 0) {
        console.log('No conversations found for request:', requestId);
        return [];
      }
      
      // Get latest quotations for each conversation
      const conversationsWithQuotations = await Promise.all(
        data.map(async (conversation) => {
          try {
            const { data: quotationMessage, error: quotationError } = await supabase
              .from('messages')
              .select('quotation_price, created_at')
              .eq('conversation_id', conversation.id)
              .not('quotation_price', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (quotationError) {
              console.error('Error fetching quotation for conversation:', conversation.id, quotationError);
            }
            
            const latestQuotation = quotationMessage && quotationMessage.length > 0 
              ? quotationMessage[0].quotation_price 
              : undefined;
              
            return {
              ...conversation,
              latest_quotation: latestQuotation
            };
          } catch (error) {
            console.error('Error processing conversation quotation:', conversation.id, error);
            return {
              ...conversation,
              latest_quotation: undefined
            };
          }
        })
      );

      console.log('Conversations with quotations for request:', conversationsWithQuotations);
      return conversationsWithQuotations as (Conversation & {
        service_providers: { id: string; name: string; user_id: string };
        latest_quotation?: number;
      })[];
    } catch (error) {
      console.error('Error in getConversationsForRequest:', error);
      throw error;
    }
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

  // Send a message in a conversation with improved validation
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
    
    // Improve quotation price validation
    if (quotationPrice !== undefined) {
      if (isNaN(quotationPrice) || quotationPrice <= 0 || quotationPrice > 10000000) {
        throw new Error('Quotation price must be a positive number less than 10,000,000');
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
        
        throw new Error('You are not authorized to send messages in this conversation');
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
        throw new Error(`Failed to send message: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No message data returned');
      }
      
      console.log('Message sent successfully:', data[0]);
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

  // Use queries and mutations with improved error handling
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: getUserConversations,
    enabled: !!user,
    retry: (failureCount, error) => {
      console.log('Retry attempt:', failureCount, 'Error:', error);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000 // 30 seconds
  });

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: getUnreadCount,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
  });

  // Update sendMessageMutation to improve error handling and success feedback
  const sendMessageMutation = useMutation({
    mutationFn: sendMessageFn,
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);
      
      // Invalidate and refetch relevant queries immediately
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      
      // Force immediate refetch
      setTimeout(() => {
        refetchConversations();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
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
          console.log('Real-time message received:', message);
          
          // Update the conversation cache when a new message arrives
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversation', message.conversation_id] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
          
          // Force immediate refetch for better responsiveness
          setTimeout(() => {
            refetchConversations();
          }, 100);
          
          // Show notification for new message if it's not from the current user
          if (message.sender_id !== user.id) {
            toast({
              title: 'New Message',
              description: message.quotation_price 
                ? `New quotation received: ₹${message.quotation_price.toLocaleString()}` 
                : 'You have received a new message',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, refetchConversations]);

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
