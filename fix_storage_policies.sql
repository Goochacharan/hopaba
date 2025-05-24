-- Fix storage policies for the existing images bucket
-- Run this in your Supabase SQL Editor

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create new policies for the images bucket
-- Policy to allow public read access to images
CREATE POLICY "Images: Public read access" ON storage.objects 
FOR SELECT USING (bucket_id = 'images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Images: Authenticated upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to update their own images
CREATE POLICY "Images: Users can update own" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own images
CREATE POLICY "Images: Users can delete own" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure the bucket is public and has correct settings
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'images'; 