import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BusinessFormContent from './BusinessFormContent';
import SuccessDialog from '../business-form/SuccessDialog';

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
  }).optional(),
  website: z.string().url({
    message: "Please enter a valid URL."
  }).optional().or(z.literal('')),
  instagram: z.string().optional(),
  map_link: z.string().optional(),
  price_unit: z.string().optional(),
  price_range_min: z.number().optional(),
  price_range_max: z.number().optional(),
  availability: z.string().optional(),
  languages: z.array(z.string()).optional(),
  language_ids: z.array(z.string()).min(1, {
    message: "Please select at least one language you can communicate in."
  }).optional(),
  experience: z.string().optional(),
  tags: z.array(z.string())
    .min(3, {
      message: "Please add at least 3 tags describing your services or items."
    })
    .optional(),
  images: z.array(z.string()).optional(),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

interface BusinessFormProps {
  business?: Business;
  onSaved: () => void;
  onCancel?: () => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      language_ids: [],
      experience: business?.experience || "",
      availability: business?.availability || "",
      price_unit: business?.price_unit || "per hour",
      price_range_min: business?.price_range_min,
      price_range_max: business?.price_range_max,
    },
  });

  const handleSubmit = async (data: BusinessFormValues) => {
    console.log("Form submitted with data:", data);
    console.log("Selected language IDs:", data.language_ids);
    
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
      
      const businessData = {
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || [],
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
        images: data.images || [],
      };

      console.log("Formatted business data for Supabase:", businessData);

      let result;
      let businessId = business?.id;
      
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
      } else {
        console.log("Creating new business");
        result = await supabase
          .from('service_providers')
          .insert([businessData])
          .select();

        if (result.error) {
          console.error("Supabase insert error:", result.error);
          throw new Error(result.error.message);
        }

        businessId = result.data[0]?.id;
        console.log("Business created successfully", result);
      }

      // Handle language selections if any languages were selected
      if (data.language_ids && data.language_ids.length > 0 && businessId) {
        console.log("Processing language selections for business:", businessId);
        console.log("Selected language IDs:", data.language_ids);
        
        // First, delete existing language associations for this business
        const { error: deleteError } = await supabase
          .from('business_languages')
          .delete()
          .eq('business_id', businessId);

        if (deleteError) {
          console.error("Error deleting existing languages:", deleteError);
        } else {
          console.log("Successfully deleted existing language associations");
        }

        // Then insert new language associations
        const languageInserts = data.language_ids.map(languageId => ({
          business_id: businessId,
          language_id: languageId
        }));

        console.log("Inserting language associations:", languageInserts);

        const { error: languageError } = await supabase
          .from('business_languages')
          .insert(languageInserts);

        if (languageError) {
          console.error("Error inserting languages:", languageError);
          // Don't throw error for language insert failure - business creation should still succeed
          toast({
            title: "Warning",
            description: "Business saved but there was an issue saving language selections.",
            variant: "destructive",
          });
        } else {
          console.log("Successfully saved language selections");
        }
      } else {
        console.log("No languages selected or business ID missing");
      }

      if (business?.id) {
        toast({
          title: "Business Updated",
          description: "Your business listing has been updated and will be reviewed by an admin.",
        });
      } else {
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
            isSubmitting={isSubmitting} 
            onCancel={onCancel} 
            business={business}
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
