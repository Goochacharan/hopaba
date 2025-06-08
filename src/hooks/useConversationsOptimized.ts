import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Message } from '@/types/serviceRequestTypes';

export const useConversationsOptimized = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showNotification, isNotificationsEnabled } = useNotifications();

  // Get conversations with minimal data first
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching optimized conversations for user:', user.id);
      
      try {
        // Use the same approach as the original hook - separate queries
        // First, get conversations where the user is the requester
        const { data: requesterConversations, error: requesterError } = await supabase
          .from('conversations')
          .select(`
            id,
            user_id,
            provider_id,
            request_id,
            last_message_at,
            created_at,
            updated_at,
            service_requests!inner(title, category, subcategory),
            service_providers!inner(name, user_id)
          `)
          .eq('user_id', user.id)
          .order('last_message_at', { ascending: false });
          
        if (requesterError) {
          console.error('Error fetching requester conversations:', requesterError);
          throw requesterError;
        }
        
        // Then, get conversations where the user is the service provider
        const { data: providerConversations, error: providerError } = await supabase
          .from('conversations')
          .select(`
            id,
            user_id,
            provider_id,
            request_id,
            last_message_at,
            created_at,
            updated_at,
            service_requests!inner(title, category, subcategory),
            service_providers!inner(name, user_id)
          `)
          .eq('service_providers.user_id', user.id)
          .order('last_message_at', { ascending: false });
          
        if (providerError) {
          console.error('Error fetching provider conversations:', providerError);
          throw providerError;
        }
        
        // Combine the results and remove duplicates
        const allConversations = [...(requesterConversations || []), ...(providerConversations || [])];
        const data = Array.from(
          new Map(allConversations.map(conv => [conv.id, conv])).values()
        ).sort((a, b) => {
          // Sort by last_message_at in descending order
          const dateA = new Date(a.last_message_at || 0);
          const dateB = new Date(b.last_message_at || 0);
          return dateB.getTime() - dateA.getTime();
        }).slice(0, 50); // Limit to 50 for performance

        console.log('Raw optimized conversation data:', data);
      
        // Transform the data to match the expected format from original useConversations
        const transformedData = await Promise.all((data || []).map(async (conv) => {
        // Get latest quotation for this conversation
        let latest_quotation = undefined;
        try {
          const { data: quotationMessage } = await supabase
            .from('messages')
            .select('quotation_price')
            .eq('conversation_id', conv.id)
            .not('quotation_price', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (quotationMessage && quotationMessage.length > 0) {
            latest_quotation = quotationMessage[0].quotation_price;
          }
        } catch (error) {
          console.warn('Error fetching quotation for conversation:', conv.id, error);
        }

        return {
          ...conv,
          service_requests: Array.isArray(conv.service_requests) ? conv.service_requests[0] : conv.service_requests,
          service_providers: Array.isArray(conv.service_providers) ? conv.service_providers[0] : conv.service_providers,
          latest_quotation
        };
      }));
        
        console.log('Optimized conversations loaded:', transformedData.length, transformedData);
        return transformedData;
      } catch (error) {
        console.error('Error in optimized conversations query:', error);
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes for conversations
  });

  // Separate query for unread count to avoid complex joins
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .rpc('get_unread_message_count_for_user_requests', {
          user_uuid: user.id
        });

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
      
      return data || 0;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds for unread count
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Optimized function to get conversation with messages (called only when needed)
  const getConversationWithMessages = async (conversationId: string) => {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        service_requests(*),
        service_providers(*)
      `)
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) throw convError;
    if (!conversation) throw new Error('Conversation not found');

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (msgError) throw msgError;

    return {
      conversation,
      messages: messages || []
    };
  };

  // Optimized send message mutation with better performance
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      conversationId, 
      content, 
      senderType,
      quotationPrice,
      attachments = []
    }: {
      conversationId: string;
      content: string;
      senderType: 'user' | 'provider';
      quotationPrice?: number;
      attachments?: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: senderType,
        content,
        quotation_price: quotationPrice,
        attachments,
        read: false
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation timestamp immediately
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);
      
      // Invalidate queries but don't force refetch - let real-time subscription handle it
      queryClient.invalidateQueries({ 
        queryKey: ['unread-count'],
        refetchType: 'none' // Don't trigger immediate refetch
      });
      queryClient.invalidateQueries({ 
        queryKey: ['conversations-list'],
        refetchType: 'none' // Don't trigger immediate refetch
      });
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', variables.conversationId],
        refetchType: 'none' // Don't trigger immediate refetch
      });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Set up real-time subscriptions for instant messaging
  useEffect(() => {
    if (!user) return;

    console.log('Setting up optimized real-time subscription for user:', user.id);

    // Create a debounced version of the refetch to prevent excessive API calls
    let refetchTimeoutId: number | undefined;
    
    const debouncedRefetch = (conversationId?: string) => {
      // Clear any pending refetch
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
      
      // Schedule a new refetch
      refetchTimeoutId = window.setTimeout(() => {
        console.log('Real-time update: Refreshing data for conversation:', conversationId);
        
        // Only invalidate the specific conversation that received a message
        if (conversationId) {
          queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
        }
        
        // Always refetch the conversations list and unread count
        queryClient.invalidateQueries({ queryKey: ['conversations-list'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['serviceProviderUnreadCount', user?.id] });
      }, 200); // Further reduced for even better responsiveness
    };

    // Immediate invalidation for critical updates (no debounce)
    const immediateRefresh = () => {
      console.log('Immediate refresh triggered for unread counts (optimized)');
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['serviceProviderUnreadCount', user?.id] });
    };

    const channel = supabase
      .channel('realtime-messages-optimized')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const message = payload.new as Message;
          console.log('Real-time message received (optimized):', message);
          
          // Immediate refresh for unread counts when receiving new messages
          immediateRefresh();
          
          // Use the debounced refetch for other updates
          debouncedRefetch(message.conversation_id);
          
          // Show notification for new message if it's not from the current user
          if (message.sender_id !== user.id) {
            const notificationTitle = 'New Message';
            const notificationBody = message.quotation_price 
              ? `New quotation received: ₹${message.quotation_price.toLocaleString()}` 
              : 'You have received a new message';
            
            // Show toast notification (always shown when page is active)
            toast({
              title: notificationTitle,
              description: notificationBody,
            });
            
            // Show push notification (only when page is not visible and notifications are enabled)
            if (isNotificationsEnabled) {
              try {
                await showNotification(notificationTitle, {
                  body: notificationBody,
                  conversationId: message.conversation_id,
                  senderName: 'Hopaba User'
                });
              } catch (error) {
                console.error('Error showing push notification:', error);
              }
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const message = payload.new as Message;
          console.log('Real-time message updated (read status, optimized):', message);
          
          // Immediate refresh for read status changes
          immediateRefresh();
        }
      )
      .subscribe((status) => {
        console.log('Optimized real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up optimized real-time subscription');
      // Clear any pending timeout when component unmounts
      if (refetchTimeoutId) {
        clearTimeout(refetchTimeoutId);
      }
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, showNotification, isNotificationsEnabled, toast]);

  // Memoized functions to prevent unnecessary re-renders
  const memoizedFunctions = useMemo(() => ({
    sendMessage: sendMessageMutation.mutate,
    getConversationWithMessages,
    markMessagesAsRead: async (conversationId: string, readerType: 'user' | 'provider') => {
      if (!user) return;
      
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', readerType === 'user' ? 'provider' : 'user')
        .eq('read', false);

      if (!error) {
        // Don't force immediate refetch - real-time subscription will handle it
        queryClient.invalidateQueries({ 
          queryKey: ['unread-count'],
          refetchType: 'none'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['serviceProviderUnreadCount', user?.id],
          refetchType: 'none'
        });
      }
    }
  }), [sendMessageMutation.mutate, user, queryClient]);

  return {
    conversations,
    unreadCount,
    isLoading,
    isSendingMessage: sendMessageMutation.isPending,
    ...memoizedFunctions
  };
};
