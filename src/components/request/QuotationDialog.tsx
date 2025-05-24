
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, IndianRupee, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';

interface QuotationDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
}

export function QuotationDialog({ request, open, onOpenChange, providerId }: QuotationDialogProps) {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { sendMessage, refetchConversations } = useConversations();

  const handleSendQuotation = async () => {
    if (!user || !request) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to send a quotation.",
        variant: "destructive"
      });
      return;
    }

    const numericPrice = parseFloat(price);
    if (!price.trim() || isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your quotation.",
        variant: "destructive"
      });
      return;
    }

    if (numericPrice > 10000000) {
      toast({
        title: "Price too high",
        description: "Please enter a reasonable quotation amount.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    console.log('Starting quotation send process for request:', request.id);

    try {
      // Check if a conversation already exists with better error handling
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', request.id)
        .eq('provider_id', providerId)
        .eq('user_id', request.user_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.error('Error checking existing conversations:', fetchError);
        throw new Error('Failed to check existing conversations');
      }
      
      let conversationId: string;
      
      if (existingConversations && existingConversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations[0].id;
        console.log('Using existing conversation:', conversationId);
      } else {
        // Create new conversation
        console.log('Creating new conversation for:', {
          request_id: request.id,
          provider_id: providerId,
          user_id: request.user_id
        });
        
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            request_id: request.id,
            provider_id: providerId,
            user_id: request.user_id
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('Error creating conversation:', createError);
          throw new Error(`Failed to create conversation: ${createError.message}`);
        }
        
        if (!newConversation) {
          throw new Error('No conversation data returned');
        }
        
        conversationId = newConversation.id;
        console.log('Created new conversation:', conversationId);
      }
      
      // Send the quotation message
      const messageContent = message.trim() || `I'm interested in helping you with "${request.title}". Here's my quotation:`;
      
      console.log('Sending quotation message:', {
        conversationId,
        content: messageContent,
        senderType: 'provider',
        quotationPrice: numericPrice
      });
      
      await sendMessage({
        conversationId,
        content: messageContent,
        senderType: 'provider',
        quotationPrice: numericPrice
      });
      
      console.log('Quotation sent successfully, refreshing conversations');
      
      // Force refresh conversations with multiple attempts for better reliability
      await refetchConversations();
      
      // Additional refresh after delays to ensure UI updates
      setTimeout(async () => {
        await refetchConversations();
        console.log('Secondary refresh completed');
      }, 500);
      
      setTimeout(async () => {
        await refetchConversations();
        console.log('Tertiary refresh completed');
      }, 1500);
      
      toast({
        title: "Quotation Sent Successfully",
        description: `Your quotation of ₹${numericPrice.toLocaleString()} has been sent to the requester. They will see it in their inbox.`
      });
      
      // Close dialog and reset form
      onOpenChange(false);
      setMessage('');
      setPrice('');
      
    } catch (error: any) {
      console.error('Error in quotation flow:', error);
      toast({
        title: "Error Sending Quotation",
        description: error.message || "There was a problem sending your quotation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Quotation</DialogTitle>
          <DialogDescription>
            Send a price quote to the requester for "{request?.title || 'Unknown Request'}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="price"
                type="number"
                placeholder="Enter your price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-10"
                min="1"
                max="10000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add details about your quotation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendQuotation}
            disabled={isSending || !price.trim()}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Quotation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
