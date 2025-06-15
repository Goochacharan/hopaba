-- This migration updates several functions to set a secure search_path,
-- resolving the "Function Search Path Mutable" warnings in Supabase.

-- Update delete_service_request_cascade
CREATE OR REPLACE FUNCTION "public"."delete_service_request_cascade"("request_id_param" "uuid", "user_id_param" "uuid")
RETURNS "void"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'pg_catalog', 'public'
AS $$
BEGIN
  -- Use a transaction to ensure all operations succeed or fail together
  BEGIN
    -- Step 1: Delete all messages associated with any conversation related to this service request
    DELETE FROM public.messages 
    WHERE conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE request_id = request_id_param
    );
    
    -- Step 2: Delete all conversations related to this service request
    DELETE FROM public.conversations 
    WHERE request_id = request_id_param;
    
    -- Step 3: Delete the service request itself, ensuring it belongs to the user
    DELETE FROM public.service_requests 
    WHERE id = request_id_param AND user_id = user_id_param;
    
    -- If we reach this point without errors, COMMIT is automatic
  EXCEPTION
    WHEN OTHERS THEN
      -- If any error occurs, the transaction will be rolled back
      RAISE EXCEPTION 'Error during cascade delete: %', SQLERRM;
  END;
END;
$$;

-- Update get_unread_message_count
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

-- Update get_unread_message_count_for_user_requests
CREATE OR REPLACE FUNCTION "public"."get_unread_message_count_for_user_requests"("user_uuid" "uuid")
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

-- Update update_conversation_timestamp trigger function
CREATE OR REPLACE FUNCTION "public"."update_conversation_timestamp"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" TO 'pg_catalog', 'public'
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Update get_matching_providers_for_request
CREATE OR REPLACE FUNCTION "public"."get_matching_providers_for_request"("request_id" "uuid")
RETURNS TABLE("provider_id" "uuid", "provider_name" "text", "provider_category" "text", "provider_subcategory" "text", "user_id" "uuid")
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'pg_catalog', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as provider_id, 
    sp.name as provider_name,
    sp.category as provider_category,
    -- Convert the first matching subcategory to text for display
    COALESCE(
      (SELECT unnest(sp.subcategory) LIMIT 1), 
      ''
    ) as provider_subcategory,
    sp.user_id
  FROM 
    public.service_providers sp
  JOIN 
    public.service_requests sr ON sr.id = request_id
  WHERE 
    -- Match on category (case insensitive)
    LOWER(sp.category) = LOWER(sr.category) 
    AND (
      -- Match if the service request subcategory exists in the provider's subcategory array
      -- OR if the service request has no subcategory
      sr.subcategory IS NULL
      OR TRIM(sr.subcategory) = ''
      OR EXISTS (
        SELECT 1 FROM unnest(sp.subcategory) sub
        WHERE LOWER(sub) = LOWER(TRIM(sr.subcategory))
      )
    )
    -- NEW: Add city matching (case insensitive)
    AND LOWER(sp.city) = LOWER(sr.city)
    AND sp.approval_status = 'approved';
END;
$$;

-- Update check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier text, action_type text, max_requests integer DEFAULT 100, time_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  request_count INTEGER;
BEGIN
  -- This is a placeholder for rate limiting logic
  -- In a real implementation, you'd store rate limit data in a table
  -- For now, we'll always return true but log the attempt
  
  -- Log the rate limit check (in production, you'd implement actual counting)
  INSERT INTO public.audit_logs (user_id, action, details, created_at)
  VALUES (
    auth.uid(),
    'rate_limit_check',
    jsonb_build_object(
      'user_identifier', user_identifier,
      'action_type', action_type,
      'max_requests', max_requests,
      'time_window_minutes', time_window_minutes
    ),
    NOW()
  ) ON CONFLICT DO NOTHING; -- Ignore if audit_logs table doesn't exist yet
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- If audit_logs table doesn't exist, just return true
    RETURN true;
END;
$function$;
