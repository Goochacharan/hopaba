
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/MainLayout';
import useRecommendations from '@/hooks/useRecommendations';
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { addDistanceToRecommendations, sortRecommendations, enhanceRecommendations } from '@/utils/searchUtils';
import SearchHeader from '@/components/search/SearchHeader';
import SearchTabs from '@/components/search/SearchTabs';
import SearchControls from '@/components/search/SearchControls';
import AreaSearchBar from '@/components/search/AreaSearchBar';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';
import { useSearchEnhancement } from '@/hooks/useSearchEnhancement';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const searchQuery = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number, lng: number } | null>({
    lat: 12.9716,
    lng: 77.5946
  });
  
  const { filters, setters } = useSearchFilters();
  const { searchWithLocation } = useSearchEnhancement();
  const [directSearchResults, setDirectSearchResults] = useState<any[]>([]);
  const [directSearchLoading, setDirectSearchLoading] = useState(false);
  
  const {
    recommendations,
    events,
    loading: recommendationsLoading,
    error: recommendationsError,
    query,
    category,
    handleSearch,
    handleCategoryChange,
    filterRecommendations
  } = useRecommendations({
    initialQuery: searchQuery,
    initialCategory: categoryParam as any,
    loadDefaultResults: true
  });

  const {
    data: marketplaceListings,
    isLoading: marketplaceLoading,
    error: marketplaceError
  } = useMarketplaceListings({
    searchQuery: searchQuery,
    minRating: filters.minRating[0] > 3 ? filters.minRating[0] : undefined
  });

  const loading = recommendationsLoading || marketplaceLoading || directSearchLoading;
  const error = recommendationsError || marketplaceError;

  console.log("Original recommendations:", recommendations);
  console.log("Direct search results:", directSearchResults);

  // Combine recommendations from both sources
  const combinedRecommendations = [...recommendations, ...directSearchResults];
  // Remove duplicates by id
  const uniqueRecommendations = Array.from(
    new Map(combinedRecommendations.map(item => [item.id, item])).values()
  );

  const enhancedRecommendations = uniqueRecommendations.map((rec, index) => ({
    ...rec,
    isHiddenGem: rec.isHiddenGem || index % 3 === 0,
    isMustVisit: rec.isMustVisit || index % 5 === 0,
    availability_days: rec.availability_days || [],
    hours: rec.hours || '',
    availability_start_time: rec.availability_start_time || '',
    availability_end_time: rec.availability_end_time || ''
  }));

  const areaFilteredRecommendations = selectedArea 
    ? enhancedRecommendations.filter(rec => 
        rec.address && rec.address.toLowerCase().includes(selectedArea.toLowerCase()))
    : enhancedRecommendations;

  const filteredRecommendations = filterRecommendations(areaFilteredRecommendations, {
    maxDistance: filters.distance[0],
    minRating: filters.minRating[0],
    priceLevel: filters.priceRange,
    openNow: filters.openNowOnly,
    hiddenGem: filters.hiddenGemOnly,
    mustVisit: filters.mustVisitOnly,
    distanceUnit: 'km'
  });

  const recommendationsWithDistance = addDistanceToRecommendations(filteredRecommendations, userCoordinates);
  const fullyEnhancedRecommendations = enhanceRecommendations(recommendationsWithDistance);
  const rankedRecommendations = sortRecommendations(fullyEnhancedRecommendations, filters.sortBy);

  console.log("Final ranked recommendations:", rankedRecommendations);
  console.log("Selected area:", selectedArea);
  console.log("User coordinates:", userCoordinates);
  console.log("Current category for filtering:", category);

  const handleCategorySelect = (selectedCategory: string) => {
    console.log("Category selected:", selectedCategory);
    
    const normalizedCategory = selectedCategory === "All" ? "all" : selectedCategory;
    
    handleCategoryChange(normalizedCategory as any);

    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('category', normalizedCategory);
    navigate(`/search?${newSearchParams.toString()}`);
  };

  useEffect(() => {
    if (searchQuery && searchQuery !== query) {
      console.log("SearchResults - Processing search query:", searchQuery);
      handleSearch(searchQuery);
      
      // Also perform a direct location-based search to get more results
      const fetchLocationResults = async () => {
        setDirectSearchLoading(true);
        try {
          const { providers } = await searchWithLocation(searchQuery, categoryParam);
          console.log("Direct location search returned:", providers?.length || 0, "results");
          setDirectSearchResults(providers || []);
        } catch (err) {
          console.error("Error in direct location search:", err);
        } finally {
          setDirectSearchLoading(false);
        }
      };
      
      fetchLocationResults();
    }
  }, [searchQuery, query, handleSearch, categoryParam, searchWithLocation]);

  useEffect(() => {
    if (categoryParam !== 'all' && categoryParam !== category) {
      console.log("SearchResults - Setting category from URL:", categoryParam);
      handleCategoryChange(categoryParam as any);
    }
  }, [categoryParam, category, handleCategoryChange]);

  useEffect(() => {
    if (!searchQuery) {
      navigate('/');
    }
  }, [searchQuery, navigate]);

  const handleRSVP = (eventTitle: string) => {
    toast({
      title: "RSVP Successful",
      description: `You've RSVP'd to ${eventTitle}. We'll send you a reminder closer to the date.`,
      duration: 3000
    });
  };

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    console.log("Area selected:", area);
  };

  const handleLocationSelect = (coordinates: { lat: number, lng: number } | null) => {
    if (coordinates) {
      setUserCoordinates(coordinates);
      console.log("User coordinates set:", coordinates);
    }
  };

  return (
    <MainLayout>
      <div className="w-full animate-fade-in mx-0 px-[2px] search-results-container">
        <AreaSearchBar
          selectedArea={selectedArea}
          onAreaSelect={handleAreaSelect}
          onLocationSelect={handleLocationSelect}
        />

        <CategoryScrollBar
          selected={category}
          onSelect={handleCategorySelect}
          className="my-2"
        />
        
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
          onSortChange={setters.setSortBy}
        />

        <div className="w-full">
          <SearchHeader 
            query={query}
            searchQuery={searchQuery}
            category={category}
            resultsCount={{
              locations: rankedRecommendations.length,
              events: 0,
              marketplace: 0
            }}
            loading={loading}
            error={error ? String(error) : null}
            className="search-header"
          />
          
          {!loading && (
            <div className="search-tabs-container">
              <SearchTabs 
                recommendations={rankedRecommendations}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchResults;
