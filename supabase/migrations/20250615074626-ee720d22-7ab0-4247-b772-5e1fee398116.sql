
-- This migration restores the original logic for the get_unread_message_count function
-- to correctly count messages for users who are both customers and service providers,
-- while retaining the security fix for the search path.

CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid")
RETURNS integer
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'pg_catalog', 'public'
AS $$
DECLARE
  count_unread INTEGER;
BEGIN
  SELECT COUNT(m.id) INTO count_unread
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE 
    ((c.user_id = user_uuid AND m.sender_type = 'provider') OR
     (EXISTS (
       SELECT 1 FROM public.service_providers sp
       WHERE sp.id = c.provider_id AND sp.user_id = user_uuid AND m.sender_type = 'user'
     ))) AND
    m.read = FALSE;
  
  RETURN count_unread;
END;
$$;
