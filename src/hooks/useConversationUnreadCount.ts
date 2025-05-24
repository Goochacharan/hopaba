import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useConversationUnreadCount = (conversationId: string) => {
  const { user } = useAuth();

  const getConversationUnreadCount = async () => {
    if (!user || !conversationId) return 0;

    try {
      // Get the conversation to determine user's role
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          service_providers!inner (user_id)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        return 0;
      }

      // Determine if user is requester or provider
      const isRequester = conversation.user_id === user.id;
      const isProvider = conversation.service_providers?.user_id === user.id;

      if (!isRequester && !isProvider) {
        return 0; // User is not part of this conversation
      }

      // Count unread messages from the other party
      const otherSenderType = isRequester ? 'provider' : 'user';

      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('sender_type', otherSenderType)
        .eq('read', false);

      if (error) {
        console.error('Error counting unread messages:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in getConversationUnreadCount:', error);
      return 0;
    }
  };

  return useQuery({
    queryKey: ['conversationUnreadCount', conversationId, user?.id],
    queryFn: getConversationUnreadCount,
    enabled: !!user && !!conversationId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook to get unread counts for multiple conversations
export const useMultipleConversationUnreadCounts = (conversationIds: string[]) => {
  const { user } = useAuth();

  const getMultipleUnreadCounts = async () => {
    if (!user || !conversationIds.length) return {};

    try {
      // Get all conversations to determine user roles
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          service_providers!inner (user_id)
        `)
        .in('id', conversationIds);

      if (convError) {
        console.error('Error fetching conversations:', convError);
        return {};
      }

      const unreadCounts: Record<string, number> = {};

      // Process each conversation
      for (const conversation of conversations) {
        const isRequester = conversation.user_id === user.id;
        const isProvider = conversation.service_providers?.user_id === user.id;

        if (!isRequester && !isProvider) {
          unreadCounts[conversation.id] = 0;
          continue;
        }

        // Count unread messages from the other party
        const otherSenderType = isRequester ? 'provider' : 'user';

        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('sender_type', otherSenderType)
          .eq('read', false);

        if (error) {
          console.error(`Error counting unread messages for conversation ${conversation.id}:`, error);
          unreadCounts[conversation.id] = 0;
        } else {
          unreadCounts[conversation.id] = data?.length || 0;
        }
      }

      return unreadCounts;
    } catch (error) {
      console.error('Error in getMultipleUnreadCounts:', error);
      return {};
    }
  };

  return useQuery({
    queryKey: ['multipleConversationUnreadCounts', conversationIds, user?.id],
    queryFn: getMultipleUnreadCounts,
    enabled: !!user && conversationIds.length > 0,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}; 