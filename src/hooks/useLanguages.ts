
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLanguages = () => {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour - languages don't change often
  });
};
