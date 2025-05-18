import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';
import SubcategorySelector from '@/components/business/SubcategorySelector';
import SortButton, { SortOption } from '@/components/SortButton';
import Filters from '@/components/Filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BusinessCard from '@/components/business/BusinessCardPublic';

interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  area: string;
  city: string;
  contact_phone: string;
  instagram?: string;
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  availability?: string;
  tags?: string[];
  images?: string[];
  approval_status: string;
}

const Shop = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | undefined>();
  const [distance, setDistance] = useState([5]);
  const [minRating, setMinRating] = useState([4]);
  const [priceRange, setPriceRange] = useState(2);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  
  // Load all approved businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select('*')
          .eq('approval_status', 'approved');
          
        if (error) {
          throw error;
        }
        
        console.log('Fetched businesses:', data);
        setBusinesses(data || []);
        setFilteredBusinesses(data || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load businesses. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, [toast]);
  
  // Update filtered businesses when filters change
  useEffect(() => {
    let results = [...businesses];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(business => 
        business.name.toLowerCase().includes(query) ||
        business.description.toLowerCase().includes(query) ||
        business.area.toLowerCase().includes(query) ||
        business.city.toLowerCase().includes(query) ||
        (business.tags && business.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      results = results.filter(business => 
        business.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      
      // Apply subcategory filter if category is selected
      if (selectedSubcategory) {
        results = results.filter(business => 
          business.subcategory && business.subcategory.toLowerCase() === selectedSubcategory.toLowerCase()
        );
      }
    }
    
    // Apply price range filter
    if (priceRange) {
      // This is a simple implementation. You might want to adjust based on your data structure
      results = results.filter(business => {
        if (!business.price_range_max) return true;
        
        // Adjust the price range based on the slider value
        const maxPrice = priceRange === 1 ? 500 : priceRange === 2 ? 2000 : 5000;
        return business.price_range_max <= maxPrice;
      });
    }
    
    // Apply availability filter (open now)
    if (openNowOnly) {
      // This would require more complex logic based on current time and business hours
      // For now, we'll just filter by those that have availability information
      results = results.filter(business => !!business.availability);
    }
    
    // Apply sorting
    results = sortBusinesses(results, sortOption);
    
    setFilteredBusinesses(results);
  }, [businesses, searchQuery, selectedCategory, selectedSubcategory, priceRange, openNowOnly, sortOption]);
  
  // Sort businesses based on the selected sort option
  const sortBusinesses = (businesses: Business[], option: SortOption) => {
    const sorted = [...businesses];
    
    switch (option) {
      case 'rating':
        // Sort by a hypothetical rating field - you might need to adjust this
        return sorted;
      case 'distance':
        // Sort by a hypothetical distance field - you might need to adjust this
        return sorted;
      case 'reviewCount':
        // Sort by a hypothetical review count - you might need to adjust this
        return sorted;
      case 'newest':
        // Sort by creation date, newest first
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return sorted;
    }
  };
  
  // Handle category selection and update the current category ID
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Shop Local Businesses</h1>
        <p className="text-muted-foreground mb-6">Discover and support businesses in your community</p>
        
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Search businesses, services, areas..."
            className="pl-10 pr-4 h-12 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Filters section */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-6">
            <Filters 
              distance={distance}
              setDistance={setDistance}
              minRating={minRating}
              setMinRating={setMinRating}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              openNowOnly={openNowOnly}
              setOpenNowOnly={setOpenNowOnly}
            />
          </div>
          
          <div className="space-y-6">
            {/* Categories and Sort */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Categories</h2>
                <SortButton 
                  currentSort={sortOption} 
                  onSortChange={(option) => setSortOption(option)} 
                />
              </div>
              
              {/* Category scroll bar */}
              <CategoryScrollBar 
                selected={selectedCategory} 
                onSelect={handleCategorySelect} 
                selectedSubcategory={selectedSubcategory}
                onSubcategorySelect={setSelectedSubcategory}
              />
            </div>
            
            {/* Businesses list */}
            <div className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredBusinesses.map((business) => (
                    <BusinessCard 
                      key={business.id} 
                      business={business} 
                      isShopPage={true} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">No businesses found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Shop;
