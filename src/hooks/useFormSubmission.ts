
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BusinessFormValues, Business } from '@/components/business/BusinessForm';
import { validateTags } from '@/utils/businessFormUtils';

export const useFormSubmission = (business?: Business, onSaved?: () => void) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleSubmit = async (data: BusinessFormValues, selectedDays: string[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to list your business.",
        variant: "destructive",
      });
      return;
    }

    if (!validateTags(data.tags || [])) {
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
      const availabilityString = selectedDays.join(', ');
      
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
        availability_days: selectedDays,
        images: data.images || [],
        languages: data.languages || [],
      };

      let result;
      
      if (business?.id) {
        result = await supabase
          .from('service_providers')
          .update(businessData)
          .eq('id', business.id);

        if (result.error) {
          throw new Error(`Update failed: ${result.error.message}`);
        }

        toast({
          title: "Business Updated",
          description: "Your business listing has been updated and will be reviewed by an admin.",
        });
      } else {
        result = await supabase
          .from('service_providers')
          .insert([businessData]);

        if (result.error) {
          throw new Error(`Creation failed: ${result.error.message}`);
        }

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

  const handleSuccessDialogClose = (open: boolean) => {
    setShowSuccessDialog(open);
    if (!open && onSaved) {
      onSaved();
    }
  };

  return {
    isSubmitting,
    showSuccessDialog,
    handleSubmit,
    handleSuccessDialogClose
  };
};
