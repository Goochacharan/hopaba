
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
    console.log(`Starting manual cascade deletion for request ${requestId}`);
    
    // Step 1: Find all conversations associated with this service request
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id')
      .eq('request_id', requestId);
    
    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      throw conversationsError;
    }
    
    console.log(`Found ${conversations?.length || 0} conversations to delete`);
    
    // Step 2: For each conversation, delete all associated messages
    for (const conversation of conversations || []) {
      console.log(`Deleting messages for conversation ${conversation.id}`);
      
      // Delete messages first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversation.id);
      
      if (messagesError) {
        console.error(`Error deleting messages for conversation ${conversation.id}:`, messagesError);
        throw messagesError;
      }
      
      // Verify messages were deleted
      const { data: remainingMessages } = await supabase
        .from('messages')
        .select('count')
        .eq('conversation_id', conversation.id);
        
      if (remainingMessages && remainingMessages.length > 0) {
        console.warn(`Some messages still exist for conversation ${conversation.id}`);
        // Continue anyway, as they might be deleted in the next attempt
      }
      
      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);
      
      if (conversationError) {
        console.error(`Error deleting conversation ${conversation.id}:`, conversationError);
        throw conversationError;
      }
      
      // Verify conversation was deleted
      const { data: checkConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversation.id);
        
      if (checkConversation && checkConversation.length > 0) {
        console.error(`Conversation ${conversation.id} still exists after deletion attempt`);
        throw new Error(`Failed to delete conversation: ${conversation.id}`);
      }
    }
    
    // Step 3: Delete the service request
    console.log(`Deleting service request ${requestId}`);
    const { error: requestError } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId);
    
    if (requestError) {
      console.error('Error deleting service request:', requestError);
      throw requestError;
    }
    
    // Verify service request was deleted
    const { data: checkRequest } = await supabase
      .from('service_requests')
      .select('id')
      .eq('id', requestId);
      
    if (checkRequest && checkRequest.length > 0) {
      console.error(`Service request ${requestId} still exists after deletion attempt`);
      throw new Error(`Failed to delete service request: ${requestId}`);
    }
    
    console.log(`Manual cascade deletion completed successfully for request ${requestId}`);
    return true;
  } catch (error) {
    console.error('Manual cascade delete failed:', error);
    throw error;
  }
};
