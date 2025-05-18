
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingServiceProviders } from './PendingServiceProviders';
import { PendingMarketplaceListings } from './PendingMarketplaceListings';
import { PendingEvents } from './PendingEvents';
import SellerListingLimits from './SellerListingLimits';
import HighLimitSellers from './HighLimitSellers';
import CategoryManager from './CategoryManager';

const AdminPanelTabs = () => {
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
        <PendingServiceProviders />
      </TabsContent>
      
      <TabsContent value="marketplace" className="space-y-4">
        <PendingMarketplaceListings />
      </TabsContent>
      
      <TabsContent value="events" className="space-y-4">
        <PendingEvents />
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
