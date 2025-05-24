
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from './useMarketplaceListings';
import { useToast } from '@/hooks/use-toast';

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  created_at: string;
  area?: string;
  city?: string;
}

export interface Event {
  id: string;
  title: string;
  category?: string;
  date?: string;
  location?: string;
  created_at: string;
}

export interface PendingListingsState {
  marketplace: MarketplaceListing[];
  services: ServiceProvider[];
  events: Event[];
}

const defaultState: PendingListingsState = {
  marketplace: [],
  services: [],
  events: []
};

// Define database table names as constants
const TABLES = {
  MARKETPLACE: 'marketplace_listings',
  SERVICES: 'service_providers',
  EVENTS: 'events'
} as const;

type TableName = typeof TABLES[keyof typeof TABLES];

export const usePendingListings = () => {
  const [pendingListings, setPendingListings] = useState<PendingListingsState>(defaultState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.allSettled to prevent one failed query from stopping the others
      const [marketplaceResult, servicesResult, eventsResult] = await Promise.allSettled([
        // Fetch pending marketplace listings
        supabase
          .from(TABLES.MARKETPLACE)
          .select('*')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
          
        // Fetch pending service providers
        supabase
          .from(TABLES.SERVICES)
          .select('id, name, category, area, city, created_at')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
          
        // Fetch pending events
        supabase
          .from(TABLES.EVENTS)
          .select('id, title, date, location, created_at')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false })
      ]);

      // Initialize with empty arrays
      let marketplaceData: MarketplaceListing[] = [];
      let servicesData: ServiceProvider[] = [];
      let eventsData: Event[] = [];
      
      // Process marketplace results
      if (marketplaceResult.status === 'fulfilled') {
        const { data, error } = marketplaceResult.value;
        if (error) {
          console.error("Error fetching marketplace listings:", error);
        } else {
          // Cast the marketplace data to ensure it matches the MarketplaceListing type
          marketplaceData = (data || []).map(item => ({
            ...item,
            seller_role: (item.seller_role || 'owner') as 'owner' | 'dealer',
          })) as MarketplaceListing[];
        }
      }
      
      // Process services results
      if (servicesResult.status === 'fulfilled') {
        const { data, error } = servicesResult.value;
        if (error) {
          console.error("Error fetching service providers:", error);
        } else {
          servicesData = data || [];
        }
      }
      
      // Process events results
      if (eventsResult.status === 'fulfilled') {
        const { data, error } = eventsResult.value;
        if (error) {
          console.error("Error fetching events:", error);
        } else {
          // Create proper Event objects from the data
          eventsData = (data || []).map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            created_at: event.created_at,
            category: 'Events' // Providing a default category since it's missing in the query
          }));
        }
      }

      // Update state with the new data
      setPendingListings({
        marketplace: marketplaceData,
        services: servicesData,
        events: eventsData
      });
      
      // If all queries failed, set an error
      if (
        marketplaceResult.status === 'rejected' && 
        servicesResult.status === 'rejected' && 
        eventsResult.status === 'rejected'
      ) {
        setError('Failed to load pending content listings');
      }
      
    } catch (err) {
      console.error('Error in usePendingListings:', err);
      setError('Failed to load pending content listings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Implementation for updating approval status
  const updateApprovalStatus = useCallback(async (
    contentType: 'marketplace' | 'services' | 'events',
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      let table: TableName;
      
      // Map contentType to actual table names
      switch (contentType) {
        case 'marketplace':
          table = TABLES.MARKETPLACE;
          break;
        case 'services':
          table = TABLES.SERVICES;
          break;
        case 'events':
          table = TABLES.EVENTS;
          break;
        default:
          throw new Error(`Invalid content type: ${contentType}`);
      }
      
      const { error } = await supabase
        .from(table)
        .update({ approval_status: status })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: `${status === 'approved' ? 'Approved' : 'Rejected'} Successfully`,
        description: `The ${contentType.slice(0, -1)} has been ${status}.`,
      });
      
      // Refresh listings after update
      await fetchPendingListings();
      
      return true;
    } catch (err) {
      console.error(`Error updating ${contentType} approval status:`, err);
      toast({
        title: "Update Failed",
        description: `Failed to update the approval status. Please try again.`,
        variant: "destructive"
      });
      return false;
    }
  }, [fetchPendingListings, toast]);

  // Fetch listings on initial load
  useEffect(() => {
    fetchPendingListings();
  }, [fetchPendingListings]);

  // Return the data along with loading state, error state, and functions
  return { 
    pendingListings, 
    loading, 
    error,
    refetch: fetchPendingListings,
    updateApprovalStatus,
    refreshListings: fetchPendingListings  // Alias for refetch for backward compatibility
  };
};
