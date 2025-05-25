import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useServiceProviderUnreadCount = () => {
  const { user } = useAuth();

  const getServiceProviderUnreadCount = async () => {
    if (!user) return 0;

    try {
      // Use a simpler approach: get all conversations where the user is the provider
      // by checking the service_providers table directly through the provider_id
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          provider_id,
          service_providers!inner (id, user_id)
        `)
        .eq('service_providers.user_id', user.id);

      console.log('Provider Conversations:', { conversations, convError });

      if (convError) {
        console.error('Error fetching provider conversations:', convError);
        // If the relationship query fails, try a different approach
        return await getServiceProviderUnreadCountFallback();
      }

      if (!conversations || conversations.length === 0) {
        console.log('No conversations found for provider');
        return 0;
      }

      // Count unread messages from users (requesters) in these conversations
      const conversationIds = conversations.map(c => c.id);
      console.log('Conversation IDs:', conversationIds);
      
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .eq('sender_type', 'user') // Messages from users (requesters)
        .eq('read', false);

      console.log('Unread Messages Query:', { unreadMessages, messagesError });

      if (messagesError) {
        console.error('Error counting unread messages for provider:', messagesError);
        return 0;
      }

      const count = unreadMessages?.length || 0;
      console.log('Service Provider Unread Count:', count);
      return count;
    } catch (error) {
      console.error('Error in getServiceProviderUnreadCount:', error);
      return await getServiceProviderUnreadCountFallback();
    }
  };

  // Fallback method that doesn't rely on table relationships
  const getServiceProviderUnreadCountFallback = async () => {
    try {
      console.log('Using fallback method for service provider unread count');
      
      // First, get all service provider IDs for this user
      const { data: providers, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id);

      if (providerError) {
        console.error('Error fetching service providers in fallback:', providerError);
        return 0;
      }

      if (!providers || providers.length === 0) {
        console.log('User is not a service provider (fallback)');
        return 0;
      }

      const providerIds = providers.map(p => p.id);
      console.log('Provider IDs:', providerIds);

      // Get conversations for these providers
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .in('provider_id', providerIds);

      if (convError) {
        console.error('Error fetching conversations in fallback:', convError);
        return 0;
      }

      if (!conversations || conversations.length === 0) {
        console.log('No conversations found for providers (fallback)');
        return 0;
      }

      const conversationIds = conversations.map(c => c.id);
      console.log('Conversation IDs (fallback):', conversationIds);

      // Count unread messages from users in these conversations
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .in('conversation_id', conversationIds)
        .eq('sender_type', 'user')
        .eq('read', false);

      if (messagesError) {
        console.error('Error counting unread messages in fallback:', messagesError);
        return 0;
      }

      const count = unreadMessages?.length || 0;
      console.log('Service Provider Unread Count (fallback):', count);
      return count;
    } catch (error) {
      console.error('Error in fallback method:', error);
      return 0;
    }
  };

  return useQuery({
    queryKey: ['serviceProviderUnreadCount', user?.id],
    queryFn: getServiceProviderUnreadCount,
    enabled: !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}; 