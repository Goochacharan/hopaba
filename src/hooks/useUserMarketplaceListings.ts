
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { useAuth } from '@/hooks/useAuth';

interface ListingStatus {
  currentListingCount: number;
  maxListings: number;
  canCreateListing: boolean;
}

export const useUserMarketplaceListings = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingStatus, setListingStatus] = useState<ListingStatus | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchListingStatus = async () => {
    if (!user) return;

    try {
      // First check if the user has an entry in the seller_listing_limits table
      const { data: limitData, error: limitError } = await supabase
        .from('seller_listing_limits')
        .select('max_listings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (limitError && !limitError.message.includes('No rows found')) {
        throw limitError;
      }
      
      // If no entry in seller_listing_limits, fall back to sellers table
      let maxListings = limitData?.max_listings;
      
      if (maxListings === undefined) {
        // Check if the user exists in the sellers table
        const { data: sellerData, error: sellerError } = await supabase
          .from('sellers')
          .select('listing_limit')
          .eq('seller_id', user.id)
          .maybeSingle();
          
        if (sellerError && !sellerError.message.includes('No rows found')) {
          throw sellerError;
        }
        
        // Use the seller's limit or default to 5
        maxListings = sellerData?.listing_limit || 5;
      }

      // Create an entry in seller_listing_limits if one doesn't exist
      if (limitData === null) {
        await supabase
          .from('seller_listing_limits')
          .upsert({
            user_id: user.id,
            max_listings: maxListings
          })
          .eq('user_id', user.id);
      }

      // Get the current listings count
      const listingCount = listings.length;
      
      setListingStatus({
        currentListingCount: listingCount,
        maxListings: maxListings,
        canCreateListing: listingCount < maxListings
      });
    } catch (err: any) {
      console.error('Error fetching listing status:', err);
      setError('Failed to fetch listing status');
    }
  };

  const fetchUserListings = async () => {
    setLoading(true);
    setError(null);

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Ensure the data conforms to the MarketplaceListing type
      const typedData = data?.map(item => ({
        ...item,
        approval_status: item.approval_status as 'approved' | 'pending' | 'rejected'
      })) as MarketplaceListing[];

      setListings(typedData || []);
      
      // Fetch updated listing status after getting listings
      await fetchListingStatus();
    } catch (err: any) {
      console.error('Error fetching user marketplace listings:', err);
      setError('Failed to fetch your listings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Listing deleted",
        description: "Your listing has been successfully deleted.",
      });

      // Refresh listings and status
      await fetchUserListings();
    } catch (err: any) {
      console.error('Error deleting marketplace listing:', err);
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserListings();
  }, [user]);

  return { 
    listings, 
    loading, 
    error, 
    refetch: fetchUserListings,
    deleteListing,
    listingStatus
  };
};

export default useUserMarketplaceListings;
