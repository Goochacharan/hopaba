
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, useSubcategories } from '@/hooks/useCategories';
import { CATEGORIES } from '@/constants/businessConstants';
import { getCategoriesWithCustom, addCustomCategory } from '@/utils/businessFormUtils';

export const useCategoryManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  const { data: dbCategories, isLoading: loadingCategories } = useCategories();
  const { data: subcategories, isLoading: loadingSubcategories } = useSubcategories(selectedCategoryId);

  useEffect(() => {
    const allCategories = [...CATEGORIES, ...getCategoriesWithCustom()];
    const uniqueCategories = Array.from(new Set(allCategories)).sort();
    setCategories(uniqueCategories);
  }, []);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = addCustomCategory(newCategory);
      setCategories([...CATEGORIES, ...updatedCategories].sort());
      
      setNewCategory("");
      setShowAddCategoryDialog(false);
      
      toast({
        title: "Category Added",
        description: `${newCategory} has been added to the categories list.`
      });
    } else if (categories.includes(newCategory)) {
      toast({
        title: "Category Exists",
        description: "This category already exists in the list.",
        variant: "destructive"
      });
    }
  };

  const handleAddSubcategory = async () => {
    if (!selectedCategoryId) {
      toast({
        title: "No category selected",
        description: "Please select a category first before adding a subcategory.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSubcategory) {
      toast({
        title: "Subcategory name required",
        description: "Please enter a name for the subcategory.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subcategories')
        .insert([
          { 
            name: newSubcategory, 
            category_id: selectedCategoryId 
          }
        ]);
        
      if (error) throw error;
      
      setNewSubcategory("");
      setShowAddSubcategoryDialog(false);
      
      toast({
        title: "Subcategory Added",
        description: `${newSubcategory} has been added to the selected category.`
      });
    } catch (error: any) {
      toast({
        title: "Error adding subcategory",
        description: error.message || "Failed to add subcategory.",
        variant: "destructive",
      });
    }
  };

  return {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    dbCategories,
    loadingCategories,
    subcategories,
    loadingSubcategories,
    showAddCategoryDialog,
    setShowAddCategoryDialog,
    showAddSubcategoryDialog,
    setShowAddSubcategoryDialog,
    newCategory,
    setNewCategory,
    newSubcategory,
    setNewSubcategory,
    handleAddCategory,
    handleAddSubcategory
  };
};
