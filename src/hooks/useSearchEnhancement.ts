
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserLocation } from '@/lib/locationUtils';

export const useSearchEnhancement = () => {
  const [enhancing, setEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceQuery = async (query: string, includeNearMe: boolean = true): Promise<string> => {
    if (!query) return '';
    
    setEnhancing(true);
    setError(null);
    
    try {
      let userCoordinates = null;
      
      if (includeNearMe) {
        userCoordinates = await getUserLocation();
      }
      
      const { data, error } = await supabase.functions.invoke('enhance-search', {
        body: {
          query,
          nearMe: includeNearMe,
          userLocation: userCoordinates
        }
      });
      
      if (error) {
        console.error('Error enhancing search query:', error);
        setError('Failed to enhance search query');
        return query;
      }
      
      if (data?.enhanced) {
        console.log('Search query enhanced:', data.enhanced);
        return data.enhanced;
      }
      
      return query;
    } catch (err) {
      console.error('Exception while enhancing search query:', err);
      setError('Failed to enhance search query');
      return query;
    } finally {
      setEnhancing(false);
    }
  };
  
  const searchWithLocation = async (
    query: string, 
    categoryFilter: string = 'all',
    postalCode: string = ''
  ) => {
    setEnhancing(true);
    setError(null);
    
    try {
      // First try to get user's location
      const userCoordinates = await getUserLocation();
      
      console.log('Performing location-based search with query:', query, 'category:', categoryFilter, 'postalCode:', postalCode);
      
      const { data, error } = await supabase.functions.invoke('enhanced-search-with-location', {
        body: {
          searchQuery: query,
          categoryFilter,
          userLat: userCoordinates?.lat,
          userLng: userCoordinates?.lng,
          postalCode: postalCode
        }
      });
      
      if (error) {
        console.error('Error performing location-based search:', error);
        setError('Failed to perform location-based search');
        return { providers: [], userLocation: null };
      }
      
      console.log('Search results:', data?.providers?.length || 0, 'results found');
      
      return {
        providers: data.providers || [],
        userLocation: data.userLocation
      };
    } catch (err) {
      console.error('Exception during location-based search:', err);
      setError('Failed to perform location-based search');
      return { providers: [], userLocation: null };
    } finally {
      setEnhancing(false);
    }
  };

  return {
    enhanceQuery,
    searchWithLocation,
    enhancing,
    error
  };
};

export default useSearchEnhancement;
