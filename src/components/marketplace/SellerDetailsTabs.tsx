
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketplaceListingCard from './MarketplaceListingCard';
import SellerReviews from './SellerReviews';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { SellerReview } from '@/hooks/useSellerDetails';
import { Package, Star } from 'lucide-react';

interface SellerDetailsTabsProps {
  sellerId: string;
  sellerName: string;
  listings: MarketplaceListing[];
  reviews: SellerReview[];
  onAddReview?: (review: { rating: number; comment: string }) => Promise<void>;
  onEditReview?: (reviewId: string, review: { rating: number; comment: string }) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  isSubmittingReview?: boolean;
  location?: string;
  mapLink?: string | null;
  latitude?: number;
  longitude?: number;
}

const SellerDetailsTabs: React.FC<SellerDetailsTabsProps> = ({
  sellerId,
  sellerName,
  listings,
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  isSubmittingReview,
  location,
  mapLink,
  latitude,
  longitude
}) => {
  return (
    <Tabs defaultValue="listings" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="listings" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Listings ({listings.length})
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Reviews ({reviews.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listings">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <MarketplaceListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active listings from this seller</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews">
        <SellerReviews
          sellerId={sellerId}
          sellerName={sellerName}
          reviews={reviews}
          onAddReview={onAddReview}
          onEditReview={onEditReview}
          onDeleteReview={onDeleteReview}
          isSubmitting={isSubmittingReview}
          location={location}
          mapLink={mapLink}
          latitude={latitude}
          longitude={longitude}
        />
      </TabsContent>
    </Tabs>
  );
};

export default SellerDetailsTabs;
