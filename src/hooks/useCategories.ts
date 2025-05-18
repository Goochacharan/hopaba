
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw new Error(error.message);
      return data as Category[];
    }
  });
};

export const useSubcategories = (categoryId?: string) => {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw new Error(error.message);
      return data as Subcategory[];
    },
    enabled: !!categoryId
  });
};

export const useAllSubcategories = () => {
  return useQuery({
    queryKey: ['all-subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*, categories!inner(name)')
        .order('name');
      
      if (error) throw new Error(error.message);
      return data;
    }
  });
};
