import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { Conversation } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';

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
    service_providers: { id: string; name: string; user_id: string };
  };
  requestInfo?: {
    id: string;
    title: string;
    category: string;
    subcategory?: string;
  };
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  otherPartyName,
  conversation,
  requestInfo
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const request = conversation.service_requests;
  
  // Use presence tracking for this specific conversation
  const { isUserOnline } = usePresence(`conversation-${conversation.id}`);
  
  // Determine the other party's user ID
  const otherPartyUserId = conversation.service_providers?.user_id === user?.id 
    ? conversation.user_id  // If current user is provider, other party is the requester
    : conversation.service_providers?.user_id; // Otherwise, other party is the provider
  
  // Check if both parties are online
  const currentUserOnline = user ? isUserOnline(user.id) : false;
  const otherPartyOnline = otherPartyUserId ? isUserOnline(otherPartyUserId) : false;
  const bothPartiesOnline = currentUserOnline && otherPartyOnline;
  
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-1"
          onClick={() => navigate('/service-requests')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium line-clamp-1">{otherPartyName}</h3>
            {request && (
              <Badge variant="outline" className="truncate max-w-[200px]">
                {request.title}
              </Badge>
            )}
            {/* Online indicator when both parties are online */}
            <OnlineIndicator 
              isOnline={bothPartiesOnline} 
              size="sm"
              className="ml-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {request?.category}
            {request?.subcategory && ` / ${request.subcategory}`}
            {request?.budget && ` • Budget: ₹${request.budget}`}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/request/${conversation.request_id}`)}
        >
          View Request
        </Button>
      </div>

      {/* Additional request info */}
      {request && (request.date_range_start || (request.area && request.city)) && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {request.date_range_start && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(parseISO(request.date_range_start), 'dd MMM yyyy')}
                {request.date_range_end && (
                  <> - {format(parseISO(request.date_range_end), 'dd MMM yyyy')}</>
                )}
              </span>
            </div>
          )}
          
          {request.area && request.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{request.area}, {request.city}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationHeader;
