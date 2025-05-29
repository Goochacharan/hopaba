import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { Conversation } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface ConversationHeaderProps {
  otherPartyName: string;
  conversation: Conversation & {
    service_requests: {
      id: string;
      title: string;
      category: string;
      subcategory?: string;
      budget?: number;
      date_range_start?: string;
      date_range_end?: string;
      area?: string;
      city?: string;
    };
    service_providers: {
      id: string;
      name: string;
      user_id: string;
    };
  };
  requestInfo?: {
    id: string;
    title: string;
    category: string;
    subcategory?: string;
  };
  onClose?: () => void;
}
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  otherPartyName,
  conversation,
  requestInfo,
  onClose
}) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const request = conversation.service_requests;

  // Use presence tracking for this specific conversation
  const {
    isUserOnline
  } = usePresence(`conversation-${conversation.id}`);

  // Check if user is a service provider
  const {
    data: isServiceProvider = false
  } = useQuery({
    queryKey: ['isServiceProvider', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const {
        data
      } = await supabase.from('service_providers').select('id').eq('user_id', user.id);
      return data && data.length > 0;
    },
    enabled: !!user,
    staleTime: 300000 // Cache for 5 minutes
  });

  // Determine the other party's user ID
  const otherPartyUserId = conversation.service_providers?.user_id === user?.id ? conversation.user_id // If current user is provider, other party is the requester
  : conversation.service_providers?.user_id; // Otherwise, other party is the provider

  // Check if both parties are online
  const currentUserOnline = user ? isUserOnline(user.id) : false;
  const otherPartyOnline = otherPartyUserId ? isUserOnline(otherPartyUserId) : false;
  const bothPartiesOnline = currentUserOnline && otherPartyOnline;

  // Navigate back to the appropriate page based on where user came from
  const handleBackNavigation = () => {
    console.log('🔙 Back navigation triggered');
    console.log('📊 Navigation context:', {
      isServiceProvider,
      userId: user?.id,
      conversationUserId: conversation.user_id,
      serviceProviderUserId: conversation.service_providers?.user_id,
      referrer: document.referrer
    });
    try {
      // Check for navigation source stored in sessionStorage (most reliable)
      const navigationSource = sessionStorage.getItem('conversationNavigationSource');
      console.log('🔍 Navigation source from sessionStorage:', navigationSource);
      if (navigationSource) {
        // Clear the stored source after using it
        sessionStorage.removeItem('conversationNavigationSource');
        if (navigationSource === 'service-requests') {
          console.log('➡️ Navigating to /service-requests (from sessionStorage)');
          navigate('/service-requests');
          return;
        } else if (navigationSource === 'inbox') {
          console.log('➡️ Navigating to /inbox (from sessionStorage)');
          navigate('/inbox');
          return;
        } else if (navigationSource.startsWith('request-')) {
          const requestId = navigationSource.replace('request-', '');
          console.log('➡️ Navigating to request page (from sessionStorage):', requestId);
          navigate(`/request/${requestId}`);
          return;
        }
      }

      // Fallback: Try to determine from referrer, but be smarter about inbox routing
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      if (referrer && referrer.startsWith(currentOrigin)) {
        const referrerPath = new URL(referrer).pathname;
        console.log('🔍 Referrer path detected:', referrerPath);

        // If referrer is inbox, check conversation context to determine original source
        if (referrerPath.includes('/inbox')) {
          const isCurrentUserTheProvider = conversation.service_providers?.user_id === user?.id;

          // If user is a service provider AND they're the provider in this conversation,
          // they likely came from service-requests (even if routed through inbox)
          if (isServiceProvider && isCurrentUserTheProvider) {
            console.log('➡️ Navigating to /service-requests (inbox referrer but user is provider)');
            navigate('/service-requests');
            return;
          } else {
            console.log('➡️ Navigating to /inbox (inbox referrer and user is requester)');
            navigate('/inbox');
            return;
          }
        } else if (referrerPath.includes('/service-requests')) {
          console.log('➡️ Navigating to /service-requests (from referrer)');
          navigate('/service-requests');
          return;
        } else if (referrerPath.includes('/request/')) {
          // Extract request ID from referrer and navigate back to that request
          const requestIdMatch = referrerPath.match(/\/request\/([^\/]+)/);
          if (requestIdMatch) {
            console.log('➡️ Navigating to request page (from referrer):', requestIdMatch[1]);
            navigate(`/request/${requestIdMatch[1]}`);
            return;
          }
        }
      }
      console.log('🔄 Using conversation context fallback');

      // Final fallback: Use conversation context
      const isCurrentUserTheProvider = conversation.service_providers?.user_id === user?.id;
      const isCurrentUserTheRequester = conversation.user_id === user?.id;
      console.log('🎯 Conversation roles for fallback:', {
        isCurrentUserTheProvider,
        isCurrentUserTheRequester,
        isServiceProvider
      });

      // If user is a service provider AND they're the provider in this conversation
      if (isServiceProvider && isCurrentUserTheProvider) {
        console.log('➡️ Navigating to /service-requests (fallback - provider viewing their service)');
        navigate('/service-requests');
        return;
      }

      // If user is the requester in this conversation
      if (isCurrentUserTheRequester) {
        console.log('➡️ Navigating to /inbox (fallback - requester viewing their request)');
        navigate('/inbox');
        return;
      }

      // Final fallback for edge cases
      console.log('➡️ Navigating to /inbox (final fallback)');
      navigate('/inbox');
    } catch (error) {
      console.warn('❌ Error in back navigation, using fallback:', error);
      // Error fallback: navigate based on user type with conversation context
      const isCurrentUserTheProvider = conversation.service_providers?.user_id === user?.id;
      if (isServiceProvider && isCurrentUserTheProvider) {
        console.log('➡️ Error fallback: Navigating to /service-requests');
        navigate('/service-requests');
      } else {
        console.log('➡️ Error fallback: Navigating to /inbox');
        navigate('/inbox');
      }
    }
  };
  return <div className="p-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackNavigation}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm line-clamp-1">{otherPartyName}</h3>
            {request && <Badge variant="outline" className="text-xs truncate max-w-[150px]">
                {request.title}
              </Badge>}
            <OnlineIndicator isOnline={bothPartiesOnline} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {request?.category}
            {request?.subcategory && ` / ${request.subcategory}`}
            {request?.budget && ` • ₹${request.budget}`}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => navigate(`/request/${conversation.request_id}`)} className="h-7 text-xs py-0 px-[20px]">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          {onClose}
        </div>
      </div>
    </div>;
};
export default ConversationHeader;