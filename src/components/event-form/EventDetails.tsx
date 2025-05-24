
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Users, IndianRupee } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from './types';

interface EventDetailsProps {
  form: UseFormReturn<EventFormValues>;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ form }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="pricePerPerson"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price Per Person (₹) *</FormLabel>
            <FormControl>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  className="pl-10"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </div>
            </FormControl>
            <FormDescription>Enter price in Rupees (0 for free events)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="attendees"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current Attendees</FormLabel>
            <FormControl>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  className="pl-10"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </div>
            </FormControl>
            <FormDescription>Number of people already attending</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
