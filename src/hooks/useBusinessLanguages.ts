
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBusinessLanguages = (businessId: string) => {
  return useQuery({
    queryKey: ['business-languages', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error fetching business languages:', error);
        throw error;
      }
      
      return data?.map(item => item.languages).filter(Boolean) || [];
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes - languages don't change often
  });
};
