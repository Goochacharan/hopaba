
-- Step 1: Create a function for cascading deletion of a service provider and its related data

CREATE OR REPLACE FUNCTION public.delete_service_provider_cascade(provider_id_param uuid, user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete messages related to conversations where the provider is the specified one
  DELETE FROM public.messages
  WHERE conversation_id IN (
    SELECT id FROM public.conversations
    WHERE provider_id = provider_id_param
  );

  -- Delete conversations associated with the business
  DELETE FROM public.conversations
  WHERE provider_id = provider_id_param;

  -- Delete the service provider (business) itself, making sure it belongs to the user
  DELETE FROM public.service_providers
  WHERE id = provider_id_param AND user_id = user_id_param;
END;
$function$;

-- Grant execute permission so client can call this function if needed
GRANT EXECUTE ON FUNCTION public.delete_service_provider_cascade(uuid, uuid) TO anon, authenticated;
