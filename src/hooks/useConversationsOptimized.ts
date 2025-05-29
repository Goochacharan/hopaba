
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

export const useConversationsOptimized = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get conversations with minimal data first
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          provider_id,
          request_id,
          last_message_at,
          service_requests!inner(title, category, subcategory),
          service_providers!inner(name, user_id)
        `)
        .or(`user_id.eq.${user.id},service_providers.user_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(50); // Reduce from 100 to 50 for better performance

      if (error) throw error;
      return data || [];
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

  // Optimized send message mutation
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
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-list'] });
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
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
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
