
import React from 'react';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import MarketplaceListingCard from '@/components/MarketplaceListingCard';
import { cn } from '@/lib/utils';
import { Loader2, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import NoResultsMessage from '../search/NoResultsMessage';
import { useInView } from 'react-intersection-observer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MarketplaceItemsListProps {
  listings: MarketplaceListing[];
  loading?: boolean;
  error?: string | null;
  category?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const MarketplaceItemsList: React.FC<MarketplaceItemsListProps> = ({
  listings,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore
}) => {
  const { user } = useAuth();
  const { ref, inView } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasMore && onLoadMore) {
        onLoadMore();
      }
    }
  });

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!loading && listings.length === 0) {
    return <NoResultsMessage type="marketplace" />;
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] px-1">
      <div className="space-y-4 pb-24">
        {listings.some(l => l.approval_status === 'pending' && user && l.seller_id === user.id) && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Some of your listings are pending admin approval and are only visible to you.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <div 
              key={listing.id} 
              className="animate-fade-in relative" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {user && listing.seller_id === user.id && listing.approval_status === 'pending' && (
                <Badge variant="outline" className="absolute top-2 right-2 z-10 bg-yellow-100 text-yellow-800 border-yellow-300">
                  Pending Approval
                </Badge>
              )}
              <MarketplaceListingCard 
                listing={listing}
                className={cn(
                  "h-full flex flex-col",
                  "search-result-card",
                  listing.approval_status === 'pending' ? "opacity-75" : ""
                )}
              />
            </div>
          ))}
        </div>

        {(loading || hasMore) && (
          <div ref={ref} className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MarketplaceItemsList;
