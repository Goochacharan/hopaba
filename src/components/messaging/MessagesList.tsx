import React, { useRef, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Message } from '@/types/serviceRequestTypes';
import { DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EnhancedMessageItem } from './EnhancedMessageItem';

interface MessageItemProps {
  message: Message;
  isUser: boolean;
  otherPartyName: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isUser, otherPartyName }) => {
  const hasQuotation = message.quotation_price !== null && message.quotation_price !== undefined;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  // IMPROVED: Format large numbers better for Indian currency
  const formatPrice = (price: number) => {
    if (price >= 10000000) { // 1 Crore or more
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) { // 1 Lakh or more
      return `₹${(price / 100000).toFixed(2)} L`;
    } else if (price >= 1000) { // Thousands
      return `₹${(price / 1000).toFixed(1)}K`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };
  
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
              "mb-2 rounded-lg p-4 border-2",
              isUser 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-md"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className={cn(
                  "h-5 w-5",
                  isUser ? "text-primary-foreground" : "text-green-600"
                )} />
                <span className={cn(
                  "font-semibold text-sm",
                  isUser ? "text-primary-foreground" : "text-green-800"
                )}>
                  {isUser ? "Price Quote Sent" : "Price Quote Received"}
                </span>
              </div>
              <div className={cn(
                "text-3xl font-bold mb-3",
                isUser ? "text-primary-foreground" : "text-green-700"
              )}>
                {formatPrice(message.quotation_price)}
              </div>
              <div className={cn(
                "text-xs mb-2 font-medium",
                isUser ? "text-primary-foreground/80" : "text-green-600"
              )}>
                Full amount: ₹{message.quotation_price.toLocaleString()}
              </div>
              {message.content && (
                <div className={cn(
                  "text-sm mt-3 p-3 rounded-md",
                  isUser 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-white/70 text-green-800 border border-green-200"
                )}>
                  {message.content}
                </div>
              )}
            </div>
          )}
          
          {!hasQuotation && message.content && (
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
  businessName?: string;
  providerId?: string;
}

const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  userId, 
  otherPartyName, 
  isProvider, 
  businessName, 
  providerId 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Debug logging for messages
  useEffect(() => {
    console.log('MessagesList - Messages:', messages);
    console.log('MessagesList - User ID:', userId);
    console.log('MessagesList - Is Provider:', isProvider);
  }, [messages, userId, isProvider]);
  
  return (
    <div className="h-full overflow-y-auto p-3">
      {messages.map(message => {
        // Check if this message has enhanced quotation features
        const hasEnhancedFeatures = message.quotation_images || 
                                   message.delivery_available || 
                                   message.pricing_type || 
                                   message.wholesale_price || 
                                   message.negotiable_price;
        
        const isUser = (isProvider && message.sender_type === 'provider') || 
                      (!isProvider && message.sender_type === 'user');
        
        // Use EnhancedMessageItem for messages with enhanced features, fallback to MessageItem
        if (hasEnhancedFeatures) {
          return (
            <EnhancedMessageItem
              key={message.id}
              message={message}
              isUser={isUser}
              otherPartyName={otherPartyName}
              businessName={businessName}
              providerId={providerId}
            />
          );
        } else {
          return (
            <MessageItem 
              key={message.id} 
              message={message}
              isUser={isUser}
              otherPartyName={otherPartyName}
            />
          );
        }
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesList;
