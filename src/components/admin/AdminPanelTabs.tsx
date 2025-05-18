
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingServiceProviders } from './PendingServiceProviders';
import { PendingMarketplaceListings } from './PendingMarketplaceListings';
import { PendingEvents } from './PendingEvents';
import SellerListingLimits from './SellerListingLimits';
import HighLimitSellers from './HighLimitSellers';
import CategoryManager from './CategoryManager';
import { usePendingListings } from '@/hooks/usePendingListings';

const AdminPanelTabs = () => {
  // Use the hook to get all the required data and functions for the pending items components
  const { 
    pendingListings, 
    loading, 
    error, 
    refreshListings, 
    updateApprovalStatus 
  } = usePendingListings();

  // Add active tab state to persist between renders
  const [activeTab, setActiveTab] = useState("services");

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

  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab} 
      onValueChange={setActiveTab} 
      className="w-full space-y-6"
    >
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
        <CategoryManager />
      </TabsContent>
    </Tabs>
  );
};

// Export both as default and named export to support both import styles
export default AdminPanelTabs;
export { AdminPanelTabs };
