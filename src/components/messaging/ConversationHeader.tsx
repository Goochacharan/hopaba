
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/types/serviceRequestTypes';

interface ConversationHeaderProps {
  otherPartyName: string;
  conversation: Conversation & {
    service_requests: { id: string; title: string; category: string; subcategory?: string };
    service_providers: { id: string; name: string; user_id: string };
  };
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  otherPartyName,
  conversation
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-1"
          onClick={() => navigate('/messages')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium line-clamp-1">{otherPartyName}</h3>
            {conversation.service_requests && (
              <Badge variant="outline" className="truncate max-w-[200px]">
                {conversation.service_requests.title}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {conversation.service_requests?.category}
            {conversation.service_requests?.subcategory && 
              ` / ${conversation.service_requests.subcategory}`}
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
    </div>
  );
};

export default ConversationHeader;
