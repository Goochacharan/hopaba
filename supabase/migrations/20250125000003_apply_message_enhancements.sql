-- Migration to apply message enhancements manually
-- Date: 2025-01-25
-- Description: Add enhanced quotation fields to messages table

-- Add new columns to messages table for enhanced quotation features
DO $$ 
BEGIN
  -- Add quotation_images column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'quotation_images'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD COLUMN "quotation_images" text[] DEFAULT '{}'::text[];
  END IF;

  -- Add delivery_available column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'delivery_available'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD COLUMN "delivery_available" boolean DEFAULT false;
  END IF;

  -- Add pricing_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'pricing_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD COLUMN "pricing_type" text DEFAULT 'fixed'::text;
  END IF;

  -- Add wholesale_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'wholesale_price'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD COLUMN "wholesale_price" integer;
  END IF;

  -- Add negotiable_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'negotiable_price'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD COLUMN "negotiable_price" integer;
  END IF;
END $$;

-- Add constraint for pricing_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_pricing_type_check'
    AND table_name = 'messages'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."messages" 
    ADD CONSTRAINT "messages_pricing_type_check" 
    CHECK (pricing_type = ANY (ARRAY['fixed'::text, 'negotiable'::text, 'wholesale'::text]));
  END IF;
END $$; 