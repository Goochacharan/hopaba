
import React, { useState } from 'react';
import { Loader2, Send, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface MessageInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  quotationMode: boolean;
  setQuotationMode: React.Dispatch<React.SetStateAction<boolean>>;
  quotationPrice: string;
  setQuotationPrice: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  isSendingMessage: boolean;
  isProvider: boolean;
  requestDetails?: {
    title: string;
    category: string;
    subcategory?: string;
    budget?: number;
  };
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  quotationMode,
  setQuotationMode,
  quotationPrice,
  setQuotationPrice,
  handleSendMessage,
  isSendingMessage,
  isProvider,
  requestDetails
}) => {
  // Handle keypress event for sending messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="border-t p-4">
      {quotationMode && isProvider && (
        <div className="mb-3 p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Send a Price Quote</h3>
          </div>
          
          {requestDetails && (
            <div className="mb-2 text-sm bg-accent/20 p-2 rounded flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">{requestDetails.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {requestDetails.category}
                    {requestDetails.subcategory && ` / ${requestDetails.subcategory}`}
                  </span>
                  {requestDetails.budget && (
                    <Badge variant="outline" className="text-xs">
                      Budget: ₹{requestDetails.budget}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mb-2">
            <div className="flex items-center flex-1">
              <span className="px-3 bg-background border rounded-l-md h-10 flex items-center">₹</span>
              <Input 
                type="number" 
                placeholder="Amount"
                className="rounded-l-none"
                value={quotationPrice}
                onChange={(e) => setQuotationPrice(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setQuotationMode(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Add details about your services, availability, or any special terms below.</p>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            placeholder={quotationMode ? "Add details about your quote..." : "Type your message"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[80px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          {isProvider && !quotationMode && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setQuotationMode(true)}
              title="Send price quote"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
          <Button 
            onClick={handleSendMessage} 
            disabled={isSendingMessage || (!message.trim() && (!quotationMode || !quotationPrice))}
          >
            {isSendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
