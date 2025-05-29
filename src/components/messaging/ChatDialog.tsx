import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConversationHeader from '@/components/messaging/ConversationHeader';
import MessagesList from '@/components/messaging/MessagesList';
import MessageInput from '@/components/messaging/MessageInput';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Message } from '@/types/serviceRequestTypes';

interface ChatDialogProps {
  conversationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  conversationId,
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { conversations, isLoadingConversations } = useConversations();
  const queryClient = useQueryClient();

  // Message input state
  const [message, setMessage] = useState('');
  const [quotationMode, setQuotationMode] = useState(false);
  const [quotationPrice, setQuotationPrice] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Find the specific conversation
  const conversation = conversations?.find(conv => conv.id === conversationId);

  // Fetch messages for this conversation
  const { data: messagesData = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!conversationId && open,
    staleTime: 30000, // 30 seconds
  });

  // Type cast messages to ensure proper typing
  const messages: Message[] = messagesData.map(msg => ({
    ...msg,
    sender_type: msg.sender_type as "user" | "provider",
    pricing_type: msg.pricing_type as "fixed" | "negotiable" | "wholesale",
    attachments: msg.attachments || [],
    quotation_images: msg.quotation_images || [],
    delivery_available: msg.delivery_available || false,
    quotation_price: msg.quotation_price || undefined,
    negotiable_price: msg.negotiable_price || undefined,
    wholesale_price: msg.wholesale_price || undefined
  }));

  // Close dialog if conversation not found and not loading
  useEffect(() => {
    if (!isLoadingConversations && conversationId && !conversation) {
      onOpenChange(false);
    }
  }, [conversation, conversationId, isLoadingConversations, onOpenChange]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!conversationId || !user || (!message.trim() && !quotationMode)) return;

    setIsSendingMessage(true);
    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: conversation?.service_providers?.user_id === user.id ? 'provider' : 'user',
        content: message.trim(),
      };

      // Add quotation data if in quotation mode
      if (quotationMode && quotationPrice) {
        messageData.quotation_price = parseInt(quotationPrice);
        messageData.pricing_type = 'fixed';
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Clear form
      setMessage('');
      setQuotationPrice('');
      setQuotationMode(false);

      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!open || !conversationId) {
    return null;
  }

  if (isLoadingConversations) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-screen flex flex-col p-0">
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!conversation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-screen flex flex-col p-0">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle>Conversation Not Found</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">This conversation could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Determine other party name based on user type
  const isProvider = conversation.service_providers?.user_id === user?.id;
  const otherPartyName = isProvider 
    ? `${conversation.service_requests?.title || 'Customer'}`
    : conversation.service_providers?.name || 'Service Provider';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-screen flex flex-col p-0">
        <div className="border-b">
          <ConversationHeader 
            otherPartyName={otherPartyName}
            conversation={conversation}
            onClose={() => onOpenChange(false)}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <MessagesList 
                messages={messages}
                userId={user?.id || ''}
                otherPartyName={otherPartyName}
                isProvider={isProvider}
                businessName={conversation.service_providers?.name}
                providerId={conversation.provider_id}
              />
            )}
          </div>
          
          <div className="border-t bg-background p-2">
            <MessageInput 
              message={message}
              setMessage={setMessage}
              quotationMode={quotationMode}
              setQuotationMode={setQuotationMode}
              quotationPrice={quotationPrice}
              setQuotationPrice={setQuotationPrice}
              handleSendMessage={handleSendMessage}
              isSendingMessage={isSendingMessage}
              isProvider={isProvider}
              requestDetails={conversation.service_requests ? {
                title: conversation.service_requests.title,
                category: conversation.service_requests.category,
                subcategory: conversation.service_requests.subcategory
              } : undefined}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
