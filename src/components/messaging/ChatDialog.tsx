
import React, { useEffect } from 'react';
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

  // Find the specific conversation
  const conversation = conversations?.find(conv => conv.id === conversationId);

  // Close dialog if conversation not found and not loading
  useEffect(() => {
    if (!isLoadingConversations && conversationId && !conversation) {
      onOpenChange(false);
    }
  }, [conversation, conversationId, isLoadingConversations, onOpenChange]);

  if (!open || !conversationId) {
    return null;
  }

  if (isLoadingConversations) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
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
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <ConversationHeader 
            otherPartyName={otherPartyName}
            conversation={conversation}
          />
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <MessagesList 
              conversationId={conversationId}
              messages={[]} // This will be loaded by the component itself
              userId={user?.id || ''}
              otherPartyName={otherPartyName}
              isProvider={isProvider}
              businessName={conversation.service_providers?.name}
              providerId={conversation.provider_id}
            />
          </div>
          
          <div className="border-t bg-background p-4">
            <MessageInput 
              message=""
              setMessage={() => {}}
              quotationMode={false}
              setQuotationMode={() => {}}
              quotationPrice=""
              setQuotationPrice={() => {}}
              handleSendMessage={() => {}}
              isSendingMessage={false}
              isProvider={isProvider}
              requestDetails={conversation.service_requests ? {
                title: conversation.service_requests.title,
                category: conversation.service_requests.category,
                subcategory: conversation.service_requests.subcategory,
                budget: conversation.service_requests.budget
              } : undefined}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
