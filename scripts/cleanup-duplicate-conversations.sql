
-- Clean up duplicate conversations (keeping only the ones with messages)
-- This script identifies and removes duplicate conversations for the same request/provider combination

-- First, let's identify conversations that have messages
WITH conversations_with_messages AS (
  SELECT DISTINCT c.id, c.request_id, c.provider_id, c.user_id, c.created_at
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  )
),
-- Find conversations without messages that are duplicates
conversations_to_delete AS (
  SELECT c.id
  FROM conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  )
  AND EXISTS (
    SELECT 1 FROM conversations_with_messages cwm 
    WHERE cwm.request_id = c.request_id 
    AND cwm.provider_id = c.provider_id 
    AND cwm.user_id = c.user_id
  )
)
-- Delete the empty duplicate conversations
DELETE FROM conversations 
WHERE id IN (SELECT id FROM conversations_to_delete);

-- Update last_message_at for conversations that have messages but incorrect timestamps
UPDATE conversations 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE conversation_id = conversations.id
)
WHERE EXISTS (
  SELECT 1 FROM messages WHERE conversation_id = conversations.id
);

-- Show summary of remaining conversations
SELECT 
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN EXISTS (SELECT 1 FROM messages WHERE conversation_id = conversations.id) THEN 1 END) as conversations_with_messages
FROM conversations;
