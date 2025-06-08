import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from './useBusinesses';

const ITEMS_PER_PAGE = 24;

export const useInfiniteBusinesses = (
  category: string | null,
  subcategory: string | null,
  city?: string,
  postalCode?: string,
  searchTerm?: string
) => {
  return useInfiniteQuery({
    queryKey: ['businesses-infinite', category, subcategory, city, postalCode, searchTerm],
    queryFn: async ({ pageParam = 0 }): Promise<{ businesses: Business[], hasMore: boolean }> => {
      console.log(`Fetching businesses page ${pageParam} with filters - category: ${category}, subcategory: ${subcategory}, city: ${city}, postalCode: ${postalCode}, searchTerm: ${searchTerm}`);
      
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
      
      const offset = pageParam * ITEMS_PER_PAGE;
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (error) {
        console.error('Error fetching businesses:', error);
        throw new Error(error.message);
      }
      
      const businesses = data as Business[];
      const hasMore = businesses.length === ITEMS_PER_PAGE;
      
      console.log(`Found ${businesses.length} businesses for page ${pageParam}, hasMore: ${hasMore}`);
      return { businesses, hasMore };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}; 