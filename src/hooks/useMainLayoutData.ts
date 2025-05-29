
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export const useMainLayoutData = () => {
  const { user } = useAuth();

  // Optimized service provider check with longer cache
  const { data: isServiceProvider = false, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['user-service-provider', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 20 * 60 * 1000,   // Keep in cache for 20 minutes
  });

  // Optimized unread count query
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['layout-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .rpc('get_unread_message_count_for_user_requests', {
          user_uuid: user.id
        });

      return error ? 0 : (data || 0);
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes instead of 1
  });

  // Service provider unread count - only fetch if user is a service provider
  const { data: serviceProviderUnreadCount = 0 } = useQuery({
    queryKey: ['service-provider-unread', user?.id],
    queryFn: async () => {
      if (!user || !isServiceProvider) return 0;
      
      // First get the provider ID
      const { data: providerData } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!providerData) return 0;

      // Then get conversations for this provider
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('provider_id', providerData.id);

      if (!conversations || conversations.length === 0) return 0;

      // Finally count unread messages from users in these conversations
      const conversationIds = conversations.map(c => c.id);
      
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_type', 'user')
        .eq('read', false)
        .in('conversation_id', conversationIds);

      return error ? 0 : (count || 0);
    },
    enabled: !!user && isServiceProvider,
    staleTime: 30 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    isServiceProvider,
    isLoadingProvider,
    unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    serviceProviderUnreadCount: typeof serviceProviderUnreadCount === 'number' ? serviceProviderUnreadCount : 0
  }), [isServiceProvider, isLoadingProvider, unreadCount, serviceProviderUnreadCount]);
};
