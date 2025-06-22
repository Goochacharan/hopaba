
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReviewCriterion } from '@/types/reviewTypes';

const CategoryReviewCriteria = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [newCriterion, setNewCriterion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Fetch from all three sources to get comprehensive category list
        const [categoriesData, serviceProvidersData, marketplaceData] = await Promise.all([
          supabase.from('categories').select('name').order('name'),
          supabase.from('service_providers').select('category').eq('approval_status', 'approved'),
          supabase.from('marketplace_listings').select('category').eq('approval_status', 'approved')
        ]);

        // Collect all categories and deduplicate
        const allCategories = new Set<string>();

        // Add categories from categories table
        if (categoriesData.data) {
          categoriesData.data.forEach(item => {
            if (item.name) allCategories.add(item.name);
          });
        }

        // Add categories from service providers
        if (serviceProvidersData.data) {
          serviceProvidersData.data.forEach(item => {
            if (item.category) allCategories.add(item.category);
          });
        }

        // Add categories from marketplace listings
        if (marketplaceData.data) {
          marketplaceData.data.forEach(item => {
            if (item.category) allCategories.add(item.category);
          });
        }

        // Convert to sorted array
        const uniqueCategories = Array.from(allCategories).sort();
        setCategories(uniqueCategories);
        
        if (uniqueCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(uniqueCategories[0]);
        }

        if (categoriesData.error) console.error('Error fetching categories:', categoriesData.error);
        if (serviceProvidersData.error) console.error('Error fetching service provider categories:', serviceProvidersData.error);
        if (marketplaceData.error) console.error('Error fetching marketplace categories:', marketplaceData.error);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;
    
    const fetchCriteria = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('review_criteria')
          .select('*')
          .eq('category', selectedCategory)
          .order('name');
          
        if (error) throw error;
        
        setCriteria(data || []);
      } catch (err: any) {
        console.error('Error fetching criteria:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCriteria();
  }, [selectedCategory]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleAddCriterion = async () => {
    if (!newCriterion.trim() || !selectedCategory) {
      toast({
        title: "Validation Error",
        description: "Please enter a criterion name and select a category",
        variant: "destructive",
      });
      return;
    }

    const formattedName = newCriterion
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_criteria')
        .insert([{ 
          name: formattedName,
          category: selectedCategory 
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      setCriteria([...criteria, data as ReviewCriterion]);
      setNewCriterion('');
      
      toast({
        title: "Criterion Added",
        description: `"${formattedName}" added to ${selectedCategory} category.`,
      });
    } catch (err: any) {
      console.error('Error adding criterion:', err);
      toast({
        title: "Error",
        description: `Failed to add criterion: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCriterion = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('review_criteria')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setCriteria(criteria.filter(item => item.id !== id));
      
      toast({
        title: "Criterion Deleted",
        description: `"${name}" removed from ${selectedCategory} category.`,
      });
    } catch (err: any) {
      console.error('Error deleting criterion:', err);
      toast({
        title: "Error",
        description: `Failed to delete criterion: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Category Review Criteria</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="category" className="font-medium text-sm">Select Category:</label>
          <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            disabled={loading || categories.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <>
            <div className="border rounded-md p-4 bg-background space-y-4">
              <h3 className="font-medium">Review Criteria for {selectedCategory}</h3>
              
              <div className="flex space-x-2">
                <Input
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="Add new criterion (e.g., Hygiene, Ambiance)..."
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  onClick={handleAddCriterion}
                  disabled={loading || !newCriterion.trim()}
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                {criteria.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No criteria defined for this category yet.
                  </p>
                ) : (
                  criteria.map(criterion => (
                    <div key={criterion.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <span>{criterion.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCriterion(criterion.id, criterion.name)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryReviewCriteria;
