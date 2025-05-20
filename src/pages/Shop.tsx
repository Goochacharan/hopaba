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
const Shop = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get URL parameters
  const categoryParam = searchParams.get('category') || 'All';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const searchQuery = searchParams.get('q') || '';

  // Local state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategoryParam);
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const [inputValue, setInputValue] = useState<string>(searchQuery);

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
  } = useBusinessesBySubcategory(selectedCategory === 'All' ? null : selectedCategory, selectedSubcategory);

  // Update URL when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (selectedCategory !== 'All') newParams.set('category', selectedCategory);
    if (selectedSubcategory) newParams.set('subcategory', selectedSubcategory);
    if (searchTerm) newParams.set('q', searchTerm);
    setSearchParams(newParams);
  }, [selectedCategory, selectedSubcategory, searchTerm, setSearchParams]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Don't reset subcategory here - the CategoryScrollBar component will handle it
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('');
    setSearchTerm('');
    setInputValue('');
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
    if (!businesses) return [];
    return businesses.filter(business => {
      // Apply search filter
      if (searchTerm && !business.name.toLowerCase().includes(searchTerm.toLowerCase()) && !business.description.toLowerCase().includes(searchTerm.toLowerCase())) {
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
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          // We don't have distance data, so fall back to rating
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
  }, [businesses, searchTerm, filters]);
  return <MainLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        
        
        
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
          <CategoryScrollBar selected={selectedCategory} onSelect={handleCategoryChange} selectedSubcategory={selectedSubcategory} onSubcategorySelect={handleSubcategoryChange} />
        </div>
        
        {/* Active Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(selectedCategory !== 'All' || selectedSubcategory || searchTerm || filters.minRating[0] > 0 || filters.openNowOnly) && <>
              <div className="text-sm text-muted-foreground mr-2 flex items-center">Active filters:</div>
              <Button size="sm" variant="destructive" onClick={handleResetFilters} className="h-7 gap-1">
                <FilterX className="h-3.5 w-3.5" />
                Reset All
              </Button>
            </>}
        </div>
        
        {/* Filters and Sort Controls */}
        <div className="mb-6">
          <SearchControls distance={filters.distance} setDistance={setters.setDistance} minRating={filters.minRating} setMinRating={setters.setMinRating} priceRange={filters.priceRange} setPriceRange={setters.setPriceRange} openNowOnly={filters.openNowOnly} setOpenNowOnly={setters.setOpenNowOnly} hiddenGemOnly={filters.hiddenGemOnly} setHiddenGemOnly={setters.setHiddenGemOnly} mustVisitOnly={filters.mustVisitOnly} setMustVisitOnly={setters.setMustVisitOnly} sortBy={filters.sortBy} onSortChange={handleSortChange} />
        </div>
        
        {/* Results */}
        <div className="mt-4">
          {isLoading ? <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div> : error ? <div className="text-center py-12">
              <p className="text-destructive">Error loading businesses. Please try again later.</p>
            </div> : filteredBusinesses.length === 0 ? <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No businesses found</h3>
              <p className="text-muted-foreground">
                Try changing your filters or search term
              </p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map(business => <BusinessCardPublic key={business.id} business={business} />)}
            </div>}
        </div>
      </div>
    </MainLayout>;
};
export default Shop;