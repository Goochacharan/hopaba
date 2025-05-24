
import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  date: z.string().min(1, { message: "Date is required" }),
  time: z.string().min(1, { message: "Time is required" }),
  location: z.string().min(3, { message: "Location is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  images: z.array(z.string()).min(1, { message: "At least one image is required" }),
  phoneNumber: z.string()
    .regex(/^\+91\d{10}$/, { message: "Please enter a valid 10-digit phone number with +91 prefix" }),
  whatsappNumber: z.string()
    .regex(/^\+91\d{10}$/, { message: "Please enter a valid 10-digit WhatsApp number with +91 prefix" }),
  attendees: z.number().min(0, { message: "Number of attendees cannot be negative" }).optional(),
  pricePerPerson: z.number().min(0, { message: "Price cannot be negative" })
});

export type EventFormValues = z.infer<typeof eventSchema>;
