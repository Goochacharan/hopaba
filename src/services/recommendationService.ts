import { supabase } from '@/integrations/supabase/client';
import { Event, SupabaseEvent } from '@/hooks/types/recommendationTypes';
import { toast } from '@/components/ui/use-toast';
import { extractCoordinatesFromMapLink } from '@/lib/locationUtils';

// Cache for coordinate extraction to avoid repeated processing
const coordinateCache = new Map<string, { lat: number; lng: number } | null>();

// Optimized coordinate extraction with caching
const getCachedCoordinates = (mapLink: string | null) => {
  if (!mapLink) return null;
  
  if (coordinateCache.has(mapLink)) {
    return coordinateCache.get(mapLink);
  }
  
  const coordinates = extractCoordinatesFromMapLink(mapLink);
  coordinateCache.set(mapLink, coordinates);
  return coordinates;
};

// Transform service provider data efficiently
const transformServiceProvider = (item: any) => {
  const coordinates = getCachedCoordinates(item.map_link);
  
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory || null,
    tags: item.tags || [],
    rating: 4.5,
    address: `${item.area}, ${item.city}`,
    distance: "0.5 miles away", // This will be calculated based on user location later
    image: item.images && item.images.length > 0 ? item.images[0] : "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
    images: item.images || [],
    description: item.description || "",
    phone: item.contact_phone,
    openNow: false,
    hours: item.hours || "Until 8:00 PM",
    availability: item.availability || null,
    priceLevel: "$$",
    price_range_min: item.price_range_min || null,
    price_range_max: item.price_range_max || null,
    price_unit: item.price_unit || null,
    map_link: item.map_link || null,
    instagram: item.instagram || '',
    availability_days: item.availability_days || [],
    availability_start_time: item.availability_start_time || '',
    availability_end_time: item.availability_end_time || '',
    created_at: item.created_at || new Date().toISOString(),
    search_rank: item.search_rank || 0,
    latitude: coordinates ? coordinates.lat : null,
    longitude: coordinates ? coordinates.lng : null,
    area: item.area || '',
    city: item.city || ''
  };
};

export const fetchServiceProviders = async (searchTerm: string, categoryFilter: string, subcategoryFilter?: string) => {
  try {
    console.log(`Fetching service providers with search term: "${searchTerm}", category: "${categoryFilter}", subcategory: "${subcategoryFilter}"`);
    
    // Normalize the search term to handle multi-line input
    const normalizedSearchTerm = searchTerm.replace(/\s+/g, ' ').trim();
    
    // Use enhanced search for queries with search terms
    if (normalizedSearchTerm && normalizedSearchTerm.trim() !== '') {
      try {
        const { data: enhancedProviders, error } = await supabase.rpc(
          'search_enhanced_providers', 
          { search_query: normalizedSearchTerm }
        );

        if (error) {
          console.error("Error using enhanced providers search:", error);
          // Fall back to regular search instead of returning empty array
        } else if (enhancedProviders && enhancedProviders.length > 0) {
          console.log(`Fetched ${enhancedProviders.length} enhanced service providers`);
          
          let filteredProviders = enhancedProviders;
          
          // Apply category and subcategory filters
          if (categoryFilter !== 'all') {
            const dbCategory = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
            filteredProviders = filteredProviders.filter(provider => 
              provider.category.toLowerCase() === dbCategory.toLowerCase()
            );
            
            // Apply subcategory filter if provided
            if (subcategoryFilter) {
              filteredProviders = filteredProviders.filter(provider => {
                const providerSubcategories = (provider as any).subcategory || [];
                return Array.isArray(providerSubcategories) && 
                  providerSubcategories.some(sub => 
                    sub.toLowerCase() === subcategoryFilter.toLowerCase()
                  );
              });
            }
          }
          
          // Limit results for better performance
          const limitedProviders = filteredProviders.slice(0, 50);
          return limitedProviders.map(transformServiceProvider);
        }
      } catch (err) {
        console.error("Failed to use enhanced providers search:", err);
        // Continue to fallback search
      }
    }
    
    // Optimized regular search query
    let query = supabase
      .from('service_providers')
      .select(`
        id, name, category, subcategory, tags, images, description, 
        contact_phone, hours, availability, price_range_min, price_range_max, 
        price_unit, map_link, instagram, availability_days, 
        availability_start_time, availability_end_time, created_at, area, city
      `)
      .eq('approval_status', 'approved');
    
    // Apply category filter first for better query performance
    if (categoryFilter !== 'all') {
      const dbCategory = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
      query = query.eq('category', dbCategory);
      
      // Apply subcategory filter if provided
      if (subcategoryFilter) {
        query = query.contains('subcategory', [subcategoryFilter]);
      }
    }
    
    // Apply search term filter if provided
    if (normalizedSearchTerm && normalizedSearchTerm.trim() !== '') {
      query = query.or(`name.ilike.%${normalizedSearchTerm}%,description.ilike.%${normalizedSearchTerm}%,area.ilike.%${normalizedSearchTerm}%`);
    }
    
    // Optimize ordering and limit results
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50); // Limit to 50 results for better performance
    
    if (error) {
      console.error("Error fetching from Supabase:", error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} service providers from Supabase`);
    
    if (data && data.length > 0) {
      return data.map(transformServiceProvider);
    }
    
    return [];
  } catch (err) {
    console.error("Failed to fetch from Supabase:", err);
    return [];
  }
};

export const fetchEvents = async (searchTerm: string): Promise<Event[]> => {
  try {
    // Normalize the search term to handle multi-line input
    const normalizedSearchTerm = searchTerm.replace(/\s+/g, ' ').trim();
    console.log(`Fetching events with search term: "${normalizedSearchTerm}"`);
    
    let query = supabase
      .from('events')
      .select(`
        id, title, description, location, date, time, 
        price_per_person, image, attendees, created_at, approval_status
      `)
      .eq('approval_status', 'approved');
    
    if (normalizedSearchTerm && normalizedSearchTerm.trim() !== '') {
      query = query.or(`title.ilike.%${normalizedSearchTerm}%,description.ilike.%${normalizedSearchTerm}%,location.ilike.%${normalizedSearchTerm}%`);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20); // Limit events for better performance
    
    if (error) {
      console.error("Error fetching events from Supabase:", error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} events from Supabase`);
    
    if (data && data.length > 0) {
      return data.map(event => ({
        ...event,
        pricePerPerson: event.price_per_person || 0
      }));
    }
    
    return [];
  } catch (err) {
    console.error("Failed to fetch events from Supabase:", err);
    return [];
  }
};

export function ensureStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
    } catch {
      // If parsing fails, treat as a single string
      return [value];
    }
  }
  return [];
}
