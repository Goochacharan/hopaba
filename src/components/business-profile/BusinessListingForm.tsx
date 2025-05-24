import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagsInput } from "../ui/tags-input";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { extractCoordinatesFromMapLink } from '@/lib/locationUtils';

export interface BusinessData {
  id?: string;
  name: string;
  category: string;
  description: string;
  area: string;
  city: string;
  address: string;
  postal_code: string;
  contact_phone: string;
  whatsapp: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  map_link?: string;
  tags?: string[];
  languages?: string[];
  experience?: string;
  availability?: string;
  price_unit?: string;
  price_range_min?: number;
  price_range_max?: number;
  approval_status?: string;
  images?: string[];
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  hours?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

const businessSchema = z.object({
  name: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  area: z.string().min(2, { message: "Area must be at least 2 characters." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  postal_code: z.string().regex(/^\d{6}$/, { message: "Postal code must be 6 digits" }),
  contact_phone: z.string()
    .refine(phone => phone.startsWith('+91'), { message: "Phone number must start with +91." })
    .refine(phone => phone.slice(3).replace(/\D/g, '').length === 10, { message: "Please enter a 10-digit phone number (excluding +91)." }),
  whatsapp: z.string()
    .refine(phone => phone.startsWith('+91'), { message: "WhatsApp number must start with +91." })
    .refine(phone => phone.slice(3).replace(/\D/g, '').length === 10, { message: "Please enter a 10-digit WhatsApp number (excluding +91)." }),
  contact_email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  instagram: z.string().optional(),
  map_link: z.string().optional(),
  price_unit: z.string().optional(),
  price_range_min: z.number().optional(),
  price_range_max: z.number().optional(),
  availability: z.string().optional(),
  languages: z.array(z.string()).optional(),
  experience: z.string().optional(),
  tags: z.array(z.string()).min(3, { message: "Please add at least 3 tags describing your services or items." }).optional(),
  images: z.array(z.string()).optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

const SERVICE_CATEGORIES = [
  "Education", "Healthcare", "Food & Dining", "Home Services", "Beauty & Wellness",
  "Professional Services", "Auto Services", "Technology", "Financial Services",
  "Entertainment", "Travel & Transport", "Fitness", "Real Estate", "Retail", "Other"
];

interface BusinessListingFormProps {
  business?: BusinessData;
  onSaved: () => void;
  onCancel: () => void;
}

const BusinessListingForm: React.FC<BusinessListingFormProps> = ({ business, onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [businessImages, setBusinessImages] = useState<string[]>(business?.images || []);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: business?.name || "",
      category: business?.category || "",
      description: business?.description || "",
      area: business?.area || "",
      city: business?.city || "",
      address: business?.address || "",
      postal_code: business?.postal_code || "",
      contact_phone: business?.contact_phone || "+91",
      whatsapp: business?.whatsapp || "+91",
      contact_email: business?.contact_email || "",
      website: business?.website || "",
      instagram: business?.instagram || "",
      map_link: business?.map_link || "",
      tags: business?.tags || [],
      languages: business?.languages || [],
      experience: business?.experience || "",
      availability: business?.availability || "",
      price_unit: business?.price_unit || "per hour",
      price_range_min: business?.price_range_min,
      price_range_max: business?.price_range_max,
      images: business?.images || [],
    },
  });

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => {
    let value = e.target.value;
    
    if (!value.startsWith('+91')) {
      value = '+91' + value.replace('+91', '');
    }
    
    const digits = value.slice(3).replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);
    
    form.setValue(fieldName, '+91' + limitedDigits, { shouldValidate: true });
  };

  const handleAddTag = () => {
    if (tagInput.trim().length === 0) return;
    
    const currentTags = form.getValues('tags') || [];
    
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue('tags', [...currentTags, tagInput.trim()]);
    }
    
    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (data: BusinessFormValues) => {
    console.log("Form submitted with data:", data);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to list your business.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const priceRangeMin = data.price_range_min ? Number(data.price_range_min) : undefined;
      const priceRangeMax = data.price_range_max ? Number(data.price_range_max) : undefined;
      
      const coordinates = extractCoordinatesFromMapLink(data.map_link || null);
      
      const businessData = {
        name: data.name,
        category: data.category,
        description: data.description,
        area: data.area,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code,
        contact_phone: data.contact_phone,
        whatsapp: data.whatsapp,
        contact_email: data.contact_email || null,
        website: data.website || null,
        instagram: data.instagram || null,
        map_link: data.map_link || null,
        user_id: user.id,
        approval_status: 'pending',
        price_unit: data.price_unit || "per hour",
        price_range_min: priceRangeMin,
        price_range_max: priceRangeMax,
        availability: data.availability || null,
        languages: data.languages || [],
        experience: data.experience || null,
        tags: data.tags || [],
        images: data.images,
        latitude: coordinates ? coordinates.lat : null,
        longitude: coordinates ? coordinates.lng : null,
      };

      console.log("Formatted business data for Supabase:", businessData);

      let result;
      
      if (business?.id) {
        console.log("Updating business with ID:", business.id);
        result = await supabase
          .from('service_providers')
          .update(businessData)
          .eq('id', business.id);

        if (result.error) {
          console.error("Supabase update error:", result.error);
          throw new Error(result.error.message);
        }

        console.log("Business updated successfully");
        toast({
          title: "Business Updated",
          description: "Your business listing has been updated and will be reviewed by an admin.",
        });
      } else {
        console.log("Creating new business");
        result = await supabase
          .from('service_providers')
          .insert([businessData]);

        if (result.error) {
          console.error("Supabase insert error:", result.error);
          throw new Error(result.error.message);
        }

        console.log("Business created successfully", result);
        toast({
          title: "Business Added",
          description: "Your business has been listed and will be reviewed by an admin.",
        });
      }

      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error('Error saving business:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your business. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
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
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags* (minimum 3)</FormLabel>
                    <FormDescription>
                      Keywords that describe your services or items
                    </FormDescription>
                    <FormControl>
                      <TagsInput
                        placeholder="Type and press enter"
                        tags={field.value || []}
                        setTags={(newTags) => form.setValue('tags', newTags)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Location Information</h3>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area/Neighborhood*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter neighborhood or area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 6-digit postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="map_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps Link</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste your Google Maps link here" {...field} />
                    </FormControl>
                    <FormDescription>
                      This link will be used for directions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium">Contact Information</h3>
              
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter phone number" 
                        value={field.value} 
                        onChange={(e) => {
                          field.onChange(e);
                          handlePhoneInput(e, 'contact_phone');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter WhatsApp number" 
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          handlePhoneInput(e, 'whatsapp');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Pricing Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_range_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price_range_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="price_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a price unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per hour">Per Hour</SelectItem>
                        <SelectItem value="per day">Per Day</SelectItem>
                        <SelectItem value="per session">Per Session</SelectItem>
                        <SelectItem value="per month">Per Month</SelectItem>
                        <SelectItem value="fixed price">Fixed Price</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Additional Information</h3>
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter website URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram / Social Media</FormLabel>
                    <FormControl>
                      <Input placeholder="@yourusername or full URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Weekdays 9AM-5PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages</FormLabel>
                    <FormControl>
                      <TagsInput
                        placeholder="Add languages you speak"
                        tags={field.value || []}
                        setTags={(newTags) => form.setValue('languages', newTags)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Images</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      images={field.value || []} 
                      onImagesChange={(images) => form.setValue('images', images, { shouldValidate: true })}
                      maxImages={10}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload up to 10 images of your business (previously limited to 5)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : business?.id ? "Update Business" : "Submit Business"}
            </Button>
          </div>
        </form>
      </Form>
      
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success!</AlertDialogTitle>
            <AlertDialogDescription>
              Your business/service has been successfully {business?.id ? "updated" : "added"}. It will now be available for others to discover after admin approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowSuccessDialog(false);
              onSaved();
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BusinessListingForm;
