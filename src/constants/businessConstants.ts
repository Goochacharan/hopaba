
export const CATEGORIES = [
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
].sort() as const;

export const PRICE_UNITS = [
  "per hour",
  "per day", 
  "per session",
  "per month",
  "per person",
  "fixed price"
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

export const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM",
  "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM", "3:00 AM", "3:30 AM",
  "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM",
  "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", 
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
] as const;

export const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years", 
  "5-10 years",
  "More than 10 years"
] as const;

export const AVAILABILITY_OPTIONS = [
  "Weekdays Only",
  "Weekends Only",
  "All Days",
  "Monday to Friday",
  "Weekends and Evenings",
  "By Appointment Only",
  "Seasonal"
] as const;

export type CategoryType = typeof CATEGORIES[number];
export type PriceUnitType = typeof PRICE_UNITS[number];
export type DayOfWeekType = typeof DAYS_OF_WEEK[number];
export type TimeOptionType = typeof TIME_OPTIONS[number];
export type ExperienceOptionType = typeof EXPERIENCE_OPTIONS[number];
export type AvailabilityOptionType = typeof AVAILABILITY_OPTIONS[number];
