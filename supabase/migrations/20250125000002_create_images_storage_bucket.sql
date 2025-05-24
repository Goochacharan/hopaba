-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the images bucket (only if they don't exist)
-- Policy to allow public read access to images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
  END IF;
END $$;

-- Policy to allow authenticated users to upload images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy to allow users to update their own images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own images'
  ) THEN
    CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE 
    USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Policy to allow users to delete their own images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own images'
  ) THEN
    CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE 
    USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$; 