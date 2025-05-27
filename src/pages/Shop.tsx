
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';
import { useBusinessesOptimized } from '@/hooks/useBusinessesOptimized';
import BusinessCardPublic from '@/components/business/BusinessCardPublic';
import { Loader2, Search, FilterX, MapPin, Navigation, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import SearchControls from '@/components/search/SearchControls';
import { SortOption } from '@/components/SortButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { distanceService, type Location } from '@/services/distanceService';
import { useToast } from '@/hooks/use-toast';
import { filterBusinessesByPostalCode, getDistanceDisplayText, type BusinessWithDistance } from '@/utils/locationFilterUtils';
import { useDebounce } from '@/hooks/useDebounce';

// Added list of major Indian cities
const INDIAN_CITIES = ["All Cities", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"];

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

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(subcategoryParam ? [subcategoryParam] : []);
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [inputValue, setInputValue] = useState<string>(searchQuery);
  const [selectedCity, setSelectedCity] = useState<string>(cityParam);
  const [postalCode, setPostalCode] = useState<string>(postalCodeParam);

  // Debounce search inputs for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedCity = useDebounce(selectedCity, 200);
  const debouncedPostalCode = useDebounce(postalCode, 200);

  // Location state for distance calculation
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState<boolean>(false);
  const [businessesWithDistance, setBusinessesWithDistance] = useState<BusinessWithDistance[]>([]);

  // Filters
  const { filters, setters } = useSearchFilters();

  // Fetch businesses using optimized hook with combined search
  const { data: businesses, isLoading, error } = useBusinessesOptimized(
    selectedCategory === 'All' ? null : selectedCategory,
    selectedSubcategories.length > 0 ? selectedSubcategories[0] : null,
    debouncedCity !== 'All Cities' ? debouncedCity : undefined,
    debouncedPostalCode || undefined,
    debouncedSearchTerm || undefined
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

  // Recalculate distances when businesses change and location is enabled
  useEffect(() => {
    if (businesses && userLocation && isLocationEnabled) {
      calculateDistancesForBusinesses(businesses, userLocation);
    }
  }, [businesses, userLocation, isLocationEnabled]);

  // Handle location enable/disable
  const handleLocationToggle = async () => {
    if (isLocationEnabled) {
      setIsLocationEnabled(false);
      setUserLocation(null);
      setBusinessesWithDistance([]);
      toast({
        title: "Location disabled",
        description: "Distance sorting is now disabled"
      });
    } else {
      setIsCalculatingDistances(true);
      try {
        console.log('🔍 Getting user location...');
        const location = await distanceService.getUserLocation();
        setUserLocation(location);
        setIsLocationEnabled(true);
        console.log('📍 User location obtained:', location);
        toast({
          title: "Location enabled",
          description: "Distance calculation enabled for sorting"
        });

        if (businesses) {
          await calculateDistancesForBusinesses(businesses, location);
        }
      } catch (error) {
        console.error('❌ Failed to get user location:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access to enable distance sorting",
          variant: "destructive"
        });
      } finally {
        setIsCalculatingDistances(false);
      }
    }
  };

  // Calculate distances for businesses
  const calculateDistancesForBusinesses = async (businessList: any[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const businessesWithDist = await Promise.all(businessList.map(async business => {
        let calculatedDistance = null;
        let distanceText = null;

        if (business.latitude && business.longitude) {
          const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, {
            lat: business.latitude,
            lng: business.longitude
          });
          calculatedDistance = straightLineDistance;
          distanceText = `${straightLineDistance.toFixed(1)} km`;
          console.log(`📍 Distance calculated for ${business.name} using coordinates: ${calculatedDistance.toFixed(2)} km`);
        } else if (business.postal_code) {
          try {
            console.log(`🔍 Calculating distance for ${business.name} using postal code: ${business.postal_code}`);

            let businessLocation: Location;
            try {
              businessLocation = await distanceService.getCoordinatesFromPostalCodeFallback(business.postal_code);
              console.log(`📍 Geocoded ${business.postal_code} to:`, businessLocation);
            } catch (error) {
              console.warn('⚠️ Fallback geocoding failed, trying Google API...');
              businessLocation = await distanceService.getCoordinatesFromPostalCode(business.postal_code);
              console.log(`📍 Geocoded ${business.postal_code} to:`, businessLocation);
            }

            const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, businessLocation);
            calculatedDistance = straightLineDistance;
            distanceText = `${straightLineDistance.toFixed(1)} km`;
            console.log(`📍 Distance calculated for ${business.name} using postal code: ${calculatedDistance.toFixed(2)} km`);
          } catch (error) {
            console.warn(`Failed to calculate distance for ${business.name} using postal code ${business.postal_code}:`, error);
          }
        } else {
          console.log(`⚠️ No location data available for ${business.name} (no coordinates or postal code)`);
        }
        return {
          ...business,
          calculatedDistance,
          distanceText
        } as BusinessWithDistance;
      }));
      setBusinessesWithDistance(businessesWithDist);
      console.log('✅ Distance calculation completed for', businessesWithDist.length, 'businesses');

      const withDistance = businessesWithDist.filter(b => b.calculatedDistance !== null);
      const withoutDistance = businessesWithDist.filter(b => b.calculatedDistance === null);
      console.log(`📊 Distance calculation summary: ${withDistance.length} with distance, ${withoutDistance.length} without distance`);
    } catch (error) {
      console.error('❌ Failed to calculate distances:', error);
      toast({
        title: "Distance calculation failed",
        description: "Using businesses without distance data",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategories: string[]) => {
    setSelectedSubcategories(subcategories);
  };

  // Handle search - now triggers immediately since we're using optimized backend filtering
  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  // Handle postal code search
  const handlePostalCodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPostalCode = postalCode.trim();
    if (!trimmedPostalCode) {
      toast({
        title: "Please enter a postal code",
        description: "Enter a 6-digit postal code to search for listings",
        variant: "destructive"
      });
      return;
    }

    const isValidPostalCode = /^\d{6}$/.test(trimmedPostalCode);
    if (!isValidPostalCode) {
      toast({
        title: "Invalid postal code",
        description: "Postal code must be 6 digits",
        variant: "destructive"
      });
      return;
    }
    console.log("Searching for listings with postal code:", trimmedPostalCode);
  };

  // Clear postal code
  const clearPostalCode = () => {
    setPostalCode('');
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategories([]);
    setSearchTerm('');
    setInputValue('');
    setSelectedCity('All Cities');
    setPostalCode('');
    setIsLocationEnabled(false);
    setUserLocation(null);
    setBusinessesWithDistance([]);
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

  // Filter and sort businesses - now using already filtered data from backend
  const filteredBusinesses = useMemo(() => {
    const businessesToFilter = isLocationEnabled && businessesWithDistance.length > 0 ? businessesWithDistance : (businesses || []).map(b => b as BusinessWithDistance);

    return businessesToFilter.filter(business => {
      // Apply rating filter
      const businessRating = business.rating || 0;
      if (filters.minRating[0] > 0 && businessRating < filters.minRating[0]) {
        return false;
      }

      // Apply price filter
      if (business.price_range_max && filters.priceRange < business.price_range_max) {
        return false;
      }

      // Apply open now filter
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
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          return (b.rating || 0) - (a.rating || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'reviewCount':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });
  }, [businesses, businessesWithDistance, isLocationEnabled, filters]);

  const hasActiveFilters = selectedCategory !== 'All' || selectedSubcategories.length > 0 || searchTerm || selectedCity !== 'All Cities' || postalCode || filters.minRating[0] > 0 || filters.openNowOnly || isLocationEnabled;

  return (
    <MainLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* City Filter, Postal Code Search and Location Toggle - All in One Row */}
        <div className="flex flex-row gap-2 mb-3">
          <div className="flex-1">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_CITIES.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <form onSubmit={handlePostalCodeSearch} className="relative">
              <Input 
                type="text" 
                placeholder="PIN code" 
                value={postalCode} 
                onChange={e => setPostalCode(e.target.value)} 
                className="w-full pr-8 text-sm" 
                maxLength={6}
              />
              {postalCode && (
                <button
                  type="button"
                  onClick={clearPostalCode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>
          <div className="w-12">
            <Button 
              variant={isLocationEnabled ? "default" : "outline"} 
              onClick={handleLocationToggle} 
              disabled={isCalculatingDistances} 
              className="flex items-center justify-center w-full h-10 p-0"
              title={isLocationEnabled ? "Disable Location" : "Enable Location"}
            >
              {isCalculatingDistances ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search shops & services..." 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSearch()} 
              className="pl-10" 
            />
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
            {isLocationEnabled && userLocation && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredBusinesses.length} businesses sorted by distance from your location
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map(business => (
                <BusinessCardPublic key={business.id} business={business as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Shop;
