
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string[];
  description: string;
  address: string;
  area: string;
  city: string;
  contact_phone: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  map_link?: string;
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  availability?: string;
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  tags?: string[];
  images?: string[];
  languages?: string[];
  experience?: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  postal_code?: string;
}

export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as Business[];
    }
  });
};

export const useBusinessesByCategory = (category: string | null) => {
  return useQuery({
    queryKey: ['businesses', 'category', category],
    queryFn: async (): Promise<Business[]> => {
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved');
        
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data as Business[];
    },
    enabled: true
  });
};

export const useBusinessesBySubcategory = (category: string | null, subcategory: string | null) => {
  return useQuery({
    queryKey: ['businesses', 'category', category, 'subcategory', subcategory],
    queryFn: async (): Promise<Business[]> => {
      console.log(`Fetching businesses with category: ${category}, subcategory: ${subcategory}`);
      
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved');
        
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      
      if (subcategory && subcategory !== "") {
        console.log(`Filtering by subcategory: ${subcategory}`);
        // Use contains operator for array fields
        query = query.contains('subcategory', [subcategory]);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching businesses by subcategory:', error);
        throw new Error(error.message);
      }
      
      console.log(`Found ${data?.length} businesses with subcategory: ${subcategory}`);
      return data as Business[];
    },
    enabled: true
  });
};
