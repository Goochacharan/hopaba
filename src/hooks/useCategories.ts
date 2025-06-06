import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

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
  const queryClient = useQueryClient();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  // Use the same query name to keep compatibility with other components
  const categoriesQuery = useQuery({
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

  const getSubcategoriesByCategoryName = async (categoryName: string) => {
    setLoadingSubcategories(true);
    
    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId) {
      setLoadingSubcategories(false);
      setSubcategories([]);
      return;
    }

    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    
    setLoadingSubcategories(false);
    
    if (error) {
      console.error("Error fetching subcategories:", error);
      return;
    }
    
    setSubcategories(data as Subcategory[]);
  };

  const getCategoryIdByName = (categoryName: string): string | null => {
    if (!categoriesQuery.data) return null;
    
    const category = categoriesQuery.data.find(cat => cat.name === categoryName);
    return category ? category.id : null;
  };

  // To support both patterns of API usage, we'll return both the raw query result
  // and the specific properties that some components are expecting
  return {
    // Pattern 1: Properties expected by existing code
    dbCategories: categoriesQuery.data || [],
    loadingCategories: categoriesQuery.isLoading,
    subcategories,
    loadingSubcategories,
    getSubcategoriesByCategoryName,
    getCategoryIdByName,
    
    // Pattern 2: Raw query result expected by components using react-query pattern
    data: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    refetch: categoriesQuery.refetch
  };
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
