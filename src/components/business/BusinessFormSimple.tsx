import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Form } from '@/components/ui/form';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import BusinessFormContent from './BusinessFormContent';
import { useCategories, useSubcategories } from '@/hooks/useCategories';

export interface BusinessFormValues {
  name: string;
  category: string;
  subcategory: string[];
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
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  map_link?: string;
  tags?: string[];
  experience?: string;
  availability?: string;
  hours?: string;
  hours_from?: string;
  hours_to?: string;
  availability_days?: string[];
  images?: string[];
}

export interface Business {
  id?: string;
  name: string;
  category: string;
  subcategory?: string[];
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
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  map_link?: string;
  tags?: string[];
  experience?: string;
  availability?: string;
  hours?: string;
  hours_from?: string;
  hours_to?: string;
  availability_days?: string[];
  images?: string[];
  approval_status?: string;
  languages?: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

const businessSchema = z.object({
  name: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  subcategory: z.array(z.string()).optional().default([]),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  area: z.string().min(2, { message: "Area must be at least 2 characters." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  postal_code: z.string().regex(/^\d{6}$/, { message: "Postal code must be 6 digits" }),
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
  contact_email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  price_range_min: z.number().optional(),
  price_range_max: z.number().optional(),
  price_unit: z.string().optional(),
  map_link: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).min(3, { message: "Please add at least 3 tags describing your services or items." }).optional(),
  experience: z.string().optional().or(z.literal('')),
  availability: z.string().optional().or(z.literal('')),
  hours: z.string().optional().or(z.literal('')),
  hours_from: z.string().optional(),
  hours_to: z.string().optional(),
  availability_days: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

interface BusinessFormProps {
  business?: Business;
  onSaved: () => void;
  onCancel: () => void;
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

const PRICE_UNITS = [
  "per hour", 
  "per day", 
  "per session", 
  "per month", 
  "per person",
  "fixed price"
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM",
  "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM", 
  "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM",
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", 
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
];

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "More than 10 years"
];

const AVAILABILITY_OPTIONS = [
  "Weekdays Only",
  "Weekends Only",
  "All Days",
  "Monday to Friday",
  "Weekends and Evenings",
  "By Appointment Only",
  "Seasonal"
];

const BusinessFormSimple: React.FC<BusinessFormProps> = ({ business, onSaved, onCancel }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(business?.availability_days || []);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
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

  // Finding category ID when form loads with existing category
  useEffect(() => {
    if (business?.category && dbCategories?.length) {
      const categoryMatch = dbCategories.find(cat => cat.name === business.category);
      if (categoryMatch) {
        setSelectedCategoryId(categoryMatch.id);
      }
    }
  }, [business?.category, dbCategories]);

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
      price_range_min: business?.price_range_min,
      price_range_max: business?.price_range_max,
      price_unit: business?.price_unit || "per hour",
      map_link: business?.map_link || "",
      tags: business?.tags || [],
      experience: business?.experience || "",
      availability: business?.availability || "",
      hours: business?.hours || "",
      hours_from: defaultHoursFrom,
      hours_to: defaultHoursTo,
      availability_days: business?.availability_days || [],
      images: business?.images || [],
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

  useEffect(() => {
    const hoursFrom = form.getValues("hours_from");
    const hoursTo = form.getValues("hours_to");
    
    if (hoursFrom && hoursTo) {
      form.setValue("hours", `${hoursFrom} - ${hoursTo}`);
    }
  }, [form.watch("hours_from"), form.watch("hours_to")]);

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
    
    console.log("Updated days:", updatedDays);
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory].sort();
      setCategories(updatedCategories);
      
      const savedCategories = localStorage.getItem('customCategories');
      let customCategories: string[] = [];
      
      try {
        if (savedCategories) {
          customCategories = JSON.parse(savedCategories);
        }
        
        if (!customCategories.includes(newCategory)) {
          customCategories.push(newCategory);
          localStorage.setItem('customCategories', JSON.stringify(customCategories));
        }
      } catch (error) {
        console.error('Error saving custom category:', error);
      }
      
      form.setValue("category", newCategory);
      setNewCategory("");
      setShowAddCategoryDialog(false);
      
      toast({
        title: "Category Added",
        description: `${newCategory} has been added to the categories list.`
      });
    } else if (categories.includes(newCategory)) {
      toast({
        title: "Category Exists",
        description: "This category already exists in the list.",
        variant: "destructive"
      });
    }
  };

  const handleAddSubcategory = async () => {
    if (!selectedCategoryId) {
      toast({
        title: "No category selected",
        description: "Please select a category first before adding a subcategory.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSubcategory) {
      toast({
        title: "Subcategory name required",
        description: "Please enter a name for the subcategory.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Add to database
      const { error } = await supabase
        .from('subcategories')
        .insert([
          { 
            name: newSubcategory, 
            category_id: selectedCategoryId 
          }
        ]);
        
      if (error) throw error;
      
      // Set the current subcategory to the newly created one
      // Get current subcategories first
      const currentSubcategories = form.getValues("subcategory") || [];
      // Add the new subcategory to the existing ones
      form.setValue("subcategory", [...currentSubcategories, newSubcategory]);
      setNewSubcategory("");
      setShowAddSubcategoryDialog(false);
      
      toast({
        title: "Subcategory Added",
        description: `${newSubcategory} has been added to the selected category.`
      });
      
      // Refresh subcategories - query key will be invalidated due to the category ID
    } catch (error: any) {
      toast({
        title: "Error adding subcategory",
        description: error.message || "Failed to add subcategory.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: BusinessFormValues) => {
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
      
      console.log("Submitting availability days:", availabilityDays);
      console.log("Subcategory values:", data.subcategory);
      
      // Ensure subcategory is always an array
      const subcategoryArray = Array.isArray(data.subcategory) ? data.subcategory : 
                              (data.subcategory ? [data.subcategory] : []);
      
      // Prepare business data with correct subcategory array
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
      };

      console.log("Submitting business data:", businessData);

      let result;
      
      if (business?.id) {
        console.log("Updating business with ID:", business.id);
        result = await supabase
          .from('service_providers')
          .update(businessData)
          .eq('id', business.id);

        if (result.error) {
          console.error("Supabase update error:", result.error);
          throw new Error(`Update failed: ${result.error.message}`);
        }

        console.log("Business updated successfully:", result);
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
          throw new Error(`Creation failed: ${result.error.message}`);
        }

        console.log("Business created successfully:", result);
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
          <Card>
            <CardContent className="pt-6">
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
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 
                "Saving..." : 
                business?.id ? "Update Business" : "Submit Business"
              }
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Add Category Dialog */}
      <AlertDialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Category</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new business category to add to the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddCategory}>Add Category</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Subcategory Dialog */}
      <AlertDialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new subcategory for {selectedCategory || "the selected category"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Subcategory name"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddSubcategory}>Add Subcategory</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog 
        open={showSuccessDialog} 
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) onSaved();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {business?.id ? "Business Updated" : "Business Added"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {business?.id ? 
                "Your business listing has been updated and will be reviewed by an admin." :
                "Your business has been listed and will be reviewed by an admin."
              }
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

export default BusinessFormSimple;
