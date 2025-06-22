
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBusinessLanguages = (businessId: string) => {
  return useQuery({
    queryKey: ['business-languages', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      
      // First try to get languages from business_languages table (new approach)
      const { data: businessLanguagesData, error: businessLanguagesError } = await supabase
        .from('business_languages')
        .select(`
          language_id,
          languages (
            id,
            name,
            code
          )
        `)
        .eq('business_id', businessId);
      
      if (!businessLanguagesError && businessLanguagesData && businessLanguagesData.length > 0) {
        console.log('Found languages in business_languages table:', businessLanguagesData);
        return businessLanguagesData?.map(item => item.languages).filter(Boolean) || [];
      }
      
      // Fallback to service_providers.languages array (legacy approach)
      console.log('Falling back to service_providers.languages array');
      const { data: serviceProviderData, error: serviceProviderError } = await supabase
        .from('service_providers')
        .select('languages')
        .eq('id', businessId)
        .single();
      
      if (serviceProviderError) {
        console.error('Error fetching service provider languages:', serviceProviderError);
        return [];
      }
      
      if (serviceProviderData?.languages && serviceProviderData.languages.length > 0) {
        // Check if the stored values are UUIDs (language IDs) or plain text (language names)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const firstValue = serviceProviderData.languages[0];
        
        if (uuidPattern.test(firstValue)) {
          // Values are UUIDs (language IDs), fetch the corresponding language names
          console.log('Detected language IDs, fetching language names from languages table');
          const { data: languageObjects, error: languageObjectsError } = await supabase
            .from('languages')
            .select('id, name, code')
            .in('id', serviceProviderData.languages);
          
          if (languageObjectsError) {
            console.error('Error fetching language objects by IDs:', languageObjectsError);
            return [];
          }
          
          return languageObjects || [];
        } else {
          // Values are plain text (language names), convert to language objects
          console.log('Detected language names, converting to language objects');
          const { data: languageObjects, error: languageObjectsError } = await supabase
            .from('languages')
            .select('id, name, code')
            .in('name', serviceProviderData.languages);
          
          if (languageObjectsError) {
            console.error('Error fetching language objects by names:', languageObjectsError);
            // Return simple objects with just names for backward compatibility
            return serviceProviderData.languages.map((name: string) => ({ id: name, name, code: '' }));
          }
          
          return languageObjects || [];
        }
      }
      
      return [];
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes - languages don't change often
  });
};

// Helper hook to get languages for any service provider
export const useServiceProviderLanguages = (providerId: string) => {
  return useQuery({
    queryKey: ['service-provider-languages', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      
      // Try business_languages table first
      const { data: businessLanguagesData, error: businessLanguagesError } = await supabase
        .from('business_languages')
        .select(`
          language_id,
          languages (
            id,
            name,
            code
          )
        `)
        .eq('business_id', providerId);
      
      if (!businessLanguagesError && businessLanguagesData && businessLanguagesData.length > 0) {
        return businessLanguagesData?.map(item => item.languages).filter(Boolean) || [];
      }
      
      // Fallback to service_providers.languages array
      const { data: serviceProviderData, error: serviceProviderError } = await supabase
        .from('service_providers')
        .select('languages')
        .eq('id', providerId)
        .single();
      
      if (serviceProviderError || !serviceProviderData?.languages) {
        return [];
      }

      // Check if the stored values are UUIDs (language IDs) or plain text (language names)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const firstValue = serviceProviderData.languages[0];
      
      if (uuidPattern.test(firstValue)) {
        // Values are UUIDs (language IDs), fetch the corresponding language names
        const { data: languageObjects, error: languageObjectsError } = await supabase
          .from('languages')
          .select('id, name, code')
          .in('id', serviceProviderData.languages);
        
        if (languageObjectsError) {
          console.error('Error fetching language objects by IDs:', languageObjectsError);
          return [];
        }
        
        return languageObjects || [];
      } else {
        // Values are plain text (language names), convert to objects for backward compatibility
        return serviceProviderData.languages.map((name: string) => ({ 
          id: name, 
          name, 
          code: '' 
        }));
      }
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  });
};
