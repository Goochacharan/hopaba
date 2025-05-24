
import { CategoryType } from '@/components/CategoryFilter';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  attendees: number;
  pricePerPerson?: number;
  phoneNumber?: string;
  whatsappNumber?: string;
  images?: string[];
  approval_status?: string;
  user_id?: string;
  isHiddenGem?: boolean;
  isMustVisit?: boolean;
}

export interface UseRecommendationsProps {
  initialQuery?: string;
  initialCategory?: CategoryType;
  initialSubcategory?: string;
  loadDefaultResults?: boolean;
}

export interface FilterOptions {
  maxDistance: number;
  minRating: number;
  priceLevel: number;
  openNow: boolean;
  hiddenGem?: boolean;
  mustVisit?: boolean;
  distanceUnit?: 'km' | 'mi';
}

export interface SupabaseEvent {
  approval_status: string;
  attendees: number | null;
  created_at: string;
  date: string;
  description: string;
  id: string;
  image: string;
  location: string;
  time: string;
  title: string;
  price_per_person?: number;
}
