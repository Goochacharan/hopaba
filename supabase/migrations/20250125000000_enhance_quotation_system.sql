-- Migration to enhance quotation system
-- Date: 2025-01-25
-- Description: Add quotation images, delivery options, and pricing types to messages table

-- Add new columns to messages table for enhanced quotation features
ALTER TABLE "public"."messages" 
ADD COLUMN IF NOT EXISTS "quotation_images" text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS "delivery_available" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "pricing_type" text DEFAULT 'fixed'::text,
ADD COLUMN IF NOT EXISTS "wholesale_price" integer,
ADD COLUMN IF NOT EXISTS "negotiable_price" integer;

-- Add constraint for pricing_type
ALTER TABLE "public"."messages" 
ADD CONSTRAINT "messages_pricing_type_check" 
CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'negotiable'::text, 'wholesale'::text])); 