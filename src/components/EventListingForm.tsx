import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';
import { ImageUpload } from '@/components/ui/image-upload';

const eventFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  location: z.string().min(5, { message: "Location must be at least 5 characters" }),
  image: z.string().min(1, { message: "Image is required" }),
  attendees: z.coerce.number().optional(),
  price_per_person: z.coerce.number().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  event?: any;
  onSaved: () => void;
  onCancel?: () => void;
}

export const EventListingForm = ({ event, onSaved, onCancel }: EventFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(event ? new Date(event.date) : undefined);

  const defaultValues: Partial<EventFormData> = {
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '',
    location: event?.location || '',
    image: event?.image || '',
    attendees: event?.attendees || 0,
    price_per_person: event?.price_per_person || 0,
  };

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const handleImageChange = useCallback((images: string[]) => {
    form.setValue('image', images[0], { shouldValidate: true });
  }, [form]);

  const handleSubmit = async (data: EventFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to post events.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the event data
      const eventPayload = {
        title: data.title,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description,
        image: data.image,
        attendees: data.attendees || 0,
        price_per_person: data.price_per_person || 0,
        approval_status: 'pending', // Always set approval_status to pending when creating or updating
        user_id: user.id // Add the user_id to associate the event with the current user
      };

      console.log("Submitting event with user_id:", user.id);

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', event.id)
          .eq('user_id', user.id); // Ensure we're only updating an event that belongs to the user
        
        if (error) throw error;
        
        toast({
          title: "Event Updated",
          description: "Your event has been updated and will be reviewed by an admin.",
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert(eventPayload);
        
        if (error) throw error;
        
        toast({
          title: "Event Created",
          description: "Your event has been created and will be reviewed by an admin.",
        });
      }

      onSaved();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Summer Music Festival" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title for your event
                    </FormDescription>
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
                        placeholder="Describe your event, include details about the performers, activities, etc."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Central Park, New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="attendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Attendees (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="1" placeholder="e.g. 1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Person (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="100" placeholder="e.g. 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            {date ? format(date, "PPP") : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(newDate) => {
                            setDate(newDate);
                            if (newDate) {
                              field.onChange(format(newDate, "yyyy-MM-dd"));
                            }
                          }}
                          disabled={(date) =>
                            date < new Date()
                          }
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
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time*</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image*</FormLabel>
                    <FormControl>
                      <ImageUpload
                        images={field.value ? [field.value] : []}
                        onImagesChange={handleImageChange}
                        maxImages={1}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload an image for your event.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> {event ? 'Update Event' : 'Create Event'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};
