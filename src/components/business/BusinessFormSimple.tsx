import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useAdmin } from '@/hooks/useAdmin';
import BusinessFormContent from './BusinessFormContent';
import AddCategoryDialog from '@/components/admin/CategoryManager';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string[];
  description: string;
  address: string;
  city: string;
  area: string;
  postal_code: string;
  contact_phone: string;
  whatsapp: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  images?: string[];
  tags: string[];
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  experience?: string;
  availability_days?: string[];
  hours_from?: string;
  hours_to?: string;
  languages?: string[];
  map_link?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

// Updated schema to include latitude and longitude
const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.array(z.string()).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'Please enter a valid city'),
  area: z.string().min(2, 'Please enter a valid area'),
  postal_code: z.string().min(6, 'Please enter a valid 6-digit postal code').max(6),
  contact_phone: z.string().min(10, 'Please enter a valid phone number'),
  whatsapp: z.string().min(10, 'Please enter a valid WhatsApp number'),
  contact_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).min(3, 'Please add at least 3 tags describing your services'),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  price_unit: z.string().optional(),
  experience: z.string().optional(),
  availability_days: z.array(z.string()).optional(),
  hours_from: z.string().optional(),
  hours_to: z.string().optional(),
  languages: z.array(z.string()).optional(),
  map_link: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>;

interface BusinessFormSimpleProps {
  business?: Business;
  onSaved: () => void;
  onCancel: () => void;
}

const BusinessFormSimple: React.FC<BusinessFormSimpleProps> = ({
  business,
  onSaved,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { data: dbCategories, isLoading: loadingCategories } = useCategories();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const defaultValues: Partial<BusinessFormValues> = {
    name: business?.name || '',
    category: business?.category || '',
    subcategory: business?.subcategory || [],
    description: business?.description || '',
    address: business?.address || '',
    city: business?.city || '',
    area: business?.area || '',
    postal_code: business?.postal_code || '',
    contact_phone: business?.contact_phone || '',
    whatsapp: business?.whatsapp || '',
    contact_email: business?.contact_email || '',
    website: business?.website || '',
    instagram: business?.instagram || '',
    images: business?.images || [],
    tags: business?.tags || [],
    price_range_min: business?.price_range_min,
    price_range_max: business?.price_range_max,
    price_unit: business?.price_unit || '',
    experience: business?.experience || '',
    availability_days: business?.availability_days || [],
    hours_from: business?.hours_from || '9:00 AM',
    hours_to: business?.hours_to || '5:00 PM',
    languages: business?.languages || [],
    map_link: business?.map_link || '',
    latitude: business?.latitude,
    longitude: business?.longitude,
  };

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (business?.availability_days) {
      setSelectedDays(business.availability_days);
    }
  }, [business]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category') {
        const selectedCategory = dbCategories?.find(cat => cat.name === value.category);
        setSelectedCategoryId(selectedCategory?.id || null);
        form.setValue('subcategory', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, dbCategories]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      form.setValue(fieldName, value, { shouldValidate: true });
    }
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const newDays = checked 
      ? [...selectedDays, day]
      : selectedDays.filter(d => d !== day);
    
    setSelectedDays(newDays);
    form.setValue('availability_days', newDays, { shouldValidate: true });
  };

  const onSubmit = async (data: BusinessFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your business",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const businessData = {
        ...data,
        user_id: user.id,
        availability_days: selectedDays,
        // Include the latitude and longitude in the submission
        latitude: data.latitude,
        longitude: data.longitude,
      };

      let result;
      if (business?.id) {
        result = await supabase
          .from('service_providers')
          .update(businessData)
          .eq('id', business.id)
          .eq('user_id', user.id);
      } else {
        result = await supabase
          .from('service_providers')
          .insert([businessData]);
      }

      if (result.error) {
        throw result.error;
      }

      onSaved();
    } catch (error) {
      console.error('Error saving business:', error);
      toast({
        title: "Error",
        description: "Failed to save business. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategoryId) return;

    try {
      const { error } = await supabase
        .from('subcategories')
        .insert([{ 
          name: newSubcategoryName.trim(),
          category_id: selectedCategoryId 
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory added successfully"
      });
      
      setNewSubcategoryName('');
      setShowAddSubcategoryDialog(false);
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({
        title: "Error", 
        description: "Failed to add subcategory",
        variant: "destructive"
      });
    }
  };

  const categories = dbCategories?.map(cat => cat.name) || [];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          setShowAddSubcategoryDialog={setShowAddSubcategoryDialog}
          isSubmitting={isSubmitting}
          business={business}
        />

        <div className="flex gap-4 pt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
      
      {isAdmin && (
        <AddCategoryDialog 
          open={showAddCategoryDialog}
          onOpenChange={setShowAddCategoryDialog}
        />
      )}

      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcategory</DialogTitle>
            <DialogDescription>
              Add a new subcategory to the selected category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcategory-name">Subcategory Name</Label>
              <Input
                id="subcategory-name"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                placeholder="Enter subcategory name"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddSubcategory} disabled={!newSubcategoryName.trim()}>
                Add Subcategory
              </Button>
              <Button variant="outline" onClick={() => setShowAddSubcategoryDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

export default BusinessFormSimple;
