
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from './useMarketplaceListings';

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

interface PendingListingsState {
  marketplace: MarketplaceListing[];
  services: ServiceProvider[];
  events: Event[];
}

const defaultState: PendingListingsState = {
  marketplace: [],
  services: [],
  events: []
};

export const usePendingListings = () => {
  const [pendingListings, setPendingListings] = useState<PendingListingsState>(defaultState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use Promise.allSettled to prevent one failed query from stopping the others
      const [marketplaceResult, servicesResult, eventsResult] = await Promise.allSettled([
        // Fetch pending marketplace listings
        supabase
          .from('marketplace_listings')
          .select('*')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
          
        // Fetch pending service providers
        supabase
          .from('service_providers')
          .select('id, name, category, created_at')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false }),
          
        // Fetch pending events
        supabase
          .from('events')
          .select('id, title, category, created_at')
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
          marketplaceData = data || [];
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
          eventsData = data || [];
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

  // Fetch listings on initial load
  useEffect(() => {
    fetchPendingListings();
  }, [fetchPendingListings]);

  // Return the data along with loading state, error state, and a refetch function
  return { 
    pendingListings, 
    loading, 
    error,
    refetch: fetchPendingListings
  };
};
