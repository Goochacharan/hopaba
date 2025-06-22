import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Business, BusinessFormValues } from './BusinessFormSimple';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagsInput } from '@/components/ui/tags-input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Clock, Phone, MessageSquare, Globe, Instagram, Tag, Star, Plus, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubcategorySelector from './SubcategorySelector';
import LanguageSelector from './LanguageSelector';
import LocationSectionSimple from './LocationSectionSimple';

interface BusinessFormContentProps {
  form?: UseFormReturn<BusinessFormValues>;
  handlePhoneInput?: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => void;
  handleDayToggle?: (day: string, checked: boolean) => void;
  selectedDays?: string[];
  loadingCategories?: boolean;
  dbCategories?: any[] | undefined;
  categories?: string[];
  isAdmin?: boolean;
  setShowAddCategoryDialog?: (show: boolean) => void;
  selectedCategoryId?: string | null;
  loadingSubcategories?: boolean;
  subcategories?: any[] | undefined;
  setShowAddSubcategoryDialog?: (show: boolean) => void;
  isSubmitting: boolean;
  business?: Business;
  onCancel?: () => void;
}

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

const PRICE_UNITS = [
  "per hour", 
  "per day", 
  "per session", 
  "per month", 
  "per person",
  "fixed price"
];

const BusinessFormContent: React.FC<BusinessFormContentProps> = ({
  form,
  handlePhoneInput,
  handleDayToggle,
  selectedDays,
  loadingCategories,
  dbCategories,
  categories,
  isAdmin,
  setShowAddCategoryDialog,
  selectedCategoryId,
  loadingSubcategories,
  subcategories,
  setShowAddSubcategoryDialog,
  isSubmitting,
  business
}) => {
  return (
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
                    {loadingCategories ? (
                      <div className="px-2 py-1.5 text-sm">Loading categories...</div>
                    ) : dbCategories?.length ? (
                      dbCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : categories.map(category => (
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
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" />
                Subcategory
              </FormLabel>
              <div className="flex gap-2">
                <SubcategorySelector
                  categoryId={selectedCategoryId || undefined}
                  value={field.value}
                  onChange={(values) => {
                    form.setValue("subcategory", values, { shouldValidate: true });
                  }}
                  disabled={!selectedCategoryId}
                  isVisible={true}
                  className="w-full"
                />
                {isAdmin && selectedCategoryId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setShowAddSubcategoryDialog(true)}
                    title="Add New Subcategory"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!selectedCategoryId && (
                <FormDescription>Select a category first to see subcategories (optional)</FormDescription>
              )}
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

      {/* Enhanced Location Section with Interactive Map */}
      <LocationSectionSimple form={form} />

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
                  value={field.value || "+91"}
                  onChange={(e) => {
                    field.onChange(e);
                    handlePhoneInput(e, 'contact_phone');
                  }}
                />
              </FormControl>
              <FormDescription>
                10-digit mobile number required
              </FormDescription>
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
                  value={field.value || "+91"}
                  onChange={(e) => {
                    field.onChange(e);
                    handlePhoneInput(e, 'whatsapp');
                  }}
                />
              </FormControl>
              <FormDescription>
                10-digit mobile number required
              </FormDescription>
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

        <LanguageSelector form={form} />
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
                <FormLabel>Min Price (₹) <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
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
                <FormLabel>Max Price (₹) <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
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
              <FormLabel>Price Unit <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
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
              <FormLabel>Professional Experience <span className="text-xs text-muted-foreground">(optional)</span></FormLabel>
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
            name="availability_start_time"
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
            name="availability_end_time"
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
  );
};

export default BusinessFormContent;
