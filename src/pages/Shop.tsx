import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import MainLayout from '@/components/MainLayout';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';
import { useBusinessesOptimized, useBusinessesCount } from '@/hooks/useBusinessesOptimized';
import { useBusinessReviewsAggregated } from '@/hooks/useBusinessReviewsAggregated';
import { calculateOverallRating } from '@/utils/ratingUtils';
import { Loader2, Search, FilterX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { SortOption } from '@/components/SortButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocation } from '@/contexts/LocationContext';
import { filterBusinessesByLocation } from '@/utils/locationFilterUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { useDistanceCache } from '@/hooks/useDistanceCache';
import PerformanceMonitor from '@/components/PerformanceMonitor';

// Lazy load heavy components
const BusinessCardPublic = lazy(() => import('@/components/business/BusinessCardPublic'));
const SearchControls = lazy(() => import('@/components/search/SearchControls'));

// Added list of major Indian cities
const INDIAN_CITIES = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"];

// Skeleton component for business cards
const BusinessCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
    <div className="flex space-x-4">
      <Skeleton className="w-20 h-20 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  </div>
);

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange, isLoading }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <div className="flex space-x-1">
        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number' || isLoading}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Get URL parameters
  const categoryParam = searchParams.get('category') || 'All';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const searchQuery = searchParams.get('q') || '';
  const cityParam = searchParams.get('city') || 'All Cities';
  const postalCodeParam = searchParams.get('postalCode') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(subcategoryParam ? [subcategoryParam] : []);
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [selectedCity, setSelectedCity] = useState<string>(cityParam);
  const [postalCode, setPostalCode] = useState<string>(postalCodeParam);
  const [currentPage, setCurrentPage] = useState<number>(pageParam);

  // Pagination settings
  const ITEMS_PER_PAGE = 24; // Optimized for 3-column grid

  // Debounce search inputs for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCity = useDebounce(selectedCity, 200);
  const debouncedPostalCode = useDebounce(postalCode, 200);

  // Location context
  const { userLocation } = useLocation();

  // Distance caching
  const { calculateDistancesForBusinesses } = useDistanceCache();

  // Filters
  const { filters, setters } = useSearchFilters();

  // Calculate offset for pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch businesses using optimized hook with pagination
  const { data: businesses, isLoading, error } = useBusinessesOptimized(
    selectedCategory === 'All' ? null : selectedCategory,
    selectedSubcategories.length > 0 ? selectedSubcategories[0] : null,
    debouncedCity !== 'All Cities' ? debouncedCity : undefined,
    debouncedPostalCode || undefined,
    debouncedSearchTerm || undefined,
    ITEMS_PER_PAGE,
    offset
  );

  // Fetch total count for pagination
  const { data: totalCount = 0 } = useBusinessesCount(
    selectedCategory === 'All' ? null : selectedCategory,
    selectedSubcategories.length > 0 ? selectedSubcategories[0] : null,
    debouncedCity !== 'All Cities' ? debouncedCity : undefined,
    debouncedPostalCode || undefined,
    debouncedSearchTerm || undefined
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch aggregated review data for current page businesses only
  const businessIds = useMemo(() => businesses?.map(b => b.id) || [], [businesses]);
  const { data: reviewAggregations = {} } = useBusinessReviewsAggregated(businessIds);

  // Memoize filtered businesses to avoid recalculation
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    
    const filtered = businesses.filter(business => {
      // Apply rating filter using overall score from aggregated review data
      const reviewData = reviewAggregations[business.id];
      const overallScore = reviewData?.average_criteria_ratings && Object.keys(reviewData.average_criteria_ratings).length > 0 
        ? calculateOverallRating(reviewData.average_criteria_ratings)
        : 0;
      // Only apply rating filter if user has set a minimum rating (> 0)
      if (filters.minRating[0] > 0) {
        // If business has no reviews/ratings, exclude it when rating filter is active
        if (overallScore === 0) {
          return false;
        }
        // If business has ratings but below minimum, exclude it
        if (overallScore < filters.minRating[0]) {
          return false;
        }
      }
      
      // Apply price range filter
      if (business.price_range_min && business.price_range_max) {
        const avgPrice = (business.price_range_min + business.price_range_max) / 2;
        if (avgPrice > filters.priceRange) {
          return false;
        }
      } else if (business.price_range_max) {
        // If only max price is available, use that
        if (business.price_range_max > filters.priceRange) {
          return false;
        }
      } else if (business.price_range_min) {
        // If only min price is available, use that
        if (business.price_range_min > filters.priceRange) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [businesses, reviewAggregations, filters.minRating[0], filters.priceRange]);

  // State for businesses with distance calculations
  const [businessesWithDistance, setBusinessesWithDistance] = useState<any[]>([]);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);

  // Calculate distances for businesses when location is enabled
  const businessesRef = useRef(businesses);
  businessesRef.current = businesses;

  const lastLocationRef = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const calculateDistances = async () => {
      const currentBusinesses = businessesRef.current;
      
      if (!userLocation || !currentBusinesses?.length) {
        if (isMounted) {
          setBusinessesWithDistance([]);
        }
        return;
      }

      // Check if location has changed significantly (more than ~100 meters)
      const lastLocation = lastLocationRef.current;
      if (lastLocation) {
        const distance = Math.sqrt(
          Math.pow(userLocation.lat - lastLocation.lat, 2) + 
          Math.pow(userLocation.lng - lastLocation.lng, 2)
        );
        // If location change is less than ~0.001 degrees (~100m), skip recalculation
        if (distance < 0.001) {
          console.log('📍 Location change too small, skipping distance recalculation');
          return;
        }
      }

      // Update last location
      lastLocationRef.current = { lat: userLocation.lat, lng: userLocation.lng };

      if (isMounted) {
        setIsCalculatingDistances(true);
      }

      try {
        // Use the cached distance calculation with the raw businesses (not filtered)
        const distanceResults = await calculateDistancesForBusinesses(userLocation, currentBusinesses);
        
        const businessesWithDistanceData = distanceResults.map(result => ({
          ...result.business,
          calculatedDistance: result.distance
        }));

        if (isMounted) {
          setBusinessesWithDistance(businessesWithDistanceData);
        }
      } catch (error) {
        console.error('Error calculating distances for businesses:', error);
        if (isMounted) {
          setBusinessesWithDistance([]);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingDistances(false);
        }
      }
    };

    // Debounce distance calculations to prevent rapid successive calls
    timeoutId = setTimeout(() => {
      calculateDistances();
    }, 500); // 500ms debounce

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [businesses?.length, userLocation?.lat, userLocation?.lng]);

  // Apply all filters (including distance) to businesses with calculated distances
  const finalFilteredBusinesses = useMemo(() => {
    // Start with businesses that have distance calculations if location is enabled
    const businessesToFilter = userLocation && businessesWithDistance.length > 0 
      ? businessesWithDistance 
      : filteredBusinesses;

    if (!businessesToFilter.length) return [];

    // Apply distance filter if location is enabled
    let filtered = businessesToFilter;
    if (userLocation && businessesWithDistance.length > 0) {
      const maxDistance = filters.distance[0];
      filtered = businessesToFilter.filter(business => {
        // Always include businesses without location data (they'll appear at the end)
        if (business.calculatedDistance === null) return true;
        // Only apply distance filter if it's reasonable (less than 50km)
        if (maxDistance >= 50) return true; // No distance filter if max distance
        return business.calculatedDistance <= maxDistance;
      });
    }

    // Apply other filters (rating, price, etc.) if we're using businesses with distance
    if (userLocation && businessesWithDistance.length > 0) {
      filtered = filtered.filter(business => {
        // Apply rating filter using overall score from aggregated review data
        const reviewData = reviewAggregations[business.id];
        const overallScore = reviewData?.average_criteria_ratings && Object.keys(reviewData.average_criteria_ratings).length > 0 
          ? calculateOverallRating(reviewData.average_criteria_ratings)
          : 0;
        // Only apply rating filter if user has set a minimum rating (> 0)
        if (filters.minRating[0] > 0) {
          // If business has no reviews/ratings, exclude it when rating filter is active
          if (overallScore === 0) {
            return false;
          }
          // If business has ratings but below minimum, exclude it
          if (overallScore < filters.minRating[0]) {
            return false;
          }
        }
        
        // Apply price range filter
        if (business.price_range_min && business.price_range_max) {
          const avgPrice = (business.price_range_min + business.price_range_max) / 2;
          if (avgPrice > filters.priceRange) {
            return false;
          }
        } else if (business.price_range_max) {
          if (business.price_range_max > filters.priceRange) {
            return false;
          }
        } else if (business.price_range_min) {
          if (business.price_range_min > filters.priceRange) {
            return false;
          }
        }
        
        return true;
      });
    }

    return filtered;
  }, [businessesWithDistance, filteredBusinesses, userLocation, reviewAggregations, filters.distance, filters.minRating, filters.priceRange]);

  // Sort businesses based on selected sort option
  const sortBusinesses = useCallback((businesses: any[]) => {
    const sorted = [...businesses];
    
    switch (filters.sortBy) {
      case 'rating':
        return sorted.sort((a, b) => {
          // Calculate overall scores using the same method as displayed in UI
          const reviewDataA = reviewAggregations[a.id];
          const reviewDataB = reviewAggregations[b.id];
          const overallScoreA = reviewDataA?.average_criteria_ratings && Object.keys(reviewDataA.average_criteria_ratings).length > 0 
            ? calculateOverallRating(reviewDataA.average_criteria_ratings)
            : 0;
          const overallScoreB = reviewDataB?.average_criteria_ratings && Object.keys(reviewDataB.average_criteria_ratings).length > 0 
            ? calculateOverallRating(reviewDataB.average_criteria_ratings)
            : 0;
          
          // If overall scores are equal, sort by review count as tiebreaker
          if (overallScoreA === overallScoreB) {
            const reviewA = reviewAggregations[a.id];
            const reviewB = reviewAggregations[b.id];
            const countA = reviewA?.review_count || 0;
            const countB = reviewB?.review_count || 0;
            return countB - countA;
          }
          
          return overallScoreB - overallScoreA; // High to low
        });
        
      case 'distance':
        return sorted.sort((a, b) => {
          // If both have distances, sort by distance
          if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
            return a.calculatedDistance - b.calculatedDistance; // Near to far
          }
          // Businesses with distance come first
          if (a.calculatedDistance !== null && b.calculatedDistance === null) return -1;
          if (a.calculatedDistance === null && b.calculatedDistance !== null) return 1;
          // If neither has distance, fall back to overall score
          const reviewDataA = reviewAggregations[a.id];
          const reviewDataB = reviewAggregations[b.id];
          const overallScoreA = reviewDataA?.average_criteria_ratings && Object.keys(reviewDataA.average_criteria_ratings).length > 0 
            ? calculateOverallRating(reviewDataA.average_criteria_ratings)
            : 0;
          const overallScoreB = reviewDataB?.average_criteria_ratings && Object.keys(reviewDataB.average_criteria_ratings).length > 0 
            ? calculateOverallRating(reviewDataB.average_criteria_ratings)
            : 0;
          return overallScoreB - overallScoreA;
        });
        
      case 'reviewCount':
        return sorted.sort((a, b) => {
          // Use aggregated review count data
          const reviewA = reviewAggregations[a.id];
          const reviewB = reviewAggregations[b.id];
          const countA = reviewA?.review_count || 0;
          const countB = reviewB?.review_count || 0;
          
          // If review counts are equal, sort by overall score as tiebreaker
          if (countA === countB) {
            const reviewDataA = reviewAggregations[a.id];
            const reviewDataB = reviewAggregations[b.id];
            const overallScoreA = reviewDataA?.average_criteria_ratings && Object.keys(reviewDataA.average_criteria_ratings).length > 0 
              ? calculateOverallRating(reviewDataA.average_criteria_ratings)
              : 0;
            const overallScoreB = reviewDataB?.average_criteria_ratings && Object.keys(reviewDataB.average_criteria_ratings).length > 0 
              ? calculateOverallRating(reviewDataB.average_criteria_ratings)
              : 0;
            return overallScoreB - overallScoreA;
          }
          
          return countB - countA; // High to low
        });
        
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Newest first
        });
        
      default:
        return sorted;
    }
  }, [filters.sortBy, reviewAggregations]);

  // Final businesses to display with sorting applied
  const finalBusinesses = useMemo(() => {
    return sortBusinesses(finalFilteredBusinesses);
  }, [finalFilteredBusinesses, sortBusinesses]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategories([]);
    setCurrentPage(1); // Reset to first page
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', category);
    newParams.delete('subcategory');
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Handle search
  const handleSearch = useCallback(() => {
    setSearchTerm(inputValue);
    setCurrentPage(1); // Reset to first page
    const newParams = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      newParams.set('q', inputValue.trim());
    } else {
      newParams.delete('q');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  }, [inputValue, searchParams, setSearchParams]);

  // Handle city change
  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    setCurrentPage(1); // Reset to first page
    const newParams = new URLSearchParams(searchParams);
    if (city !== 'All Cities') {
      newParams.set('city', city);
    } else {
      newParams.delete('city');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Handle postal code change
  const handlePostalCodeChange = useCallback((code: string) => {
    setPostalCode(code);
    setCurrentPage(1); // Reset to first page
    const newParams = new URLSearchParams(searchParams);
    if (code.trim()) {
      newParams.set('postalCode', code.trim());
    } else {
      newParams.delete('postalCode');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams);
    if (page > 1) {
      newParams.set('page', page.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: 'rating' | 'distance' | 'reviewCount' | 'newest') => {
    setters.setSortBy(sortBy);
  }, [setters]);

  const cities = useMemo(() => [
    'All Cities', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'
  ], []);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        {/* <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Discover Local Businesses</h1>
          <p className="text-muted-foreground">
            Find the best service providers in your area
          </p>
        </div> */}

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Location Filters - Moved to top */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search businesses..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Search
            </button>
          </div>

          {/* Category Filter */}
          <CategoryScrollBar
            selected={selectedCategory}
            onSelect={handleCategoryChange}
            selectedSubcategory={selectedSubcategories}
            onSubcategorySelect={(subcategories) => {
              setSelectedSubcategories(subcategories);
              setCurrentPage(1); // Reset to first page
              const newParams = new URLSearchParams(searchParams);
              if (subcategories.length > 0) {
                newParams.set('subcategory', subcategories[0]);
              } else {
                newParams.delete('subcategory');
              }
              newParams.delete('page');
              setSearchParams(newParams);
            }}
          />
        </div>

        {/* Search Controls */}
        <Suspense fallback={<Skeleton className="h-20 w-full" />}>
          <SearchControls 
            distance={filters.distance} 
            setDistance={setters.setDistance} 
            minRating={filters.minRating} 
            setMinRating={setters.setMinRating} 
            priceRange={filters.priceRange} 
            setPriceRange={setters.setPriceRange} 
            openNowOnly={filters.openNowOnly} 
            setOpenNowOnly={setters.setOpenNowOnly} 
            hiddenGemOnly={filters.hiddenGemOnly} 
            setHiddenGemOnly={setters.setHiddenGemOnly} 
            mustVisitOnly={filters.mustVisitOnly} 
            setMustVisitOnly={setters.setMustVisitOnly} 
            sortBy={filters.sortBy} 
            onSortChange={handleSortChange} 
          />
        </Suspense>
        
        {/* Results Summary */}
        {!isLoading && (
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {finalBusinesses.length} of {totalCount} businesses
              {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </span>
            {isCalculatingDistances && userLocation && (
              <span className="text-primary">Calculating distances...</span>
            )}
          </div>
        )}
        
        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
              <BusinessCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading businesses. Please try again later.</p>
          </div>
        ) : finalBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              Try changing your filters or search term
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {finalBusinesses.map(business => (
                <Suspense key={business.id} fallback={<BusinessCardSkeleton />}>
                  <BusinessCardPublic business={business as any} />
                </Suspense>
              ))}
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </div>
        )}
        
        {/* Performance Monitor (only in development) */}
        <PerformanceMonitor 
          label="Shop Page"
          isLoading={isLoading}
          dataCount={finalBusinesses.length}
        />
      </div>
    </MainLayout>
  );
};

export default Shop;
