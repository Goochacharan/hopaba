
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Language {
  id: string;
  name: string;
  code: string;
}

export const useLanguages = () => {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      console.log('Fetching languages...');
      
      const { data, error } = await supabase
        .from('languages')
        .select('id, name, code')
        .order('name');
      
      if (error) {
        console.error('Error fetching languages:', error);
        throw error;
      }
      
      console.log('Languages fetched:', data);
      return data as Language[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - languages don't change often
  });
};
