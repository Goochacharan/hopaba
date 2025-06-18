
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { SellerReview } from '@/hooks/useSellerDetails';
import MarketplaceListingCard from '@/components/MarketplaceListingCard';
import SellerReviews from './SellerReviews';
import SellerShopImages from './SellerShopImages';

interface SellerDetailsTabsProps {
  sellerId: string;
  sellerName: string;
  listings: MarketplaceListing[];
  reviews: SellerReview[];
  onAddReview: (review: { rating: number; comment: string }) => Promise<void>;
  onEditReview: (reviewId: string, review: { rating: number; comment: string }) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  isSubmittingReview: boolean;
}

const SellerDetailsTabs: React.FC<SellerDetailsTabsProps> = ({
  sellerId,
  sellerName,
  listings,
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  isSubmittingReview
}) => {
  const allShopImages = listings.reduce((images: string[], listing) => {
    if (listing.shop_images && Array.isArray(listing.shop_images) && listing.shop_images.length > 0) {
      return [...images, ...listing.shop_images];
    }
    return images;
  }, []);

  return (
    <Tabs defaultValue="listings" className="w-full">
      <TabsList className="w-full bg-background border-b mb-6 flex h-9 overflow-x-auto no-scrollbar">
        <TabsTrigger 
          value="listings" 
          className="flex-1 text-sm px-3 py-1.5 h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
        >
          Listings ({listings.length})
        </TabsTrigger>
        <TabsTrigger 
          value="reviews" 
          className="flex-1 text-sm px-3 py-1.5 h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
        >
          Reviews ({reviews.length})
        </TabsTrigger>
        <TabsTrigger 
          value="shop" 
          className="flex-1 text-sm px-3 py-1.5 h-9 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
        >
          Shop ({allShopImages.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="listings" className="w-full">
        {listings.length > 0 ? (
          <div className="w-full space-y-6">
            {listings.map(listing => (
              <MarketplaceListingCard key={listing.id} listing={listing} className="w-full" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">This seller has no active listings.</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="reviews" className="w-full">
        <SellerReviews 
          sellerId={sellerId} 
          sellerName={sellerName} 
          reviews={reviews} 
          onAddReview={onAddReview}
          onEditReview={onEditReview}
          onDeleteReview={onDeleteReview}
          isSubmitting={isSubmittingReview}
        />
      </TabsContent>
      
      <TabsContent value="shop" className="w-full">
        <SellerShopImages images={allShopImages} />
      </TabsContent>
    </Tabs>
  );
};

export default SellerDetailsTabs;

