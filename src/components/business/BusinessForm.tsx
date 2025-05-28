
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import BusinessFormContent from './BusinessFormContent';
import SuccessDialog from '../business-form/SuccessDialog';
import { useCategories, useSubcategories } from '@/hooks/useCategories';

export interface Business {
  id?: string;
  name: string;
  category: string;
  subcategory?: string[];
  description: string;
  area: string;
  city: string;
  address: string;
  website?: string;
  approval_status?: string;
  instagram?: string;
  map_link?: string;
  contact_phone: string;
  whatsapp: string;
  contact_email?: string;
  tags?: string[];
  languages?: string[];
  experience?: string;
  availability?: string;
  price_unit?: string;
  price_range_min?: number;
  price_range_max?: number;
  images?: string[];
  postal_code: string;
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  hours?: string;
  hours_from?: string;
  hours_to?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

const businessSchema = z.object({
  name: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  subcategory: z.array(z.string()).optional().default([]),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  area: z.string().min(2, {
    message: "Area must be at least 2 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  postal_code: z.string().regex(/^\d{6}$/, { 
    message: "Postal code must be 6 digits" 
  }),
  contact_phone: z.string()
    .refine(phone => phone.startsWith('+91'), {
      message: "Phone number must start with +91."
    })
    .refine(phone => phone.slice(3).replace(/\D/g, '').length === 10, {
      message: "Please enter a 10-digit phone number (excluding +91)."
    }),
  whatsapp: z.string()
    .refine(phone => phone.startsWith('+91'), {
      message: "WhatsApp number must start with +91."
    })
    .refine(phone => phone.slice(3).replace(/\D/g, '').length === 10, {
      message: "Please enter a 10-digit WhatsApp number (excluding +91)."
    }),
  contact_email: z.string().email({
    message: "Please enter a valid email address."
  }).optional().or(z.literal('')),
  website: z.string().url({
    message: "Please enter a valid URL."
  }).optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  map_link: z.string().optional().or(z.literal('')),
  price_unit: z.string().optional(),
  price_range_min: z.number().optional(),
  price_range_max: z.number().optional(),
  availability: z.string().optional().or(z.literal('')),
  languages: z.array(z.string()).optional(),
  experience: z.string().optional().or(z.literal('')),
  tags: z.array(z.string())
    .min(3, {
      message: "Please add at least 3 tags describing your services or items."
    })
    .optional(),
  images: z.array(z.string()).optional(),
  hours_from: z.string().optional(),
  hours_to: z.string().optional(),
  availability_days: z.array(z.string()).optional(),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

interface BusinessFormProps {
  business?: Business;
  onSaved: () => void;
  onCancel?: () => void;
}

let CATEGORIES = [
  "Actor/Actress",
  "Auto Services",
  "Bakery & Chats",
  "Beauty & Wellness",
  "Choreographer",
  "Education",
  "Electrician",
  "Entertainment",
  "Event Planning",
  "Fashion Designer",
  "Financial Services",
  "Fitness",
  "Food & Dining",
  "Graphic Designer",
  "Hair Salons",
  "Healthcare",
  "Home Services",
  "Ice Cream Shop",
  "Laser Hair Removal",
  "Massage Therapy",
  "Medical Spas",
  "Model",
  "Musician",
  "Nail Technicians",
  "Painter",
  "Photographer",
  "Plumber",
  "Professional Services",
  "Real Estate",
  "Retail",
  "Skin Care",
  "Technology",
  "Travel Agents",
  "Vacation Rentals",
  "Videographers",
  "Weight Loss Centers",
  "Writer",
  "Other"
].sort();

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(business?.availability_days || []);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Fetch categories from database
  const { data: dbCategories, isLoading: loadingCategories } = useCategories();
  
  // Fetch subcategories based on selected category
  const { data: subcategories, isLoading: loadingSubcategories } = useSubcategories(selectedCategoryId);

  useEffect(() => {
    const savedCategories = localStorage.getItem('customCategories');
    let customCategories: string[] = [];
    
    if (savedCategories) {
      try {
        customCategories = JSON.parse(savedCategories);
      } catch (error) {
        console.error('Error parsing custom categories:', error);
      }
    }
    
    const allCategories = [...CATEGORIES, ...customCategories];
    const uniqueCategories = Array.from(new Set(allCategories)).sort();
    
    setCategories(uniqueCategories);
  }, []);

  const parseHours = () => {
    if (business?.hours) {
      const hoursMatch = business.hours.match(/(\d+:\d+ [AP]M)\s*-\s*(\d+:\d+ [AP]M)/);
      if (hoursMatch) {
        return {
          from: hoursMatch[1],
          to: hoursMatch[2]
        };
      }
    }
    return { from: "9:00 AM", to: "5:00 PM" };
  };

  const { from: defaultHoursFrom, to: defaultHoursTo } = parseHours();

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: business?.name || "",
      category: business?.category || "",
      subcategory: business?.subcategory || [],
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
      hours_from: defaultHoursFrom,
      hours_to: defaultHoursTo,
      availability_days: business?.availability_days || [],
    },
  });

  // Watch the category field to update the category ID when it changes
  const selectedCategory = form.watch("category");
  
  useEffect(() => {
    if (selectedCategory && dbCategories?.length) {
      const categoryMatch = dbCategories.find(cat => cat.name === selectedCategory);
      if (categoryMatch) {
        setSelectedCategoryId(categoryMatch.id);
        // Reset subcategory when category changes
        form.setValue("subcategory", []);
      } else {
        setSelectedCategoryId(null);
      }
    }
  }, [selectedCategory, dbCategories, form]);

  useEffect(() => {
    if (business?.availability_days && business.availability_days.length > 0) {
      setSelectedDays(business.availability_days);
      form.setValue("availability_days", business.availability_days);
    }
  }, [business, form]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => {
    let value = e.target.value;
    
    if (!value.startsWith('+91')) {
      value = '+91' + value.replace('+91', '');
    }
    
    const digits = value.slice(3).replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);
    
    form.setValue(fieldName, '+91' + limitedDigits, { shouldValidate: true });
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    let updatedDays = [...selectedDays];
    
    if (checked) {
      if (!updatedDays.includes(day)) {
        updatedDays.push(day);
      }
    } else {
      updatedDays = updatedDays.filter(d => d !== day);
    }
    
    setSelectedDays(updatedDays);
    form.setValue("availability_days", updatedDays, { shouldValidate: true });
    form.setValue("availability", updatedDays.join(', '), { shouldValidate: true });
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

    if (!data.tags || data.tags.length < 3) {
      toast({
        title: "Tags required",
        description: "Please add at least 3 tags describing your services or items.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const priceRangeMin = data.price_range_min ? Number(data.price_range_min) : undefined;
      const priceRangeMax = data.price_range_max ? Number(data.price_range_max) : undefined;
      
      const hours = `${data.hours_from} - ${data.hours_to}`;
      const availabilityDays = selectedDays;
      const availabilityString = availabilityDays.join(', ');
      
      const subcategoryArray = Array.isArray(data.subcategory) ? data.subcategory : 
                              (data.subcategory ? [data.subcategory] : []);
      
      const businessData = {
        name: data.name,
        category: data.category,
        subcategory: subcategoryArray,
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
        tags: data.tags || [],
        experience: data.experience || null,
        availability: availabilityString || null,
        hours: hours,
        availability_start_time: data.hours_from || null,
        availability_end_time: data.hours_to || null,
        availability_days: availabilityDays,
        images: data.images || [],
        languages: data.languages || [],
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
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <BusinessFormContent 
            form={form}
            handlePhoneInput={handlePhoneInput}
            handleDayToggle={handleDayToggle}
            selectedDays={selectedDays}
            loadingCategories={loadingCategories}
            dbCategories={dbCategories}
            categories={categories}
            isAdmin={isAdmin}
            setShowAddCategoryDialog={setShowAddCategoryDialog}
            selectedCategoryId={selectedCategoryId}
            loadingSubcategories={loadingSubcategories}
            subcategories={subcategories}
            setShowAddSubcategoryDialog={setShowAddSubcategoryDialog}
            isSubmitting={isSubmitting}
            business={business}
            onCancel={onCancel}
          />
        </form>
        
        <SuccessDialog 
          open={showSuccessDialog} 
          onOpenChange={(open) => {
            setShowSuccessDialog(open);
            if (!open) onSaved();
          }} 
        />
      </Form>
    </FormProvider>
  );
};

export default BusinessForm;
