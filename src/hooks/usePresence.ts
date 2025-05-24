import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PresenceState {
  user_id: string;
  online_at: string;
  username?: string;
}

export const usePresence = (channelName: string = 'general') => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create a unique channel for presence
    const channel = supabase.channel(`presence:${channelName}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence state
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const users: Record<string, PresenceState> = {};
        
        Object.keys(newState).forEach((userId) => {
          const presences = newState[userId];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id && presence.online_at) {
              users[userId] = presence as PresenceState;
            }
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          const presence = newPresences[0] as any;
          if (presence.user_id && presence.online_at) {
            setOnlineUsers(prev => ({
              ...prev,
              [key]: presence as PresenceState
            }));
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          username: user.email?.split('@')[0] || 'Anonymous',
        });
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user, channelName]);

  // Check if a specific user is online
  const isUserOnline = (userId: string): boolean => {
    return userId in onlineUsers;
  };

  // Get online status for multiple users
  const getOnlineStatus = (userIds: string[]): Record<string, boolean> => {
    const status: Record<string, boolean> = {};
    userIds.forEach(userId => {
      status[userId] = isUserOnline(userId);
    });
    return status;
  };

  // Get count of online users
  const onlineCount = Object.keys(onlineUsers).length;

  return {
    onlineUsers,
    onlineCount,
    isUserOnline,
    getOnlineStatus,
  };
}; 