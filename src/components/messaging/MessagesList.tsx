
import React, { useRef, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message } from '@/types/serviceRequestTypes';
import { DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MessageItemProps {
  message: Message;
  isUser: boolean;
  otherPartyName: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isUser, otherPartyName }) => {
  const hasQuotation = message.quotation_price !== null && message.quotation_price !== undefined;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-2",
        isUser ? "flex-row" : "flex-row-reverse"
      )}>
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}>
          {hasQuotation && (
            <div className={cn(
              "mb-2 rounded-lg p-3 border",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Price Quote</span>
              </div>
              <div className="text-xl font-bold mb-1">₹{message.quotation_price}</div>
              <div className="text-sm opacity-80">
                {message.content}
              </div>
            </div>
          )}
          
          {!hasQuotation && (
            <div className={cn(
              "rounded-lg p-3 text-sm",
              isUser 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              {message.content}
            </div>
          )}
          
          {hasAttachments && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {message.attachments.map((attachment, index) => (
                <img 
                  key={index}
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="rounded-md object-cover w-full aspect-square"
                />
              ))}
            </div>
          )}
          
          <div className={cn(
            "text-xs text-muted-foreground mt-1",
            isUser ? "text-right" : "text-left"
          )}>
            {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MessagesListProps {
  messages: Message[];
  userId: string;
  otherPartyName: string;
  isProvider: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, userId, otherPartyName, isProvider }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(message => (
        <MessageItem 
          key={message.id} 
          message={message}
          // For providers, messages sent as 'provider' are from the user (current user)
          // For regular users, messages sent as 'user' are from the user (current user)
          isUser={(isProvider && message.sender_type === 'provider') || 
                 (!isProvider && message.sender_type === 'user')}
          otherPartyName={otherPartyName}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
