
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import NoResultsMessage from '@/components/search/NoResultsMessage';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import MarketplaceListingCard from '@/components/MarketplaceListingCard';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Category {
  id: string;
  name: string;
}

interface MarketplaceCategoryTabsProps {
  currentCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  paginatedListings: MarketplaceListing[];
  loading: boolean;
  error: Error | null;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  highlightedListingId: string;
  highlightedListingRef: React.RefObject<HTMLDivElement>;
}

const categoryColors = {
  'all': 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50',
  'cars': 'bg-blue-500 text-white',
  'bikes': 'bg-green-500 text-white',
  'mobiles': 'bg-purple-500 text-white',
  'electronics': 'bg-orange-500 text-white',
  'furniture': 'bg-pink-500 text-white',
  'home_appliances': 'bg-teal-500 text-white'
};

const MarketplaceCategoryTabs: React.FC<MarketplaceCategoryTabsProps> = ({
  currentCategory,
  onCategoryChange,
  categories,
  paginatedListings,
  loading,
  error,
  totalPages,
  currentPage,
  setCurrentPage,
  highlightedListingId,
  highlightedListingRef
}) => {
  return (
    <Tabs defaultValue={currentCategory} value={currentCategory} onValueChange={onCategoryChange} className="mb-6">
      <ScrollArea className="w-full" orientation="horizontal">
        <TabsList className="inline-flex h-12 items-center justify-start gap-2 rounded-none bg-transparent p-1 mb-4">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id} 
              className={`${categoryColors[category.id as keyof typeof categoryColors]} 
                px-6 py-2 rounded-md shadow-sm font-bold transition-all text-base
                hover:opacity-90 whitespace-nowrap min-w-[100px]
                data-[state=active]:ring-2 data-[state=active]:ring-white/20
                data-[state=active]:shadow-lg`}
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>

      {categories.map(category => (
        <TabsContent key={category.id} value={category.id}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message || "Failed to load listings"}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white/50 h-80 rounded-xl border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : paginatedListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedListings.map((listing, index) => (
                  <div 
                    key={listing.id} 
                    ref={listing.id === highlightedListingId ? highlightedListingRef : null}
                    className={cn(
                      "transition-all duration-300",
                      listing.id === highlightedListingId ? "ring-4 ring-primary ring-opacity-50" : ""
                    )}
                  >
                    <MarketplaceListingCard listing={listing} />
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink onClick={() => setCurrentPage(index + 1)} isActive={currentPage === index + 1}>
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <NoResultsMessage type="marketplace" />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default MarketplaceCategoryTabs;
