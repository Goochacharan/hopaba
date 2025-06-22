
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

  // Simplified conversations loading with better error handling
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations-optimized', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching simplified conversations for user:', user.id);
      
      try {
        // Simplified query to get basic conversation data
        const { data: conversationData, error } = await supabase
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
          .or(`user_id.eq.${user.id},service_providers.user_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false })
          .limit(50);
          
        if (error) {
          console.error('Error fetching conversations:', error);
          throw error;
        }
        
        // Transform the data to a simpler format
        const transformedData = (conversationData || []).map((conv) => {
          return {
            ...conv,
            service_requests: Array.isArray(conv.service_requests) ? conv.service_requests[0] : conv.service_requests,
            service_providers: Array.isArray(conv.service_providers) ? conv.service_providers[0] : conv.service_providers,
            latest_quotation: undefined // Will be loaded separately if needed
          };
        });
        
        console.log('Simplified conversations loaded:', transformedData.length);
        return transformedData;
      } catch (error) {
        console.error('Error in simplified conversations query:', error);
        // Return empty array instead of throwing to prevent page crash
        return [];
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2, // Retry twice
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Separate query for unread count with error handling
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count-optimized', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      try {
        const { data, error } = await supabase
          .rpc('get_unread_message_count_for_user_requests', {
            user_uuid: user.id
          });

        if (error) {
          console.error('Error fetching unread count:', error);
          return 0;
        }
        
        return data || 0;
      } catch (error) {
        console.error('Error in unread count query:', error);
        return 0;
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 1
  });

  // Simplified send message mutation
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
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unread-count-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-optimized'] });
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

  // Simplified real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up simplified real-time subscription for user:', user.id);

    const channel = supabase
      .channel('messages-optimized')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const message = payload.new as Message;
          console.log('Real-time message received:', message);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['unread-count-optimized'] });
          queryClient.invalidateQueries({ queryKey: ['conversations-optimized'] });
          
          // Show notification for new message if it's not from the current user
          if (message.sender_id !== user.id) {
            const notificationTitle = 'New Message';
            const notificationBody = message.quotation_price 
              ? `New quotation received: ₹${message.quotation_price.toLocaleString()}` 
              : 'You have received a new message';
            
            toast({
              title: notificationTitle,
              description: notificationBody,
            });
            
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
      .subscribe((status) => {
        console.log('Simplified real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up simplified real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, showNotification, isNotificationsEnabled, toast]);

  // Simplified functions
  const getConversationWithMessages = async (conversationId: string) => {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          service_requests(*),
          service_providers(*)
        `)
        .eq('id', conversationId)
        .single();

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
    } catch (error) {
      console.error('Error fetching conversation with messages:', error);
      throw error;
    }
  };

  const markMessagesAsRead = async (conversationId: string, readerType: 'user' | 'provider') => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', readerType === 'user' ? 'provider' : 'user')
        .eq('read', false);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['unread-count-optimized'] });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    conversations,
    unreadCount,
    isLoading,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    getConversationWithMessages,
    markMessagesAsRead
  };
};
