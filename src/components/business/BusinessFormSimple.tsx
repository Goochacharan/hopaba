import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Create a simple MultiSelect component inline since it's missing
const MultiSelect: React.FC<{
  options: string[];
  value?: string[];
  onChange: (values: string[]) => void;
}> = ({ options, value = [], onChange }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(value);

  const handleToggle = (item: string) => {
    const newSelection = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    setSelectedItems(newSelection);
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedItems.map(item => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <X className="w-3 h-3 cursor-pointer" onClick={() => handleToggle(item)} />
          </Badge>
        ))}
      </div>
      <Select onValueChange={handleToggle}>
        <SelectTrigger>
          <SelectValue placeholder="Select options..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const businessSchema = z.object({
  name: z.string().min(2, {
    message: 'Business name must be at least 2 characters.',
  }),
  category: z.string().min(1, {
    message: 'Please select a category.',
  }),
  subcategory: z.array(z.string()).optional(),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  address: z.string().min(5, {
    message: 'Address must be at least 5 characters.',
  }),
  area: z.string().min(3, {
    message: 'Area must be at least 3 characters.',
  }),
  city: z.string().min(3, {
    message: 'City must be at least 3 characters.',
  }),
  postal_code: z.string().min(6, {
    message: 'Postal code must be at least 6 characters.',
  }),
  contact_phone: z.string().min(10, {
    message: 'Contact phone must be at least 10 characters.',
  }),
  contact_email: z.string().email({
    message: 'Invalid email address.',
  }).optional().or(z.literal('')),
  whatsapp: z.string().min(10, {
    message: 'WhatsApp number must be at least 10 characters.',
  }),
  website: z.string().url({
    message: 'Invalid website URL.',
  }).optional().or(z.literal('')),
  instagram: z.string().url({
    message: 'Invalid Instagram URL.',
  }).optional().or(z.literal('')),
  map_link: z.string().url({
    message: 'Invalid Map URL.',
  }).optional().or(z.literal('')),
  price_range_min: z.number().optional(),
  price_range_max: z.number().optional(),
  price_unit: z.string().optional(),
  availability: z.string().optional(),
  availability_days: z.array(z.string()).optional(),
  availability_start_time: z.string().optional(),
  availability_end_time: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  experience: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  approval_status: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hours: z.string().optional(),
  user_id: z.string().optional(),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

export interface Business {
  id?: string;
  name: string;
  category: string;
  subcategory?: string[];
  description: string;
  address: string;
  area: string;
  city: string;
  postal_code: string;
  contact_phone: string;
  contact_email?: string;
  whatsapp: string;
  website?: string;
  instagram?: string;
  map_link?: string;
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  availability?: string;
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  tags?: string[];
  images?: string[];
  languages?: string[];
  experience?: string;
  created_at?: string;
  updated_at?: string;
  approval_status?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  user_id?: string;
}

interface BusinessFormProps {
  onSubmit: (data: Business) => void;
  businessData?: Business | null;
  categories: string[];
  subcategories: { [key: string]: string[] };
  onCancel: () => void;
}

const BusinessFormSimple: React.FC<BusinessFormProps> = ({ onSubmit, businessData, categories, subcategories, onCancel }) => {
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>(businessData?.images || []);
  const [selectedCategory, setSelectedCategory] = useState(businessData?.category || '');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(businessData?.subcategory || []);
  const [isSliderEnabled, setIsSliderEnabled] = useState(businessData?.price_range_min !== undefined && businessData?.price_range_max !== undefined);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: businessData?.name || '',
      category: businessData?.category || '',
      subcategory: businessData?.subcategory || [],
      description: businessData?.description || '',
      address: businessData?.address || '',
      area: businessData?.area || '',
      city: businessData?.city || '',
      postal_code: businessData?.postal_code || '',
      contact_phone: businessData?.contact_phone || '',
      contact_email: businessData?.contact_email || '',
      whatsapp: businessData?.whatsapp || '',
      website: businessData?.website || '',
      instagram: businessData?.instagram || '',
      map_link: businessData?.map_link || '',
      price_range_min: businessData?.price_range_min || 100,
      price_range_max: businessData?.price_range_max || 1000,
      price_unit: businessData?.price_unit || 'INR',
      availability: businessData?.availability || '',
      availability_days: businessData?.availability_days || [],
      availability_start_time: businessData?.availability_start_time || '',
      availability_end_time: businessData?.availability_end_time || '',
      tags: businessData?.tags || [],
      images: businessData?.images || [],
      languages: businessData?.languages || [],
      experience: businessData?.experience || '',
      latitude: businessData?.latitude || 0,
      longitude: businessData?.longitude || 0,
      hours: businessData?.hours || '',
    },
  });

  useEffect(() => {
    if (businessData) {
      setSelectedCategory(businessData.category || '');
      setSelectedSubcategories(businessData.subcategory || []);
      setImagePreviews(businessData.images || []);
      setIsSliderEnabled(businessData.price_range_min !== undefined && businessData.price_range_max !== undefined);
      form.reset(businessData);
    }
  }, [businessData, form]);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    form.setValue('category', value);
    setSelectedSubcategories([]);
    form.setValue('subcategory', []);
  }, [form]);

  const handleSubcategoryChange = useCallback((values: string[]) => {
    setSelectedSubcategories(values);
    form.setValue('subcategory', values);
  }, [form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls: string[] = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          urls.push(reader.result);
          if (urls.length === files.length) {
            setImagePreviews(prev => [...prev, ...urls]);
            form.setValue('images', [...form.getValues('images') || [], ...urls]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prevImages => {
      const updatedImages = prevImages.filter((_, index) => index !== indexToRemove);
      form.setValue('images', updatedImages);
      return updatedImages;
    });
  };

  const onSubmitHandler = (values: BusinessFormValues) => {
    if (isSliderEnabled) {
      values.price_range_min = values.price_range_min || 100;
      values.price_range_max = values.price_range_max || 1000;
    } else {
      values.price_range_min = undefined;
      values.price_range_max = undefined;
    }
    
    // Convert to Business type with required fields
    const businessData: Business = {
      name: values.name || '',
      category: values.category || '',
      description: values.description || '',
      address: values.address || '',
      area: values.area || '',
      city: values.city || '',
      postal_code: values.postal_code || '',
      contact_phone: values.contact_phone || '',
      whatsapp: values.whatsapp || '',
      ...values
    };
    
    onSubmit(businessData);
  };

  const categorySubcategories = selectedCategory ? subcategories[selectedCategory] : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{businessData ? 'Edit Business' : 'Add Business'}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" placeholder="Enter business name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleCategoryChange} defaultValue={selectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
            )}
          </div>
        </div>

        {categorySubcategories && categorySubcategories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Controller
              name="subcategory"
              control={form.control}
              render={({ field }) => (
                <MultiSelect
                  options={categorySubcategories}
                  value={selectedSubcategories}
                  onChange={handleSubcategoryChange}
                />
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Enter business description" {...form.register('description')} />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter address" {...form.register('address')} />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Input id="area" placeholder="Enter area" {...form.register('area')} />
            {form.formState.errors.area && (
              <p className="text-sm text-red-500">{form.formState.errors.area.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Enter city" {...form.register('city')} />
            {form.formState.errors.city && (
              <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input id="postal_code" placeholder="Enter postal code" {...form.register('postal_code')} />
            {form.formState.errors.postal_code && (
              <p className="text-sm text-red-500">{form.formState.errors.postal_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input id="contact_phone" placeholder="Enter contact phone" {...form.register('contact_phone')} />
            {form.formState.errors.contact_phone && (
              <p className="text-sm text-red-500">{form.formState.errors.contact_phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input type="email" id="contact_email" placeholder="Enter contact email" {...form.register('contact_email')} />
            {form.formState.errors.contact_email && (
              <p className="text-sm text-red-500">{form.formState.errors.contact_email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input id="whatsapp" placeholder="Enter WhatsApp number" {...form.register('whatsapp')} />
            {form.formState.errors.whatsapp && (
              <p className="text-sm text-red-500">{form.formState.errors.whatsapp.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input type="url" id="website" placeholder="Enter website URL" {...form.register('website')} />
            {form.formState.errors.website && (
              <p className="text-sm text-red-500">{form.formState.errors.website.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input type="url" id="instagram" placeholder="Enter Instagram URL" {...form.register('instagram')} />
            {form.formState.errors.instagram && (
              <p className="text-sm text-red-500">{form.formState.errors.instagram.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="map_link">Google Map URL</Label>
          <Input type="url" id="map_link" placeholder="Enter Google Map URL" {...form.register('map_link')} />
          {form.formState.errors.map_link && (
            <p className="text-sm text-red-500">{form.formState.errors.map_link.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="price-slider" checked={isSliderEnabled} onCheckedChange={(checked) => {
            setIsSliderEnabled(checked);
            if (!checked) {
              form.setValue('price_range_min', undefined);
              form.setValue('price_range_max', undefined);
            } else {
              form.setValue('price_range_min', 100);
              form.setValue('price_range_max', 1000);
            }
          }} />
          <Label htmlFor="price-slider">Enable Price Range</Label>
        </div>

        {isSliderEnabled && (
          <div className="space-y-2">
            <Label>Price Range (INR)</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={form.getValues('price_range_min')?.toString() || '100'}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  form.setValue('price_range_min', value);
                }}
                className="w-24"
              />
              <span>-</span>
              <Input
                type="number"
                value={form.getValues('price_range_max')?.toString() || '1000'}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  form.setValue('price_range_max', value);
                }}
                className="w-24"
              />
            </div>
            <Slider
              defaultValue={[form.getValues('price_range_min') || 100, form.getValues('price_range_max') || 1000]}
              min={100}
              max={1000}
              step={10}
              onValueChange={(value) => {
                form.setValue('price_range_min', value[0]);
                form.setValue('price_range_max', value[1]);
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Input id="availability" placeholder="Enter availability details" {...form.register('availability')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input id="hours" placeholder="Enter opening hours" {...form.register('hours')} />
        </div>

        <div className="space-y-2">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("2023-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (Services/Items)</Label>
          <Controller
            name="tags"
            control={form.control}
            render={({ field }) => (
              <MultiSelect
                options={['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4']}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="images">Images</Label>
          <Input type="file" id="images" multiple onChange={handleImageChange} />
          <div className="flex flex-wrap gap-2 mt-2">
            {imagePreviews.map((image, index) => (
              <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden">
                <img src={image} alt={`Image ${index + 1}`} className="object-cover w-full h-full" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 rounded-full shadow-md hover:bg-destructive/20"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="languages">Languages Spoken</Label>
          <Controller
            name="languages"
            control={form.control}
            render={({ field }) => (
              <MultiSelect
                options={['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu']}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Textarea id="experience" placeholder="Enter experience details" {...form.register('experience')} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" onClick={form.handleSubmit(onSubmitHandler)}>
          {businessData ? 'Update' : 'Submit'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BusinessFormSimple;
