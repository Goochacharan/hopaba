import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingServiceProviders } from './PendingServiceProviders';
import { PendingMarketplaceListings } from './PendingMarketplaceListings';
import { PendingEvents } from './PendingEvents';
import SellerListingLimits from './SellerListingLimits';
import HighLimitSellers from './HighLimitSellers';
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
  // Use the hook to get all the required data and functions for the pending items components
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

  // Handler functions for approving/rejecting different types of content
  const handleApproveService = (id: string) => {
    updateApprovalStatus('services', id, 'approved');
  };

  const handleRejectService = (id: string) => {
    updateApprovalStatus('services', id, 'rejected');
  };

  const handleApproveMarketplaceListing = (id: string) => {
    updateApprovalStatus('marketplace', id, 'approved');
  };

  const handleRejectMarketplaceListing = (id: string) => {
    updateApprovalStatus('marketplace', id, 'rejected');
  };

  const handleApproveEvent = (id: string) => {
    updateApprovalStatus('events', id, 'approved');
  };

  const handleRejectEvent = (id: string) => {
    updateApprovalStatus('events', id, 'rejected');
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
      <TabsList className="grid grid-cols-3 md:grid-cols-6">
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="seller_limits">Seller Limits</TabsTrigger>
        <TabsTrigger value="high_limit_sellers">High Limit Sellers</TabsTrigger>
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
      
      <TabsContent value="marketplace" className="space-y-4">
        <PendingMarketplaceListings 
          listings={pendingListings.marketplace}
          loading={loading}
          error={error}
          onApprove={handleApproveMarketplaceListing}
          onReject={handleRejectMarketplaceListing}
          onRefresh={refreshListings}
        />
      </TabsContent>
      
      <TabsContent value="events" className="space-y-4">
        <PendingEvents 
          events={pendingListings.events}
          loading={loading}
          error={error}
          onApprove={handleApproveEvent}
          onReject={handleRejectEvent}
          onRefresh={refreshListings}
        />
      </TabsContent>
      
      <TabsContent value="seller_limits" className="space-y-4">
        <SellerListingLimits />
      </TabsContent>
      
      <TabsContent value="high_limit_sellers" className="space-y-4">
        <HighLimitSellers />
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
