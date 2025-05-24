
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, IndianRupee, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { FormLabel } from '@/components/ui/form';

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

  // Debug logging for props and state changes
  useEffect(() => {
    console.log('=== QuotationDialog DEBUG ===');
    console.log('Props received:', {
      request: request?.id || 'null',
      open,
      providerId,
      user: user?.id || 'none'
    });
    console.log('Current state:', {
      message,
      price,
      isSending
    });
  }, [request, open, providerId, user, message, price, isSending]);

  // Debug when dialog opens/closes
  useEffect(() => {
    if (open) {
      console.log('DEBUG: QuotationDialog is opening');
    } else {
      console.log('DEBUG: QuotationDialog is closing');
    }
  }, [open]);

  const handleSendQuotation = async () => {
    console.log('=== DEBUG: handleSendQuotation called ===');
    
    if (!user || !request) {
      console.log('DEBUG: Missing user or request:', { user: !!user, request: !!request });
      toast({
        title: "Authentication required",
        description: "You must be logged in to send a quotation.",
        variant: "destructive"
      });
      return;
    }

    if (!price.trim() || isNaN(parseFloat(price))) {
      console.log('DEBUG: Invalid price:', price);
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your quotation.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    console.log('DEBUG: Starting quotation send process');

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

  // Debug render
  console.log('DEBUG: QuotationDialog rendering with open =', open, 'request =', !!request);

  return (
    <>
      {/* Debug indicator */}
      {open && (
        <div className="fixed top-16 right-4 bg-green-500 text-white p-2 rounded z-[9999]">
          QUOTATION DIALOG COMPONENT IS RENDERED AND OPEN
        </div>
      )}
      
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
              <FormLabel htmlFor="price">Price (₹)</FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter your price"
                  value={price}
                  onChange={(e) => {
                    console.log('DEBUG: Price changed to:', e.target.value);
                    setPrice(e.target.value);
                  }}
                  className="pl-10"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="message">Message (optional)</FormLabel>
              <Textarea
                id="message"
                placeholder="Add details about your quotation..."
                value={message}
                onChange={(e) => {
                  console.log('DEBUG: Message changed to:', e.target.value);
                  setMessage(e.target.value);
                }}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                console.log('DEBUG: Cancel button clicked');
                onOpenChange(false);
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('DEBUG: Send Quotation button clicked');
                handleSendQuotation();
              }}
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
    </>
  );
}
