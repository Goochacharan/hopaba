
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from './types';

interface ImageUploadSectionProps {
  form: UseFormReturn<EventFormValues>;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="images"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Event Images *</FormLabel>
          <FormControl>
            <ImageUpload 
              images={field.value} 
              onImagesChange={(images) => field.onChange(images)}
              maxImages={5}
            />
          </FormControl>
          <FormDescription>Upload up to 5 images for your event</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
