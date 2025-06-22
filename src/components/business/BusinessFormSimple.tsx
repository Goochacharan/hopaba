
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
  id?: string;
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
  tags?: string[];
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  experience?: string;
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  languages?: string[];
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  approval_status?: string;
  availability?: string;
  hours?: string;
}

// Updated schema with more flexible validation
const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.array(z.string()).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  city: z.string().min(2, 'Please enter a valid city'),
  area: z.string().min(2, 'Please enter a valid area'),
  postal_code: z.string().min(5, 'Please enter a valid postal code').max(10),
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
  availability_start_time: z.string().optional(),
  availability_end_time: z.string().optional(),
  languages: z.array(z.string()).optional(),
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
    contact_phone: business?.contact_phone || '+91',
    whatsapp: business?.whatsapp || '+91',
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
    availability_start_time: business?.availability_start_time || '9:00 AM',
    availability_end_time: business?.availability_end_time || '5:00 PM',
    languages: business?.languages || [],
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
    let value = e.target.value;
    
    // Ensure the value starts with +91
    if (!value.startsWith('+91')) {
      value = '+91' + value.replace('+91', '');
    }
    
    // Extract only the digits after +91
    const digits = value.slice(3).replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Set the final value
    const finalValue = '+91' + limitedDigits;
    e.target.value = finalValue;
    
    form.setValue(fieldName, finalValue, { shouldValidate: true });
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const newDays = checked 
      ? [...selectedDays, day]
      : selectedDays.filter(d => d !== day);
    
    setSelectedDays(newDays);
    form.setValue('availability_days', newDays, { shouldValidate: true });
  };

  const onSubmit = async (data: BusinessFormValues) => {
    console.log('=== BUSINESS FORM SUBMISSION STARTED ===');
    console.log('Form data received:', data);
    
    if (!user) {
      console.error('No user authenticated');
      toast({
        title: "Authentication required",
        description: "Please log in to save your business",
        variant: "destructive"
      });
      return;
    }

    console.log('User authenticated:', user.id);
    
    // Validate tags requirement
    if (!data.tags || data.tags.length < 3) {
      console.error('Insufficient tags:', data.tags?.length || 0);
      toast({
        title: "Tags required",
        description: "Please add at least 3 tags describing your services",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Preparing business data for database...');
      
      const businessData = {
        name: data.name.trim(),
        category: data.category,
        subcategory: data.subcategory || [],
        description: data.description.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        area: data.area.trim(),
        postal_code: data.postal_code.trim(),
        contact_phone: data.contact_phone,
        whatsapp: data.whatsapp,
        contact_email: data.contact_email?.trim() || null,
        website: data.website?.trim() || null,
        instagram: data.instagram?.trim() || null,
        images: data.images || [],
        tags: data.tags || [],
        price_range_min: data.price_range_min || null,
        price_range_max: data.price_range_max || null,
        price_unit: data.price_unit?.trim() || 'per hour',
        experience: data.experience?.trim() || null,
        availability_days: selectedDays,
        availability_start_time: data.availability_start_time || '9:00 AM',
        availability_end_time: data.availability_end_time || '5:00 PM',
        languages: data.languages || [],
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        user_id: user.id,
        approval_status: 'pending'
      };

      console.log('Final business data for database:', businessData);

      let result;
      if (business?.id) {
        console.log('Updating existing business with ID:', business.id);
        result = await supabase
          .from('service_providers')
          .update(businessData)
          .eq('id', business.id)
          .eq('user_id', user.id)
          .select();
      } else {
        console.log('Creating new business...');
        result = await supabase
          .from('service_providers')
          .insert([businessData])
          .select();
      }

      console.log('Database operation result:', result);

      if (result.error) {
        console.error('Database error details:', result.error);
        
        // Provide more specific error messages
        if (result.error.message.includes('duplicate')) {
          throw new Error('A business with this name already exists');
        } else if (result.error.message.includes('constraint')) {
          throw new Error('Please check all required fields are filled correctly');
        } else {
          throw new Error(`Database error: ${result.error.message}`);
        }
      }

      if (!result.data || result.data.length === 0) {
        console.error('No data returned from database operation');
        throw new Error('No data returned from database');
      }

      console.log('Business saved successfully:', result.data[0]);
      
      toast({
        title: "Success!",
        description: business?.id ? "Business updated successfully" : "Business created successfully and submitted for approval",
      });
      
      onSaved();
    } catch (error: any) {
      console.error('=== BUSINESS FORM SUBMISSION ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to save business. Please check all required fields and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      console.log('=== BUSINESS FORM SUBMISSION ENDED ===');
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
        <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Add a new category for businesses
              </DialogDescription>
            </DialogHeader>
            <AddCategoryDialog />
          </DialogContent>
        </Dialog>
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
