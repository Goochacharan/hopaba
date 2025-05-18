import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  model_year?: string;
  location: string;
  map_link?: string;
  seller_name: string;
  seller_id?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_instagram?: string;
  seller_role: 'owner' | 'dealer'; // Ensuring this is a union type, not just string
  seller_rating?: number;
  review_count?: number;
  images?: string[];
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_negotiable?: boolean;
  damage_images?: string[];
  inspection_certificates?: string[];
  shop_images?: string[];
  area: string;
  city: string;
  postal_code: string;
  updated_at: string;
  bill_images?: string[];
  ownership_number?: string;
  search_rank?: number;
}

interface MarketplaceListingsQueryOptions {
  category?: string;
  searchQuery?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  includeAllStatuses?: boolean;
}

// This interface matches the return type from the search_enhanced_listings database function
interface EnhancedSearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  model_year: string;
  location: string;
  map_link: string;
  seller_name: string;
  seller_id: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_instagram: string;
  seller_role: string; // Explicitly adding the seller_role field to match the DB function return
  seller_rating: number;
  review_count: number;
  images: string[];
  created_at: string;
  approval_status: string;
  is_negotiable: boolean;
  search_rank: number;
}

export const useMarketplaceListings = (options: MarketplaceListingsQueryOptions = {}) => {
  const {
    category,
    searchQuery,
    condition,
    minPrice,
    maxPrice,
    minRating,
    includeAllStatuses = false
  } = options;

  return useQuery({
    queryKey: ['marketplaceListings', { category, searchQuery, condition, minPrice, maxPrice, minRating }],
    queryFn: async () => {
      try {
        // For natural language search with detailed models and years
        if (searchQuery && searchQuery.trim() !== '') {
          // Normalize search query to handle multi-line input
          const normalizedQuery = searchQuery.replace(/\s+/g, ' ').trim();
          console.log(`Using enhanced search for marketplace with query: "${normalizedQuery}"`);
          
          // Fix the error that was occurring in the original code by adding safety checks
          try {
            const { data: enhancedListings, error } = await supabase.rpc(
              'search_enhanced_listings', 
              { search_query: normalizedQuery }
            );
    
            if (error) {
              console.error("Error using enhanced listings search:", error);
              // Fall back to regular search if RPC fails
            } else if (enhancedListings && enhancedListings.length > 0) {
              console.log(`Found ${enhancedListings.length} items through enhanced search`);
              
              let filteredListings = enhancedListings as EnhancedSearchResult[];
              
              // Apply category filter if provided
              if (category) {
                filteredListings = filteredListings.filter(listing => listing.category === category);
              }
              
              // Apply other filters
              if (condition) {
                filteredListings = filteredListings.filter(listing => listing.condition === condition);
              }
              
              if (minPrice !== undefined) {
                filteredListings = filteredListings.filter(listing => listing.price >= minPrice);
              }
              
              if (maxPrice !== undefined) {
                filteredListings = filteredListings.filter(listing => listing.price <= maxPrice);
              }
              
              if (minRating !== undefined) {
                filteredListings = filteredListings.filter(listing => (listing.seller_rating || 0) >= minRating);
              }
              
              if (!includeAllStatuses) {
                filteredListings = filteredListings.filter(listing => listing.approval_status === 'approved');
              }
              
              // Fix the error by properly mapping each enhanced listing to the MarketplaceListing interface
              // with all required fields and proper type casting
              return filteredListings.map(item => {
                const listing: MarketplaceListing = {
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  condition: item.condition,
                  model_year: item.model_year || undefined,
                  location: item.location,
                  map_link: item.map_link || undefined,
                  seller_name: item.seller_name,
                  seller_id: item.seller_id || undefined,
                  seller_phone: item.seller_phone || undefined,
                  seller_whatsapp: item.seller_whatsapp || undefined,
                  seller_instagram: item.seller_instagram || undefined,
                  // Now the seller_role is properly handled with type safety
                  seller_role: (item.seller_role === 'dealer' ? 'dealer' : 'owner') as 'owner' | 'dealer',
                  seller_rating: item.seller_rating || 0,
                  review_count: item.review_count || 0,
                  images: item.images || [],
                  created_at: item.created_at,
                  approval_status: item.approval_status as 'pending' | 'approved' | 'rejected',
                  is_negotiable: item.is_negotiable || false,
                  // Add default values for fields not returned by search_enhanced_listings
                  shop_images: [],
                  damage_images: [],
                  inspection_certificates: [],
                  bill_images: [],
                  area: '',
                  city: '',
                  postal_code: '',
                  updated_at: item.created_at,
                  search_rank: item.search_rank || 0
                };
                return listing;
              });
            }
          } catch (searchError) {
            console.error("Exception in enhanced listings search:", searchError);
            // Continue to fallback search
          }
        }
  
        // Regular query using table search
        let query = supabase
          .from('marketplace_listings')
          .select('*');
  
        if (!includeAllStatuses) {
          query = query.eq('approval_status', 'approved');
        }
  
        if (category) {
          query = query.eq('category', category);
        }
  
        if (searchQuery) {
          // Normalize and split search into terms for better matching
          const normalizedQuery = searchQuery.replace(/\s+/g, ' ').trim();
          const terms = normalizedQuery.split(' ').filter(term => term.length > 1);
          
          if (terms.length > 0) {
            let searchCondition = '';
            
            // Build OR condition for each term
            terms.forEach((term, index) => {
              if (index > 0) searchCondition += ',';
              searchCondition += `title.ilike.%${term}%,description.ilike.%${term}%`;
              
              // Check for year pattern
              if (/^(19|20)\d{2}$/.test(term)) {
                searchCondition += `,model_year.ilike.%${term}%`;
              }
            });
            
            query = query.or(searchCondition);
          } else {
            // Fallback to simple search if normalized terms are too short
            query = query.or(`title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
          }
        }
  
        if (condition) {
          query = query.eq('condition', condition);
        }
  
        if (minPrice !== undefined) {
          query = query.gte('price', minPrice);
        }
  
        if (maxPrice !== undefined) {
          query = query.lte('price', maxPrice);
        }
  
        if (minRating !== undefined) {
          query = query.gte('seller_rating', minRating);
        }
  
        query = query.order('created_at', { ascending: false });
  
        const { data, error } = await query;
  
        if (error) {
          throw new Error(error.message);
        }
  
        // Cast the result to ensure compliance with our interface
        return (data || []).map(item => ({
          ...item,
          // Ensure required fields exist
          seller_role: (item.seller_role || 'owner') as 'owner' | 'dealer',
          seller_rating: item.seller_rating || 0,
          images: item.images || [],
          shop_images: item.shop_images || [],
          damage_images: item.damage_images || [],
          inspection_certificates: item.inspection_certificates || [],
          bill_images: item.bill_images || [],
          review_count: 0, // Fixed: Default to 0 for review_count
          search_rank: 0, // Add a default search_rank for regular listings
          area: item.area || '',
          city: item.city || '',
          postal_code: item.postal_code || '',
          updated_at: item.updated_at || item.created_at
        })) as MarketplaceListing[];
      } catch (error) {
        console.error("Error in useMarketplaceListings:", error);
        throw error;
      }
    }
  });
};

export const useMarketplaceListing = (id: string) => {
  return useQuery({
    queryKey: ['marketplaceListing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) return null;

      // Cast the result to ensure compliance with our interface
      return {
        ...data,
        // Ensure required fields exist
        seller_role: (data.seller_role || 'owner') as 'owner' | 'dealer',
        seller_rating: data.seller_rating || 0,
        shop_images: data.shop_images || [],
        bill_images: data.bill_images || [],
        damage_images: data.damage_images || [],
        inspection_certificates: data.inspection_certificates || [],
        review_count: 0, // Fixed: Default to 0 for review_count
        search_rank: 0 // Add a default search_rank for regular listings
      } as MarketplaceListing;
    },
    enabled: !!id
  });
};
