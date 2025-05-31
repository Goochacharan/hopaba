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
import { sanitizeText, sanitizeEmail, sanitizePhoneNumber, sanitizeUrl } from '@/utils/inputSanitization';
import { validateEmail, validatePhoneNumber, validatePostalCode, validateUrl } from '@/utils/securityValidation';

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
      // Sanitize all input data
      const sanitizedData = {
        ...data,
        name: sanitizeText(data.name),
        description: sanitizeText(data.description),
        area: sanitizeText(data.area),
        city: sanitizeText(data.city),
        address: sanitizeText(data.address),
        contact_email: data.contact_email ? sanitizeEmail(data.contact_email) : null,
        website: data.website ? sanitizeUrl(data.website) : null,
        instagram: data.instagram ? sanitizeText(data.instagram) : null,
        map_link: data.map_link ? sanitizeUrl(data.map_link) : null,
        experience: data.experience ? sanitizeText(data.experience) : null,
        tags: data.tags?.map(tag => sanitizeText(tag)) || [],
      };

      // Additional validation
      if (sanitizedData.contact_email && !validateEmail(sanitizedData.contact_email)) {
        throw new Error("Invalid email format");
      }

      if (!validatePhoneNumber(sanitizedData.contact_phone)) {
        throw new Error("Invalid phone number format");
      }

      if (!validatePhoneNumber(sanitizedData.whatsapp)) {
        throw new Error("Invalid WhatsApp number format");
      }

      if (!validatePostalCode(sanitizedData.postal_code)) {
        throw new Error("Invalid postal code format");
      }

      if (sanitizedData.website && !validateUrl(sanitizedData.website)) {
        throw new Error("Invalid website URL format");
      }

      if (sanitizedData.map_link && !validateUrl(sanitizedData.map_link)) {
        throw new Error("Invalid map link URL format");
      }

      const priceRangeMin = sanitizedData.price_range_min ? Number(sanitizedData.price_range_min) : undefined;
      const priceRangeMax = sanitizedData.price_range_max ? Number(sanitizedData.price_range_max) : undefined;
      
      const businessData = {
        name: sanitizedData.name,
        category: sanitizedData.category,
        subcategory: sanitizedData.subcategory || [],
        description: sanitizedData.description,
        area: sanitizedData.area,
        city: sanitizedData.city,
        address: sanitizedData.address,
        postal_code: sanitizedData.postal_code,
        contact_phone: sanitizedData.contact_phone,
        whatsapp: sanitizedData.whatsapp,
        contact_email: sanitizedData.contact_email,
        website: sanitizedData.website,
        instagram: sanitizedData.instagram,
        map_link: sanitizedData.map_link,
        user_id: user.id,
        approval_status: 'pending',
        price_unit: sanitizedData.price_unit || "per hour",
        price_range_min: priceRangeMin,
        price_range_max: priceRangeMax,
        availability: sanitizedData.availability,
        languages: sanitizedData.languages || [],
        experience: sanitizedData.experience,
        tags: sanitizedData.tags || [],
        images: sanitizedData.images || [],
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
      if (sanitizedData.language_ids && sanitizedData.language_ids.length > 0 && businessId) {
        console.log("Processing language selections for business:", businessId);
        console.log("Selected language IDs:", sanitizedData.language_ids);
        
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
        const languageInserts = sanitizedData.language_ids.map(languageId => ({
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
