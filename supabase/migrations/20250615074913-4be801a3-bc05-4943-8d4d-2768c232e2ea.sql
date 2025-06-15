
-- This migration drops the problematic view causing the security error.
DROP VIEW IF EXISTS public.high_limit_sellers;
