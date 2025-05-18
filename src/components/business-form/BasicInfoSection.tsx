
import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagsInput } from '@/components/ui/tags-input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessFormValues } from '../AddBusinessForm';
import { Tag, ListFilter } from 'lucide-react';
import { useCategories, useSubcategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

interface BasicInfoSectionProps {
  maxImages?: number;
}

export default function BasicInfoSection({ maxImages = 10 }: BasicInfoSectionProps) {
  const { control, setValue, getValues, watch } = useFormContext<BusinessFormValues>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Watch for category changes
  const selectedCategory = watch('category');
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  
  // Fetch subcategories based on selected category
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(selectedCategoryId);
  
  // Find category ID when category name changes
  useEffect(() => {
    if (categories && selectedCategory) {
      const category = categories.find(cat => cat.name === selectedCategory);
      if (category) {
        setSelectedCategoryId(category.id);
      }
    }
  }, [selectedCategory, categories]);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Basic Information</h3>
      
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Name*</FormLabel>
            <FormControl>
              <Input placeholder="Your business name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category*</FormLabel>
            {categoriesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset subcategory when category changes
                  setValue('subcategory', '');
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="subcategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" /> 
              Subcategory*
            </FormLabel>
            {subcategoriesLoading || !selectedCategoryId ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedCategoryId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCategoryId ? "Select category first" : "Select subcategory"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subcategories?.map(subcategory => (
                    <SelectItem key={subcategory.id} value={subcategory.name}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description*</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe your business or service" className="min-h-[120px]" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" /> 
                Tags* (at least 3)
              </div>
            </FormLabel>
            <FormControl>
              <TagsInput
                placeholder="Type and press enter to add tags"
                tags={field.value || []}
                setTags={(tags) => setValue('tags', tags)}
              />
            </FormControl>
            <FormDescription>
              Keywords that describe your services or products
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Photos</FormLabel>
            <FormControl>
              <ImageUpload
                images={field.value || []}
                onImagesChange={(images) => setValue('images', images, { shouldValidate: true })}
                maxImages={maxImages}
              />
            </FormControl>
            <FormDescription>
              Upload up to {maxImages} photos of your business or service
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
