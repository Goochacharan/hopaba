
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingMarketplaceListings } from './PendingMarketplaceListings';
import { PendingServiceProviders } from './PendingServiceProviders';
import { PendingEvents } from './PendingEvents';
import { usePendingListings } from '@/hooks/usePendingListings';

export const AdminPanelTabs = () => {
  const { pendingListings, loading, error, updateApprovalStatus, refetch } = usePendingListings();
  
  const totalPending = 
    pendingListings.marketplace.length + 
    pendingListings.services.length + 
    pendingListings.events.length;

  return (
    <Tabs defaultValue="marketplace" className="w-full">
      <TabsList className="grid grid-cols-3 mb-8">
        <TabsTrigger value="marketplace" className="relative">
          Marketplace
          {pendingListings.marketplace.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingListings.marketplace.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="services" className="relative">
          Services
          {pendingListings.services.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingListings.services.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="events" className="relative">
          Events
          {pendingListings.events.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingListings.events.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="marketplace">
        <PendingMarketplaceListings 
          listings={pendingListings.marketplace}
          loading={loading}
          error={error}
          onApprove={(id) => updateApprovalStatus('marketplace', id, 'approved')}
          onReject={(id) => updateApprovalStatus('marketplace', id, 'rejected')}
          onRefresh={refetch}
        />
      </TabsContent>
      
      <TabsContent value="services">
        <PendingServiceProviders 
          services={pendingListings.services}
          loading={loading}
          error={error}
          onApprove={(id) => updateApprovalStatus('services', id, 'approved')}
          onReject={(id) => updateApprovalStatus('services', id, 'rejected')}
          onRefresh={refetch}
        />
      </TabsContent>
      
      <TabsContent value="events">
        <PendingEvents 
          events={pendingListings.events}
          loading={loading}
          error={error}
          onApprove={(id) => updateApprovalStatus('events', id, 'approved')}
          onReject={(id) => updateApprovalStatus('events', id, 'rejected')}
          onRefresh={refetch}
        />
      </TabsContent>
    </Tabs>
  );
};
