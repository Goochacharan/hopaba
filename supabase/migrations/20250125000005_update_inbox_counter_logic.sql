-- Migration to update inbox counter logic
-- Date: 2025-01-25
-- Description: Modify unread message count to only include messages for requests the user raised

-- Create a new function that only counts unread messages for requests the user raised
CREATE OR REPLACE FUNCTION "public"."get_unread_message_count_for_user_requests"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  count_unread INTEGER;
BEGIN
  -- Only count unread messages from providers for conversations where the user is the requester
  -- This excludes messages from users when the current user is acting as a service provider
  SELECT COUNT(m.id) INTO count_unread
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE 
    c.user_id = user_uuid AND 
    m.sender_type = 'provider' AND
    m.read = FALSE;
  
  RETURN count_unread;
END;
$$;

-- Update the existing function to use the new logic
CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  count_unread INTEGER;
BEGIN
  -- Only count unread messages from providers for conversations where the user is the requester
  -- This excludes messages from users when the current user is acting as a service provider
  SELECT COUNT(m.id) INTO count_unread
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  WHERE 
    c.user_id = user_uuid AND 
    m.sender_type = 'provider' AND
    m.read = FALSE;
  
  RETURN count_unread;
END;
$$;

-- Grant permissions for the new function
GRANT ALL ON FUNCTION "public"."get_unread_message_count_for_user_requests"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count_for_user_requests"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count_for_user_requests"("user_uuid" "uuid") TO "service_role"; 