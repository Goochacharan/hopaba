# Storage Setup Guide for Enhanced Quotation System

## Quick Setup: Create Storage Bucket Manually

Since automatic bucket creation is restricted by RLS policies, please follow these steps to create the storage bucket manually:

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pswgsxyxhdhhpvugkdqa`
3. Navigate to **Storage** in the left sidebar

### Step 2: Create Images Bucket
1. Click **"New bucket"** button
2. Set the following configuration:
   - **Bucket name**: `images`
   - **Public bucket**: ✅ **Enable** (checked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg` 
     - `image/png`
     - `image/webp`
     - `image/gif`

### Step 3: Set Bucket Policies (Optional)
The bucket should work with default policies, but if you need custom policies:

1. Go to **Storage** → **Policies**
2. Create policies for the `images` bucket:
   - **SELECT**: Allow public read access
   - **INSERT**: Allow authenticated users to upload
   - **DELETE**: Allow users to delete their own files

### Step 4: Test Upload
1. Go back to your application
2. Try uploading an image in the quotation dialog
3. It should now work successfully!

## Alternative: SQL Command (Advanced)

If you have database access, you can run this SQL command:

```sql
-- Create the images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);
```

## Verification

After creating the bucket, the enhanced quotation system will have:
- ✅ Image upload (up to 5 images)
- ✅ Pricing types (Fixed/Negotiable/Wholesale)
- ✅ Delivery availability toggle
- ✅ Business page navigation

The error message will disappear and image uploads will work normally. 