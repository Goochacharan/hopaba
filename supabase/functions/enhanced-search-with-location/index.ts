
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0;
  }
  
  const radlat1 = Math.PI * lat1 / 180;
  const radlat2 = Math.PI * lat2 / 180;
  const theta = lon1 - lon2;
  const radtheta = Math.PI * theta / 180;
  
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + 
             Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  
  if (dist > 1) {
    dist = 1;
  }
  
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515; // Distance in miles
  dist = dist * 1.609344;    // Convert to kilometers
  
  return Math.round(dist * 10) / 10; // Round to 1 decimal place
}

// Extract coordinates from a Google Maps link
function extractCoordinatesFromMapLink(mapLink: string | null): { lat: number, lng: number } | null {
  if (!mapLink) return null;
  
  try {
    // Match patterns like @12.9716,77.5946 or ?q=12.9716,77.5946
    const coordinatesRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)|q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = mapLink.match(coordinatesRegex);
    
    if (match) {
      // Check which pattern matched (@lat,lng or q=lat,lng)
      const lat = parseFloat(match[1] || match[3]);
      const lng = parseFloat(match[2] || match[4]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    console.log('Could not extract coordinates from map link:', mapLink);
    return null;
  } catch (error) {
    console.error('Error extracting coordinates from map link:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { searchQuery, categoryFilter, userLat, userLng, postalCode } = await req.json();
    
    console.log(`Processing search query: "${searchQuery}", category: "${categoryFilter}", postalCode: "${postalCode}"`);
    
    // First attempt to use the RPC function for enhanced search
    let enhancedProviders = [];
    try {
      const { data, error } = await supabase.rpc(
        'search_enhanced_providers',
        { search_query: searchQuery }
      );

      if (error) {
        console.error("Error using enhanced providers search:", error);
      } else {
        enhancedProviders = data || [];
        console.log(`Enhanced search returned ${enhancedProviders.length} results`);
      }
    } catch (err) {
      console.error("Failed to use enhanced providers search:", err);
    }
    
    // If enhanced search failed or returned no results, fall back to direct query
    if (enhancedProviders.length === 0) {
      console.log("Enhanced search returned no results, falling back to direct query");
      
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved');
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }
      
      if (categoryFilter && categoryFilter !== 'all') {
        const dbCategory = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
        query = query.eq('category', dbCategory);
      }
      
      // Add postal code filter if provided
      if (postalCode) {
        query = query.eq('postal_code', postalCode);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Direct query error:", error);
      } else if (data) {
        enhancedProviders = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          description: item.description,
          area: item.area,
          city: item.city,
          contact_phone: item.contact_phone,
          contact_email: item.contact_email,
          website: item.website,
          instagram: item.instagram,
          map_link: item.map_link,
          price_range_min: item.price_range_min,
          price_range_max: item.price_range_max,
          price_unit: item.price_unit,
          availability: item.availability,
          availability_days: item.availability_days,
          availability_start_time: item.availability_start_time,
          availability_end_time: item.availability_end_time,
          tags: item.tags,
          images: item.images,
          hours: item.hours,
          languages: item.languages,
          experience: item.experience,
          created_at: item.created_at,
          approval_status: item.approval_status,
          postal_code: item.postal_code,
          search_rank: 1.0 // Default search rank for direct query results
        }));
        console.log(`Direct query returned ${enhancedProviders.length} results`);
      }
    }

    // Filter by category if needed
    let filteredProviders = enhancedProviders;
    if (categoryFilter && categoryFilter !== 'all') {
      const dbCategory = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1);
      filteredProviders = filteredProviders.filter((provider: any) => 
        provider.category.toLowerCase() === dbCategory.toLowerCase()
      );
      console.log(`After category filtering: ${filteredProviders.length} results`);
    }
    
    // Filter by postal code if provided
    if (postalCode) {
      filteredProviders = filteredProviders.filter((provider: any) => 
        provider.postal_code === postalCode
      );
      console.log(`After postal code filtering: ${filteredProviders.length} results`);
    }
    
    // If user location is provided, calculate distances and sort
    if (userLat && userLng) {
      filteredProviders = filteredProviders.map((provider: any) => {
        // Extract coordinates from map_link
        const coordinates = extractCoordinatesFromMapLink(provider.map_link);
        let distance = null;
        
        if (coordinates) {
          distance = calculateDistance(
            userLat,
            userLng,
            coordinates.lat,
            coordinates.lng
          );
        }
        
        return {
          ...provider,
          calculatedDistance: distance,
          distance: distance !== null ? `${distance.toFixed(1)} km away` : null
        };
      });
      
      // Sort providers by distance if available, otherwise keep original ranking
      filteredProviders.sort((a: any, b: any) => {
        // If both have distances, sort by distance
        if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
          return a.calculatedDistance - b.calculatedDistance;
        }
        // If only one has distance, prioritize the one with distance
        if (a.calculatedDistance !== null) return -1;
        if (b.calculatedDistance !== null) return 1;
        // Otherwise sort by search rank (from the original query)
        return b.search_rank - a.search_rank;
      });
    }
    
    // Add random properties for enhanced UI display
    filteredProviders = filteredProviders.map((provider: any, index: number) => ({
      ...provider,
      isHiddenGem: provider.isHiddenGem || index % 3 === 0,
      isMustVisit: provider.isMustVisit || index % 5 === 0
    }));
    
    console.log(`Returning ${filteredProviders.length} final results`);
    
    return new Response(
      JSON.stringify({ 
        providers: filteredProviders,
        userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
