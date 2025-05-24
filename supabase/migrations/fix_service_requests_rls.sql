-- Fix RLS policy for service_requests to allow service providers to view all open service requests
-- This addresses the issue where service providers could only see their own requests

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own requests" ON "public"."service_requests";

-- Create a new policy that allows:
-- 1. Users to view their own requests (for request management)
-- 2. All authenticated users to view open requests (for service providers to respond)
CREATE POLICY "Users can view requests" ON "public"."service_requests"
FOR SELECT USING (
  -- Users can always see their own requests
  auth.uid() = user_id 
  OR 
  -- All authenticated users can see open requests
  (status = 'open' AND auth.uid() IS NOT NULL)
);

-- Verify the policy was created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'service_requests' AND policyname = 'Users can view requests';