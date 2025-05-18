
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { TagsInput } from '@/components/ui/tags-input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Building, Clock, MapPin, Phone, MessageSquare, Globe, Instagram, Tag, Star, Plus } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";

export interface BusinessFormValues {
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
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  
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
      description: business?.description || "",
      area: business?.area || "",
      city: business?.city || "",
      address: business?.address || "",
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
      
      const businessData = {
        name: data.name,
        category: data.category,
        description: data.description,
        area: data.area,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code, // Ensure this is included
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
          throw new Error(result.error.message);
        }

        toast({
          title: "Business Updated",
          description: "Your business listing has been updated and will be reviewed by an admin.",
        });
      } else {
        console.log("Creating new business");
        result = await supabase
          .from('service_providers')
          .insert([businessData]); // Make sure we're using array here

        if (result.error) {
          console.error("Supabase insert error:", result.error);
          throw new Error(result.error.message);
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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Basic Information</h3>
                  </div>
                  
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
                        <div className="flex gap-2">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                              {isAdmin && (
                                <button 
                                  className="flex w-full items-center px-2 py-1.5 text-sm rounded-sm hover:bg-muted"
                                  type="button"
                                  onClick={() => setShowAddCategoryDialog(true)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add New Category
                                </button>
                              )}
                            </SelectContent>
                          </Select>
                          {isAdmin && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setShowAddCategoryDialog(true)}
                              title="Add New Category"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Images</FormLabel>
                        <FormDescription>
                          Upload images of your business or services
                        </FormDescription>
                        <FormControl>
                          <ImageUpload 
                            images={field.value || []} 
                            onImagesChange={(images) => form.setValue('images', images, { shouldValidate: true })}
                            maxImages={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Location Information</h3>
                  </div>
                  
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

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
                          Optional: Add a link to your business on Google Maps
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Contact Information</h3>
                  </div>
                  
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
                        <FormLabel className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp Number*
                        </FormLabel>
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

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website <span className="text-xs text-muted-foreground">(optional)</span>
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram <span className="text-xs text-muted-foreground">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@yourusername or full URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Services & Pricing</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Services/Items Tags* (minimum 3)</FormLabel>
                        <FormDescription>
                          Add at least 3 tags describing your services or items
                        </FormDescription>
                        <FormControl>
                          <TagsInput
                            placeholder="Type and press enter (e.g., Ice Cream, Massage, Haircut)"
                            tags={field.value || []}
                            setTags={(newTags) => form.setValue('tags', newTags, { shouldValidate: true })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price_range_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="300"
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
                          <FormLabel>Max Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="400"
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
                            {PRICE_UNITS.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Experience & Availability</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Experience</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select years of experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPERIENCE_OPTIONS.map(exp => (
                              <SelectItem key={exp} value={exp}>
                                {exp}
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
                    name="availability_days"
                    render={() => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Available Days
                        </FormLabel>
                        <FormDescription>
                          Select the days you are available
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {DAYS_OF_WEEK.map((day) => (
                            <FormItem
                              key={day}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={selectedDays.includes(day)}
                                  onCheckedChange={(checked) => {
                                    handleDayToggle(day, checked as boolean);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {day}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hours_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Working Hours From
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || "9:00 AM"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select start time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {TIME_OPTIONS.map(time => (
                                <SelectItem key={`from-${time}`} value={time}>
                                  {time}
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
                      name="hours_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Working Hours To
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value || "5:00 PM"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select end time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {TIME_OPTIONS.map(time => (
                                <SelectItem key={`to-${time}`} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
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
