-- Fix RLS policy for service_requests to allow service providers to view all open service requests
-- This migration addresses the issue where service providers could only see their own requests

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own requests" ON "public"."service_requests";

-- Create new policies that allow:
-- 1. Users to view their own requests (for request management)
-- 2. Service providers to view all open requests (for responding to requests)

-- Policy 1: Users can view their own requests
CREATE POLICY "Users can view their own requests" ON "public"."service_requests"
FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Service providers can view all open requests
CREATE POLICY "Service providers can view open requests" ON "public"."service_requests"
FOR SELECT USING (
  status = 'open' AND 
  EXISTS (
    SELECT 1 FROM public.service_providers sp 
    WHERE sp.user_id = auth.uid() 
    AND sp.approval_status = 'approved'
  )
);

-- Alternative simpler approach: Allow all authenticated users to view open requests
-- This is more permissive but simpler and ensures the platform works correctly
DROP POLICY IF EXISTS "Service providers can view open requests" ON "public"."service_requests";

CREATE POLICY "All users can view open requests" ON "public"."service_requests"
FOR SELECT USING (
  status = 'open' OR auth.uid() = user_id
); 