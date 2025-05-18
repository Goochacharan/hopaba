
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCategories, useAllSubcategories, Category, Subcategory } from '@/hooks/useCategories';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const categorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters" })
});

const subcategorySchema = z.object({
  name: z.string().min(2, { message: "Subcategory name must be at least 2 characters" }),
  categoryId: z.string().uuid({ message: "Please select a parent category" })
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

export default function CategoryManager() {
  const { toast } = useToast();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading, refetch: refetchSubcategories } = useAllSubcategories();

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: ''
    }
  });

  const subcategoryForm = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: '',
      categoryId: ''
    }
  });

  const handleAddCategory = async (data: CategoryFormValues) => {
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({ name: data.name, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id);
          
        if (error) throw error;
        toast({ title: "Category updated successfully" });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{ name: data.name }]);
          
        if (error) throw error;
        toast({ title: "Category added successfully" });
      }
      
      categoryForm.reset();
      setIsAddingCategory(false);
      setEditingCategory(null);
      refetchCategories();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save category", 
        variant: "destructive" 
      });
    }
  };

  const handleAddSubcategory = async (data: SubcategoryFormValues) => {
    try {
      if (editingSubcategory) {
        // Update existing subcategory
        const { error } = await supabase
          .from('subcategories')
          .update({ 
            name: data.name, 
            category_id: data.categoryId,
            updated_at: new Date().toISOString() 
          })
          .eq('id', editingSubcategory.id);
          
        if (error) throw error;
        toast({ title: "Subcategory updated successfully" });
      } else {
        // Create new subcategory
        const { error } = await supabase
          .from('subcategories')
          .insert([{ 
            name: data.name, 
            category_id: data.categoryId 
          }]);
          
        if (error) throw error;
        toast({ title: "Subcategory added successfully" });
      }
      
      subcategoryForm.reset();
      setIsAddingSubcategory(false);
      setEditingSubcategory(null);
      refetchSubcategories();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save subcategory", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
        
      if (error) throw error;
      toast({ title: "Category deleted successfully" });
      refetchCategories();
      refetchSubcategories();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete category", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId);
        
      if (error) throw error;
      toast({ title: "Subcategory deleted successfully" });
      refetchSubcategories();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete subcategory", 
        variant: "destructive" 
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsAddingCategory(true);
    categoryForm.setValue('name', category.name);
  };

  const handleEditSubcategory = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setIsAddingSubcategory(true);
    subcategoryForm.setValue('name', subcategory.name);
    subcategoryForm.setValue('categoryId', subcategory.category_id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
        <CardDescription>Manage categories and subcategories for business listings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            {isAddingCategory ? (
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(handleAddCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit">{editingCategory ? 'Update' : 'Add'} Category</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingCategory(false);
                        setEditingCategory(null);
                        categoryForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Button onClick={() => setIsAddingCategory(true)} className="mb-4">
                <Plus className="mr-2 h-4 w-4" /> Add New Category
              </Button>
            )}

            {categoriesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories && categories.length > 0 ? (
                  categories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the category and all its subcategories. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground p-4">No categories found</p>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="subcategories" className="space-y-4">
            {isAddingSubcategory ? (
              <Form {...subcategoryForm}>
                <form onSubmit={subcategoryForm.handleSubmit(handleAddSubcategory)} className="space-y-4">
                  <FormField
                    control={subcategoryForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={subcategoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Subcategory name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button type="submit">{editingSubcategory ? 'Update' : 'Add'} Subcategory</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddingSubcategory(false);
                        setEditingSubcategory(null);
                        subcategoryForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Button onClick={() => setIsAddingSubcategory(true)} className="mb-4">
                <Plus className="mr-2 h-4 w-4" /> Add New Subcategory
              </Button>
            )}

            {subcategoriesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {categories?.map(category => {
                  const categorySubcategories = subcategories?.filter(
                    (sub: any) => sub.category_id === category.id
                  );
                  
                  if (!categorySubcategories || categorySubcategories.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      <h4 className="text-sm font-semibold">{category.name}</h4>
                      {categorySubcategories.map((subcategory: any) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-2 pl-4 bg-muted/20 rounded-md">
                          <span>{subcategory.name}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSubcategory(subcategory)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the subcategory. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubcategory(subcategory.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                
                {(!subcategories || subcategories.length === 0) && (
                  <p className="text-center text-muted-foreground p-4">No subcategories found</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
