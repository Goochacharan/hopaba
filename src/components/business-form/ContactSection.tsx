
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Phone, MessageCircle, Instagram, Film, Globe } from 'lucide-react';
import { BusinessFormValues } from '../AddBusinessForm';

const ContactSection = () => {
  const form = useFormContext<BusinessFormValues>();
  
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (!value.startsWith('+91')) {
      value = '+91' + value.replace('+91', '');
    }
    
    const digits = value.slice(3).replace(/\D/g, '');
    
    const limitedDigits = digits.slice(0, 10);
    
    e.target.value = '+91' + limitedDigits;
    
    form.setValue('contact_phone', e.target.value, {
      shouldValidate: true,
    });
  };

  const handleWhatsAppInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (!value.startsWith('+91')) {
      value = '+91' + value.replace('+91', '');
    }
    
    const digits = value.slice(3).replace(/\D/g, '');
    
    const limitedDigits = digits.slice(0, 10);
    
    e.target.value = '+91' + limitedDigits;
    
    form.setValue('whatsapp', e.target.value, {
      shouldValidate: true,
    });
  };
  
  return (
    <>
      <div className="space-y-6 md:col-span-2">
        <h3 className="text-lg font-medium flex items-center gap-2 mt-4">
          <Phone className="h-5 w-5 text-primary" />
          Contact Information
        </h3>
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
                  handlePhoneInput(e);
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
            <FormLabel>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Number*
              </div>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter WhatsApp number" 
                value={field.value || "+91"}
                onChange={(e) => {
                  field.onChange(e);
                  handleWhatsAppInput(e);
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
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
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
            <FormLabel>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram / Video Content
                <Film className="h-4 w-4 ml-1 text-purple-500" />
              </div>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="@yourusername or full URL"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Add your Instagram username or full video URL (YouTube, Instagram, TikTok, etc.)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default ContactSection;
