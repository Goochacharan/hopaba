import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';
import { useBusinessesBySubcategory } from '@/hooks/useBusinesses';
import BusinessCardPublic from '@/components/business/BusinessCardPublic';
import { Loader2, Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import SearchControls from '@/components/search/SearchControls';
import { SortOption } from '@/components/SortButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PostalCodeSearch from '@/components/search/PostalCodeSearch';
import LocationFilter, { type LocationFilterData } from '@/components/search/LocationFilter';
import { 
  filterBusinessesByLocation, 
  filterBusinessesByPostalCode,
  getDistanceDisplayText,
  type BusinessWithDistance 
} from '@/utils/locationFilterUtils';

// Added list of major Indian cities
const INDIAN_CITIES = [
  "All Cities",
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", 
  "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"
];

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get URL parameters
  const categoryParam = searchParams.get('category') || 'All';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const searchQuery = searchParams.get('q') || '';
  const cityParam = searchParams.get('city') || 'All Cities';
  const postalCodeParam = searchParams.get('postalCode') || '';

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    subcategoryParam ? [subcategoryParam] : []
  );
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [selectedCity, setSelectedCity] = useState<string>(cityParam);
  const [postalCode, setPostalCode] = useState<string>(postalCodeParam);
  
  // Location filter state
  const [locationFilter, setLocationFilter] = useState<LocationFilterData>({
    userLocation: null,
    postalCode: '',
    maxDistance: 25,
    useCurrentLocation: false,
    filteredItems: []
  });
  const [locationFilteredBusinesses, setLocationFilteredBusinesses] = useState<BusinessWithDistance[]>([]);

  // Filters
  const {
    filters,
    setters
  } = useSearchFilters();

  // Fetch businesses based on selected category and subcategory
  const {
    data: businesses,
    isLoading,
    error
  } = useBusinessesBySubcategory(
    selectedCategory === 'All' ? null : selectedCategory, 
    selectedSubcategories.length > 0 ? selectedSubcategories[0] : null
  );

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (selectedCategory !== 'All') newParams.set('category', selectedCategory);
    if (selectedSubcategories.length > 0) newParams.set('subcategory', selectedSubcategories[0]);
    if (searchTerm) newParams.set('q', searchTerm);
    if (selectedCity !== 'All Cities') newParams.set('city', selectedCity);
    if (postalCode) newParams.set('postalCode', postalCode);
    setSearchParams(newParams);
  }, [selectedCategory, selectedSubcategories, searchTerm, selectedCity, postalCode, setSearchParams]);

  // Handle location filter changes
  const handleLocationFilter = async (filters: LocationFilterData) => {
    console.log('🔍 Location filter changed:', filters);
    setLocationFilter(filters);
    
    if (!businesses) return;
    
    let filtered: BusinessWithDistance[] = businesses as BusinessWithDistance[];
    
    // Apply location-based filtering
    if (filters.userLocation) {
      filtered = await filterBusinessesByLocation(filtered, filters);
    } else if (filters.postalCode) {
      // For postal code search, filter by exact postal code match
      filtered = filterBusinessesByPostalCode(filtered, filters.postalCode);
    }
    
    setLocationFilteredBusinesses(filtered);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Don't reset subcategory here - the CategoryScrollBar component will handle it
  };

  // Handle subcategory change - updated to accept string[]
  const handleSubcategoryChange = (subcategories: string[]) => {
    setSelectedSubcategories(subcategories);
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  // Handle postal code search (legacy support)
  const handlePostalCodeSearch = (code: string) => {
    setPostalCode(code);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategories([]);
    setSearchTerm('');
    setInputValue('');
    setSelectedCity('All Cities');
    setPostalCode('');
    setLocationFilter({
      userLocation: null,
      postalCode: '',
      maxDistance: 25,
      useCurrentLocation: false,
      filteredItems: []
    });
    setLocationFilteredBusinesses([]);
    setters.setMinRating([0]);
    setters.setPriceRange(50000);
    setters.setOpenNowOnly(false);
    setters.setHiddenGemOnly(false);
    setters.setMustVisitOnly(false);
    navigate('/shop');
  };

  // Sort by
  const handleSortChange = (option: SortOption) => {
    setters.setSortBy(option);
  };

  // Filter and sort businesses
  const filteredBusinesses = useMemo(() => {
    // Use location-filtered businesses if available, otherwise use all businesses
    const businessesToFilter = locationFilteredBusinesses.length > 0 || locationFilter.userLocation || locationFilter.postalCode 
      ? locationFilteredBusinesses 
      : (businesses || []).map(b => b as BusinessWithDistance);
    
    return businessesToFilter.filter(business => {
      // Apply search filter
      if (searchTerm && !business.name.toLowerCase().includes(searchTerm.toLowerCase()) && !business.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Apply city filter
      if (selectedCity !== 'All Cities' && business.city !== selectedCity) {
        return false;
      }

      // Apply postal code filter (legacy)
      if (postalCode && business.postal_code !== postalCode) {
        return false;
      }

      // Apply rating filter
      const businessRating = business.rating || 0;
      if (filters.minRating[0] > 0 && businessRating < filters.minRating[0]) {
        return false;
      }

      // Apply price filter (simplified)
      if (business.price_range_max && filters.priceRange < business.price_range_max) {
        return false;
      }

      // Apply open now filter (simplified)
      if (filters.openNowOnly) {
        const now = new Date();
        const day = now.getDay().toString();
        const isOpen = business.availability_days?.includes(day);
        if (!isOpen) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          // Sort by calculated distance if available
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          // Fall back to rating if no distance data
          return (b.rating || 0) - (a.rating || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviewCount':
          // We don't have review count, so fall back to rating
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });
  }, [businesses, locationFilteredBusinesses, locationFilter, searchTerm, selectedCity, postalCode, filters]);

  const hasActiveFilters = selectedCategory !== 'All' || 
                          selectedSubcategories.length > 0 || 
                          searchTerm || 
                          selectedCity !== 'All Cities' || 
                          postalCode || 
                          filters.minRating[0] > 0 || 
                          filters.openNowOnly ||
                          locationFilter.userLocation ||
                          locationFilter.postalCode;

  return (
    <MainLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Location Filter */}
        <div className="mb-6">
          <LocationFilter 
            onLocationFilter={handleLocationFilter}
            initialPostalCode={postalCodeParam}
            initialMaxDistance={25}
          />
        </div>

        {/* City Filter and Postal Code Filter (Legacy) */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="md:w-1/3">
            <Select
              value={selectedCity}
              onValueChange={handleCityChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-2/3">
            <PostalCodeSearch 
              onSearch={handlePostalCodeSearch} 
              initialValue={postalCode}
            />
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search shops & services..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="pl-10" />
          </div>
          <Button onClick={handleSearch} className="shrink-0">
            Search
          </Button>
        </div>
        
        {/* Categories with improved subcategory selector */}
        <div className="mb-6">
          <CategoryScrollBar 
            selected={selectedCategory} 
            onSelect={handleCategoryChange} 
            selectedSubcategory={selectedSubcategories} 
            onSubcategorySelect={handleSubcategoryChange} 
          />
        </div>
        
        
        <div className="mb-4 flex flex-wrap gap-2">
          {hasActiveFilters && (
            <>
              <div className="text-sm text-muted-foreground mr-2 flex items-center">Active filters:</div>
              <Button size="sm" variant="destructive" onClick={handleResetFilters} className="h-7 gap-1">
                <FilterX className="h-3.5 w-3.5" />
                Reset All
              </Button>
            </>
          )}
        </div>
        
        {/* Filters and Sort Controls */}
        <div className="mb-6">
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
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading businesses. Please try again later.</p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No businesses found</h3>
            <p className="text-muted-foreground">
              Try changing your filters or search term
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results summary */}
            {(locationFilter.userLocation || locationFilter.postalCode) && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredBusinesses.length} businesses
                {locationFilter.userLocation && ` within ${locationFilter.maxDistance} km of your location`}
                {locationFilter.postalCode && ` for postal code ${locationFilter.postalCode}`}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map(business => (
                <div key={business.id} className="relative">
                  <BusinessCardPublic business={business as any} />
                  {/* Distance badge */}
                  {business.calculatedDistance !== null && business.calculatedDistance !== undefined && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {getDistanceDisplayText(business)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Shop;
