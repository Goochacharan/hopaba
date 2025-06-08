0-- Add city matching to the get_matching_providers_for_request function
-- This ensures that service providers only see requests from their city

CREATE OR REPLACE FUNCTION public.get_matching_providers_for_request(request_id uuid)
 RETURNS TABLE(provider_id uuid, provider_name text, provider_category text, provider_subcategory text, user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$; 