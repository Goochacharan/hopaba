
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  bucket: string;
  folder?: string;
}

interface UploadResult {
  url: string | null;
  error: string | null;
}

export const useSecureFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File, options: FileUploadOptions): string | null => {
    // Check file size (default 5MB)
    const maxSize = options.maxSize || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Check file type
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeToExtension: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif']
    };

    const expectedExtensions = mimeToExtension[file.type];
    if (expectedExtensions && !expectedExtensions.includes(extension || '')) {
      return 'File extension does not match file type';
    }

    return null;
  };

  const uploadFile = async (file: File, options: FileUploadOptions): Promise<UploadResult> => {
    setUploading(true);

    try {
      // Validate file
      const validationError = validateFile(file, options);
      if (validationError) {
        toast({
          title: "Upload Error",
          description: validationError,
          variant: "destructive",
        });
        return { url: null, error: validationError };
      }

      // Generate secure filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `${timestamp}_${randomId}.${fileExt}`;
      
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        return { url: null, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { url: null, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[], options: FileUploadOptions): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, options);
      results.push(result);
      
      // Stop on first error
      if (result.error) {
        break;
      }
    }
    
    return results;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    uploading
  };
};
