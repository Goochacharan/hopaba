
/**
 * Helper functions for service request operations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Manual cascade deletion of a service request and all related entities
 * This is a fallback approach if the RPC function fails
 */
export const manualCascadeDelete = async (requestId: string, userId: string) => {
  try {
    // Step 1: Find all conversations associated with this service request
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id')
      .eq('request_id', requestId);
    
    if (conversationsError) throw conversationsError;
    
    // Step 2: For each conversation, delete all associated messages
    for (const conversation of conversations || []) {
      // Delete messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversation.id);
      
      if (messagesError) throw messagesError;
      
      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);
      
      if (conversationError) throw conversationError;
    }
    
    // Step 3: Delete the service request
    const { error: requestError } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId);
    
    if (requestError) throw requestError;
    
    return true;
  } catch (error) {
    console.error('Manual cascade delete failed:', error);
    throw error;
  }
};
