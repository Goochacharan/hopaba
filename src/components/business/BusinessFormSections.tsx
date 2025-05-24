
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TagsInput } from "../ui/tags-input";

// Price Range Section Component
export const PriceRangeSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Pricing Information</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          name="price_range_min"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="500"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="price_range_max"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5000"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
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
                  <SelectItem value="per hour">Per Hour</SelectItem>
                  <SelectItem value="per day">Per Day</SelectItem>
                  <SelectItem value="per session">Per Session</SelectItem>
                  <SelectItem value="per month">Per Month</SelectItem>
                  <SelectItem value="fixed price">Fixed Price</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

// Availability Section Component
export const AvailabilitySection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Availability</h3>
      <FormField
        name="availability"
        render={({ field }) => (
          <FormItem>
            <FormLabel>When are you available?</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Weekdays 9AM-5PM, Weekends by appointment"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// Tags Section Component
export const TagsSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Services & Tags</h3>
      <FormField
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Add tags for your services or items (minimum 3)
            </FormLabel>
            <FormControl>
              <TagsInput
                placeholder="Type and press enter to add tags"
                tags={field.value || []}
                setTags={(newTags) => field.onChange(newTags)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// Languages Section Component
export const LanguagesSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Languages</h3>
      <FormField
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages you speak</FormLabel>
            <FormControl>
              <TagsInput
                placeholder="Add languages you speak"
                tags={field.value || []}
                setTags={(newTags) => field.onChange(newTags)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

// Experience Section Component
export const ExperienceSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Experience</h3>
      <FormField
        name="experience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Years of experience</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select years of experience" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                <SelectItem value="1-3 years">1-3 years</SelectItem>
                <SelectItem value="3-5 years">3-5 years</SelectItem>
                <SelectItem value="5-10 years">5-10 years</SelectItem>
                <SelectItem value="More than 10 years">More than 10 years</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
