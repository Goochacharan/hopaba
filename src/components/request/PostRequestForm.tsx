import React, { useState, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { ImageUpload } from "@/components/ui/image-upload";
import { useCategories } from '@/hooks/useCategories';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mic, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { toast } from '@/components/ui/use-toast';

// List of major Indian cities
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", 
  "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"
];

const requestFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  subcategory: z.string().optional(),
  budget: z.coerce.number().min(1).optional(),
  date_range_start: z.date().optional(),
  date_range_end: z.date().optional(),
  city: z.string().min(1, {
    message: "Please select a city.",
  }),
  area: z.string().min(1, {
    message: "Please enter an area.",
  }),
  postal_code: z.string().min(6, {
    message: "Postal code must be at least 6 characters.",
  }).max(6, {
    message: "Postal code must not exceed 6 characters."
  }),
  contact_phone: z.string().regex(/^\d{10}$/, {
    message: "Please enter a valid 10-digit phone number.",
  }),
  images: z.array(z.string()).optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const PostRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { createRequest, isCreating } = useServiceRequests();
  const { 
    dbCategories,
    loadingCategories,
    subcategories,
    loadingSubcategories,
    getCategoryIdByName,
    getSubcategoriesByCategoryName
  } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subcategory: "",
      budget: undefined,
      date_range_start: undefined,
      date_range_end: undefined,
      city: "",
      area: "",
      postal_code: "",
      contact_phone: "",
      images: [],
    },
  });

  const { isListening, startSpeechRecognition } = useVoiceSearch({
    onTranscript: (transcript) => {
      const currentDescription = form.getValues("description");
      form.setValue("description", currentDescription ? `${currentDescription} ${transcript}` : transcript);
    }
  });

  const onSubmit = (values: RequestFormValues) => {
    const requestData: Omit<ServiceRequest, 'id' | 'user_id' | 'created_at' | 'status'> = {
      title: values.title,
      description: values.description,
      category: values.category,
      subcategory: values.subcategory,
      budget: values.budget,
      date_range_start: values.date_range_start ? format(values.date_range_start, 'yyyy-MM-dd') : undefined,
      date_range_end: values.date_range_end ? format(values.date_range_end, 'yyyy-MM-dd') : undefined,
      city: values.city,
      area: values.area,
      postal_code: values.postal_code,
      contact_phone: values.contact_phone,
      images: values.images || []
    };
    
    createRequest(requestData);
    navigate('/requests');
  };

  const handleCategoryChange = (categoryName: string) => {
    form.setValue("category", categoryName);
    form.setValue("subcategory", "");
    
    // Get the category ID for subcategories lookup
    const categoryId = getCategoryIdByName(categoryName);
    setSelectedCategoryId(categoryId);
    
    // Fetch subcategories if needed
    if (categoryId) {
      getSubcategoriesByCategoryName(categoryName);
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      form.setValue("contact_phone", value);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Need a caterer for birthday party" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Textarea 
                      placeholder="Describe your requirements in detail..." 
                      className="min-h-[120px] pr-20" 
                      {...field}
                      ref={textareaRef}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className={cn("rounded-full", isListening && "bg-red-100 text-red-500")}
                        onClick={startSpeechRecognition}
                        title="Use voice input"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className={cn("rounded-full", isImageUploadOpen && "bg-primary/10 text-primary")}
                        onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
                        title="Add images"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isImageUploadOpen && (
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload 
                      images={field.value || []} 
                      onImagesChange={(images) => form.setValue('images', images)}
                      maxImages={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Select 
                    value={field.value} 
                    onValueChange={handleCategoryChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {loadingCategories ? (
                        <div className="px-2 py-1.5 text-sm">Loading categories...</div>
                      ) : dbCategories?.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
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
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                    disabled={!selectedCategoryId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCategoryId ? "Select a subcategory" : "Select category first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {!selectedCategoryId ? (
                        <div className="px-2 py-1.5 text-sm">Select a category first</div>
                      ) : loadingSubcategories ? (
                        <div className="px-2 py-1.5 text-sm">Loading subcategories...</div>
                      ) : subcategories?.length ? (
                        subcategories.map(subcategory => (
                          <SelectItem key={subcategory.id} value={subcategory.name}>
                            {subcategory.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm">No subcategories found</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Your estimated budget (₹)"
                    {...field}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date_range_start"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>From date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_range_end"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>To date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => {
                          const start = form.getValues("date_range_start");
                          if (!start) return false;
                          return date < start;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormControl>
                    <Input placeholder="Area/Neighborhood" {...field} />
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
                  <FormControl>
                    <Input placeholder="6-digit postal code" maxLength={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex">
                    <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
                      +91
                    </div>
                    <Input 
                      placeholder="10-digit phone number" 
                      value={field.value} 
                      onChange={handlePhoneInput}
                      className="rounded-l-none"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PostRequestForm;
