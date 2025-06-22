
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingServiceProviders } from './PendingServiceProviders';
import CategoryManager from './CategoryManager';
import { usePendingListings } from '@/hooks/usePendingListings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const AdminPanelTabs = () => {
  // Use the hook to get data for services
  const { 
    pendingListings, 
    loading, 
    error, 
    refreshListings, 
    updateApprovalStatus 
  } = usePendingListings();

  const { toast } = useToast();
  const { data: categories, refetch: refetchCategories } = useCategories();
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newSubcategory, setNewSubcategory] = useState("");

  // Handler functions for approving/rejecting services
  const handleApproveService = (id: string) => {
    updateApprovalStatus('services', id, 'approved');
  };

  const handleRejectService = (id: string) => {
    updateApprovalStatus('services', id, 'rejected');
  };
  
  const handleAddSubcategory = async () => {
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Please select a category first",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSubcategory) {
      toast({
        title: "Error",
        description: "Please enter a subcategory name",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('subcategories')
        .insert([
          { name: newSubcategory, category_id: selectedCategoryId }
        ]);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subcategory added successfully"
      });
      
      setNewSubcategory("");
      setSelectedCategoryId("");
      setShowAddSubcategory(false);
      refetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add subcategory",
        variant: "destructive"
      });
    }
  };

  return (
    <Tabs defaultValue="services" className="w-full space-y-6">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      
      <TabsContent value="services" className="space-y-4">
        <PendingServiceProviders 
          services={pendingListings.services}
          loading={loading}
          error={error}
          onApprove={handleApproveService}
          onReject={handleRejectService}
          onRefresh={refreshListings}
        />
      </TabsContent>

      <TabsContent value="categories" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Manage Categories</CardTitle>
            <Button onClick={() => setShowAddSubcategory(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Subcategory
            </Button>
          </CardHeader>
          <CardContent>
            <CategoryManager />
          </CardContent>
        </Card>
      </TabsContent>
      
      <AlertDialog open={showAddSubcategory} onOpenChange={setShowAddSubcategory}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Select a category and enter the name for the new subcategory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">Category</label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="subcategory" className="text-sm font-medium">Subcategory Name</label>
              <Input
                id="subcategory"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="Enter subcategory name"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddSubcategory}>Add Subcategory</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
};

// Export both as default and named export to support both import styles
export default AdminPanelTabs;
export { AdminPanelTabs };
