
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from './useBusinesses';

export const useBusinessesOptimized = (
  category: string | null,
  subcategory: string | null,
  city?: string,
  postalCode?: string,
  searchTerm?: string
) => {
  return useQuery({
    queryKey: ['businesses-optimized', category, subcategory, city, postalCode, searchTerm],
    queryFn: async (): Promise<Business[]> => {
      console.log(`Fetching businesses with filters - category: ${category}, subcategory: ${subcategory}, city: ${city}, postalCode: ${postalCode}, searchTerm: ${searchTerm}`);
      
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved');
        
      // Apply category filter
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      
      // Apply subcategory filter
      if (subcategory && subcategory !== "") {
        console.log(`Filtering by subcategory: ${subcategory}`);
        query = query.contains('subcategory', [subcategory]);
      }
      
      // Apply city filter
      if (city && city !== 'All Cities') {
        query = query.eq('city', city);
      }
      
      // Apply postal code filter
      if (postalCode && postalCode.trim()) {
        query = query.eq('postal_code', postalCode.trim());
      }
      
      // Apply search term filter across multiple fields
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,area.ilike.%${term}%,tags.cs.{${term}}`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100); // Limit results for better performance
      
      if (error) {
        console.error('Error fetching businesses:', error);
        throw new Error(error.message);
      }
      
      console.log(`Found ${data?.length} businesses with applied filters`);
      return data as Business[];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
