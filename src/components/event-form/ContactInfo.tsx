
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Phone, MessageCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from './types';

interface ContactInfoProps {
  form: UseFormReturn<EventFormValues>;
  handlePhoneInput: (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'phoneNumber' | 'whatsappNumber') => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({ form, handlePhoneInput }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number *</FormLabel>
            <FormControl>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="+91xxxxxxxxxx" 
                  className="pl-10"
                  {...field}
                  onChange={(e) => handlePhoneInput(e, 'phoneNumber')}
                />
              </div>
            </FormControl>
            <FormDescription>Enter your contact number with +91 prefix</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="whatsappNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WhatsApp Number *</FormLabel>
            <FormControl>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="+91xxxxxxxxxx" 
                  className="pl-10"
                  {...field}
                  onChange={(e) => handlePhoneInput(e, 'whatsappNumber')}
                />
              </div>
            </FormControl>
            <FormDescription>Enter your WhatsApp number with +91 prefix</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
