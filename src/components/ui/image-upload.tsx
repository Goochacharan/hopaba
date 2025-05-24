
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  bucketName?: string;
  renderButton?: (onClick: () => void) => React.ReactNode;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  bucketName = 'optimized-images',
  renderButton
}) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const compressImage = async (file: File, maxSizeKB = 200): Promise<Blob> => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    await new Promise(resolve => { img.onload = resolve; });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    let width = img.width;
    let height = img.height;
    
    const scale = Math.min(1, Math.sqrt((maxSizeKB * 1024) / file.size));
    width *= scale;
    height *= scale;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, file.type, 0.7);
    });
  };

  const uploadToStorage = async (file: Blob) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please log in first', variant: 'destructive' });
      return null;
    }

    const fileExt = file.type.split('/')[1];
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Upload Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    console.log("Starting file upload process");
    
    try {
      const newImages = [...(images || [])]; // Ensure images is an array
      console.log("Current images:", newImages);
      
      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= maxImages) break;
        
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        
        const compressedBlob = await compressImage(file);
        const publicUrl = await uploadToStorage(compressedBlob);
        
        if (publicUrl) {
          newImages.push(publicUrl);
          console.log("Added new image URL:", publicUrl);
        }
      }
      
      console.log("Final images array:", newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ 
        title: 'Upload Error', 
        description: 'Failed to upload images', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.includes('/storage/v1/object/public/')) {
      const path = imageToRemove.split('public/')[1];
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([path]);
      
      if (error) {
        console.error('Error removing image:', error);
      }
    }

    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  if (renderButton) {
    return <>{renderButton(handleClick)}</>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {(images || []).map((image, index) => (
          <div key={index} className="relative group">
            <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden border">
              <img 
                src={image} 
                alt={`Uploaded image ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {(images || []).length < maxImages && (
          <label className="cursor-pointer">
            <AspectRatio ratio={1} className="bg-muted rounded-md overflow-hidden border border-dashed border-muted-foreground/50 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center p-2 text-muted-foreground">
                <UploadCloud className="h-8 w-8 mb-2" />
                <span className="text-xs text-center">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </span>
              </div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </AspectRatio>
          </label>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        {(images || []).length > 0 ? (
          <span>
            {images.length} of {maxImages} images uploaded
          </span>
        ) : (
          <span className="text-destructive font-medium">
            Please upload at least one image
          </span>
        )}
      </div>
    </div>
  );
};

export { ImageUpload };
