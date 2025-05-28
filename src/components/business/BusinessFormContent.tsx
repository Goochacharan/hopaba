
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { UseFormReturn } from "react-hook-form";
import { BusinessFormValues } from "./BusinessFormSimple";
import LanguagesSelector from "./LanguagesSelector";
import { useState } from 'react';

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

interface BusinessFormContentProps {
  form: UseFormReturn<BusinessFormValues>;
  handlePhoneInput: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'contact_phone' | 'whatsapp') => void;
  handleDayToggle: (day: string, checked: boolean) => void;
  selectedDays: string[];
  loadingCategories: boolean;
  dbCategories: any[];
  categories: string[];
  isAdmin: boolean;
  setShowAddCategoryDialog: (show: boolean) => void;
  selectedCategoryId: string | null;
  loadingSubcategories: boolean;
  subcategories: any[];
  setShowAddSubcategoryDialog: (show: boolean) => void;
  isSubmitting: boolean;
  business: any;
}

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
  const [tagInput, setTagInput] = useState('');
  const tags = form.watch('tags') || [];
  const selectedLanguages = form.watch('languages') || [];

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      form.setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    form.setValue('tags', tags.filter((_: string, i: number) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleLanguagesChange = (languages: string[]) => {
    form.setValue('languages', languages, { shouldValidate: true });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter business name" {...field} />
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                  disabled={loadingCategories}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      <>
                        {dbCategories?.map(category => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                        {categories.filter(cat => !dbCategories?.some(dbCat => dbCat.name === cat)).map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategoryDialog(true)}
                    className="shrink-0"
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
              <FormLabel>Subcategory</FormLabel>
              <div className="flex gap-2">
                <Select 
                  onValueChange={(value) => {
                    const currentSubcategories = field.value || [];
                    if (value && !currentSubcategories.includes(value)) {
                      field.onChange([...currentSubcategories, value]);
                    }
                  }}
                  disabled={!selectedCategoryId || loadingSubcategories}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={selectedCategoryId ? "Select subcategory" : "Select a category first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingSubcategories ? (
                      <SelectItem value="loading" disabled>Loading subcategories...</SelectItem>
                    ) : (
                      subcategories?.map(subcategory => (
                        <SelectItem key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {isAdmin && selectedCategoryId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSubcategoryDialog(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Display selected subcategories */}
              {field.value && field.value.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {field.value.map((subcategory: string, index: number) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {subcategory}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0 text-muted-foreground"
                        onClick={() => {
                          const newSubcategories = field.value.filter((_: string, i: number) => i !== index);
                          field.onChange(newSubcategories);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
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
                <Textarea 
                  placeholder="Describe your business, services offered, and any other important information"
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Section */}
        <div>
          <FormLabel>Tags (at least 3)*</FormLabel>
          <div className="flex mt-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add tags (press Enter)"
              className="mr-2"
            />
            <Button type="button" onClick={handleAddTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="px-2 py-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0 text-muted-foreground"
                  onClick={() => handleRemoveTag(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          {tags.length < 3 && (
            <p className="text-sm text-amber-600 mt-2">Please add at least 3 tags to describe your business</p>
          )}
        </div>

        {/* Languages Section */}
        <LanguagesSelector 
          selectedLanguages={selectedLanguages}
          onLanguagesChange={handleLanguagesChange}
        />
      </div>

      {/* Location and Contact Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location & Contact</h3>
        
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area*</FormLabel>
              <FormControl>
                <Input placeholder="Enter area" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address*</FormLabel>
              <FormControl>
                <Input placeholder="Enter full address" {...field} />
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
              <FormLabel>Postal Code*</FormLabel>
              <FormControl>
                <Input placeholder="Enter 6-digit postal code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+91XXXXXXXXXX"
                  {...field}
                  onChange={(e) => handlePhoneInput(e, 'contact_phone')}
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
              <FormLabel>WhatsApp*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+91XXXXXXXXXX"
                  {...field}
                  onChange={(e) => handlePhoneInput(e, 'whatsapp')}
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
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
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
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="@username or https://instagram.com/username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Pricing Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing & Services</h3>
        
        <FormField
          control={form.control}
          name="price_unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price unit" />
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
                    placeholder="1000"
                    {...field}
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
                    placeholder="5000"
                    {...field}
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
          name="experience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
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
      </div>

      {/* Availability Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Availability</h3>
        
        <div>
          <FormLabel>Available Days</FormLabel>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day}`}
                  checked={selectedDays.includes(day)}
                  onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                />
                <label htmlFor={`day-${day}`} className="text-sm font-medium">
                  {day}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hours_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time}>
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
                <FormLabel>To Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time}>
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

      {/* Images Section */}
      <div className="space-y-4 md:col-span-2">
        <h3 className="text-lg font-semibold">Business Images</h3>
        
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Images*</FormLabel>
              <FormControl>
                <ImageUpload
                  images={field.value || []}
                  onImagesChange={field.onChange}
                  maxImages={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default BusinessFormContent;
