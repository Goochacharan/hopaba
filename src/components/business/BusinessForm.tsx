import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from "@/components/ui/form";
import { useAdmin } from '@/hooks/useAdmin';
import BusinessFormContent from './BusinessFormContent';
import SuccessDialog from '../business-form/SuccessDialog';
import { useBusinessFormLogic } from '@/hooks/useBusinessFormLogic';
import { useCategoryManagement } from '@/hooks/useCategoryManagement';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { formatPhoneInput } from '@/utils/businessFormUtils';

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

export const businessSchema = z.object({
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

const BusinessForm: React.FC<BusinessFormProps> = ({ business, onSaved, onCancel }) => {
  const { isAdmin } = useAdmin();
  
  // Use the new hooks for consistency and performance
  const {
    form,
    selectedDays,
    selectedCategoryId,
    setSelectedCategoryId,
    handleDayToggle
  } = useBusinessFormLogic(business);

  const {
    categories,
    dbCategories,
    loadingCategories,
    subcategories,
    loadingSubcategories,
    showAddCategoryDialog,
    setShowAddCategoryDialog,
    showAddSubcategoryDialog,
    setShowAddSubcategoryDialog
  } = useCategoryManagement();

  const {
    isSubmitting,
    showSuccessDialog,
    handleSubmit,
    handleSuccessDialogClose
  } = useFormSubmission(business, onSaved);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => {
    const formattedValue = formatPhoneInput(e.target.value);
    form.setValue(fieldName, formattedValue, { shouldValidate: true });
  };

  const onSubmit = (data: BusinessFormValues) => {
    handleSubmit(data, selectedDays);
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
          onOpenChange={handleSuccessDialogClose} 
        />
      </Form>
    </FormProvider>
  );
};

export default BusinessForm;
