
import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCategories, useSubcategories } from '@/hooks/useCategories';

interface BasicInfoSectionProps {
  maxImages?: number;
}

const BasicInfoSection = ({ maxImages = 5 }: BasicInfoSectionProps) => {
  const { control, watch, setValue } = useFormContext();
  const [tagInput, setTagInput] = useState('');
  const tags = watch('tags') || [];
  const category = watch('category');
  
  const { data: categories } = useCategories();
  const { data: subcategories } = useSubcategories(
    categories?.find(cat => cat.name === category)?.id
  );
  
  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setValue('tags', tags.filter((_: string, i: number) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Clear subcategory when category changes
  useEffect(() => {
    setValue('subcategory', '');
  }, [category, setValue]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Name*</FormLabel>
            <FormControl>
              <Input placeholder="Enter business name" {...field} />
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
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
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
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="subcategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subcategory</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
              disabled={!category || !subcategories?.length}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={category ? "Select subcategory" : "Select a category first"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {subcategories?.map(subcategory => (
                  <SelectItem key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Textarea 
                placeholder="Describe your business, services offered, and any other important information"
                className="min-h-[120px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>Tags (at least 3)*</FormLabel>
        <div className="flex mt-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tags (press Enter)"
            className="mr-2"
          />
          <Button type="button" onClick={handleAddTag}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="px-2 py-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 text-muted-foreground"
                onClick={() => handleRemoveTag(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
        {tags.length < 3 && (
          <p className="text-sm text-amber-600 mt-2">Please add at least 3 tags to describe your business</p>
        )}
      </div>
      
      <FormField
        control={control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Images*</FormLabel>
            <FormControl>
              <ImageUpload
                images={field.value || []}
                onImagesChange={field.onChange}
                maxImages={maxImages}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default BasicInfoSection;
