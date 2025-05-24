
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
  const { createConversation, sendMessage } = useConversations();

  const handleSendQuotation = async () => {
    if (!user || !request) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to send a quotation.",
        variant: "destructive"
      });
      return;
    }

    if (!price.trim() || isNaN(parseFloat(price))) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your quotation.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      // Create the conversation
      createConversation(request.id, providerId, request.user_id);
      
      // Find the newly created conversation - we'll give it a moment to be created
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('conversations')
            .select('id')
            .eq('request_id', request.id)
            .eq('provider_id', providerId)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Send the quotation message
            sendMessage({
              conversationId: data.id,
              content: message || `I'm interested in helping you with this service request.`,
              senderType: 'provider',
              quotationPrice: parseFloat(price)
            });
            
            toast({
              title: "Quotation Sent",
              description: `Your quotation of ₹${price} has been sent to the requester.`
            });
            
            // Close dialog after sending
            onOpenChange(false);
            
            // Reset form
            setMessage('');
            setPrice('');
          }
        } catch (error) {
          console.error("Error finding conversation:", error);
          toast({
            title: "Error",
            description: "There was a problem sending your quotation. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsSending(false);
        }
      }, 800);
      
    } catch (error) {
      console.error("Error in quotation flow:", error);
      toast({
        title: "Error",
        description: "There was a problem sending your quotation. Please try again.",
        variant: "destructive"
      });
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
                min="0"
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
