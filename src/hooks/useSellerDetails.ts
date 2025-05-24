
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';

export interface SellerReview {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_id?: string;
  created_at: string;
}

export interface SellerDetails {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  listings: MarketplaceListing[];
  reviews: SellerReview[];
}

export const useSellerDetails = (sellerId: string) => {
  const [sellerDetails, setSellerDetails] = useState<SellerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSellerDetails = useCallback(async () => {
    console.log("Fetching seller details for ID:", sellerId);
    setLoading(true);
    setError(null);

    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('seller_reviews')
        .select('id, rating, comment, reviewer_name, reviewer_id, created_at')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        // Continue even if reviews fail to load
      }

      // Process listings to ensure they match our MarketplaceListing interface
      const listings = (listingsData || []).map(item => ({
        ...item,
        seller_role: (item.seller_role as string || 'owner') as 'owner' | 'dealer',
        seller_rating: item.seller_rating || 0,
        // Ensure shop_images is always an array
        shop_images: Array.isArray(item.shop_images) ? item.shop_images : [],
        // Add review_count if it doesn't exist
        review_count: 0
      })) as MarketplaceListing[];
      
      const sellerName = listings.length > 0 ? listings[0].seller_name : 'Unknown Seller';
      
      let sellerRating = 0;
      const reviews = reviewsData || [];
      console.log("Reviews data:", reviews);

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        sellerRating = totalRating / reviews.length;
      } else {
        sellerRating = listings.length > 0 && listings[0].seller_rating ? listings[0].seller_rating : 0;
      }

      if (reviews.length > 0) {
        const roundedRating = Math.round(sellerRating * 10) / 10;
        
        for (const listing of listings) {
          const { error: updateError } = await supabase
            .from('marketplace_listings')
            .update({ 
              seller_rating: roundedRating,
              review_count: reviews.length
            })
            .eq('seller_id', sellerId);
          
          if (updateError) {
            console.error('Error updating seller rating in listing:', updateError);
          } else {
            listing.seller_rating = roundedRating;
            listing.review_count = reviews.length;
          }
        }
      }

      setSellerDetails({
        id: sellerId,
        name: sellerName,
        rating: sellerRating,
        review_count: reviews.length,
        listings: listings,
        reviews: reviews as SellerReview[]
      });

    } catch (err: any) {
      console.error('Error fetching seller details:', err);
      setError('Failed to fetch seller details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  const refreshData = useCallback(() => {
    console.log("Refreshing seller data...");
    return fetchSellerDetails();
  }, [fetchSellerDetails]);

  useEffect(() => {
    fetchSellerDetails();
  }, [fetchSellerDetails]);

  return { sellerDetails, loading, error, refreshData };
};
