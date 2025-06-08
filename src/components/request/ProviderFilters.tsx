
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, Star, Languages, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SortButton, { SortOption } from '@/components/SortButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProviderFiltersProps {
  cities: string[];
  onFilterChange: (filters: ProviderFilters) => void;
  onSortChange: (option: SortOption) => void;
  currentSort: SortOption;
}

export interface ProviderFilters {
  minRating: number[];
  languages: string[];
  city: string;
  postalCode: string;
  priceType: 'all' | 'negotiable' | 'fixed' | 'wholesale';
}

const ProviderFilters: React.FC<ProviderFiltersProps> = ({
  cities,
  onFilterChange,
  onSortChange,
  currentSort
}) => {
  const [filters, setFilters] = useState<ProviderFilters>({
    minRating: [0],
    languages: [],
    city: '',
    postalCode: '',
    priceType: 'all'
  });
  
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Fetch available languages
  const { data: availableLanguages = [] } = useQuery({
    queryKey: ['available-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching languages:', error);
        return [];
      }
      
      return data || [];
    }
  });
  
  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle language selection
  const handleLanguageToggle = (languageId: string) => {
    const newLanguages = filters.languages.includes(languageId)
      ? filters.languages.filter(id => id !== languageId)
      : [...filters.languages, languageId];
    handleFilterChange('languages', newLanguages);
  };
  
  const clearFilters = () => {
    const newFilters: ProviderFilters = { 
      minRating: [0], 
      languages: [],
      city: '', 
      postalCode: '',
      priceType: 'all'
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setActiveFilter(null);
  };
  
  // Helper functions to check if filters are active
  const isRatingActive = filters.minRating[0] > 0;
  const isLanguageActive = filters.languages.length > 0;
  const isLocationActive = filters.city.trim() !== '' || filters.postalCode.trim() !== '';
  const isPriceTypeActive = filters.priceType !== 'all';
  
  const activeFilterCount = [
    isRatingActive,
    isLanguageActive,
    isLocationActive,
    isPriceTypeActive
  ].filter(Boolean).length;
  
  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-2 pb-2 pt-1 px-1 overflow-x-auto min-w-max">
        {/* Rating Filter */}
        <Popover open={activeFilter === 'rating'} onOpenChange={open => setActiveFilter(open ? 'rating' : null)}>
          <PopoverTrigger asChild>
            <Button 
              variant={isRatingActive ? "default" : "outline"} 
              size="sm" 
              className={cn(
                "rounded-full border flex items-center justify-center w-10 h-10 relative", 
                activeFilter === 'rating' && "ring-2 ring-primary/20", 
                isRatingActive && "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              <Star className="w-4 h-4" />
              {isRatingActive && (
                <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-primary text-white">
                  {filters.minRating[0]}+
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Minimum Rating</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Show results with overall score</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{filters.minRating[0] === 0 ? 'Any' : `${filters.minRating[0]}+`}</span>
                  </div>
                </div>
                <Slider 
                  id="rating" 
                  value={filters.minRating} 
                  min={0} 
                  max={100} 
                  step={5} 
                  onValueChange={(value) => handleFilterChange('minRating', value)} 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Any (0)</span>
                  <span>Excellent (100)</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Language Filter */}
        <Popover open={activeFilter === 'language'} onOpenChange={open => setActiveFilter(open ? 'language' : null)}>
          <PopoverTrigger asChild>
            <Button 
              variant={isLanguageActive ? "default" : "outline"} 
              size="sm" 
              className={cn(
                "rounded-full border flex items-center justify-center w-10 h-10 relative", 
                activeFilter === 'language' && "ring-2 ring-primary/20", 
                isLanguageActive && "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              <Languages className="w-4 h-4" />
              {isLanguageActive && (
                <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-primary text-white">
                  {filters.languages.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Languages</h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {availableLanguages.map((language) => (
                    <div key={language.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={language.id}
                        checked={filters.languages.includes(language.id)}
                        onCheckedChange={() => handleLanguageToggle(language.id)}
                      />
                      <Label htmlFor={language.id} className="text-sm">
                        {language.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        {/* Location Filter */}
        <Popover open={activeFilter === 'location'} onOpenChange={open => setActiveFilter(open ? 'location' : null)}>
          <PopoverTrigger asChild>
            <Button 
              variant={isLocationActive ? "default" : "outline"} 
              size="sm" 
              className={cn(
                "rounded-full border flex items-center justify-center w-10 h-10 relative", 
                activeFilter === 'location' && "ring-2 ring-primary/20", 
                isLocationActive && "bg-purple-500 hover:bg-purple-600 text-white"
              )}
            >
              <MapPin className="w-4 h-4" />
              {isLocationActive && (
                <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-primary text-white">
                  ✓
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Location</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city name"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                  <Input
                    id="postalCode"
                    placeholder="Enter postal code"
                    value={filters.postalCode}
                    onChange={(e) => handleFilterChange('postalCode', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Price Type Filter */}
        <Popover open={activeFilter === 'priceType'} onOpenChange={open => setActiveFilter(open ? 'priceType' : null)}>
          <PopoverTrigger asChild>
            <Button 
              variant={isPriceTypeActive ? "default" : "outline"} 
              size="sm" 
              className={cn(
                "rounded-full border flex items-center justify-center w-10 h-10 relative", 
                activeFilter === 'priceType' && "ring-2 ring-primary/20", 
                isPriceTypeActive && "bg-orange-500 hover:bg-orange-600 text-white"
              )}
            >
              <span className="text-xs font-bold">₹</span>
              {isPriceTypeActive && (
                <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-primary text-white">
                  ✓
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Price Type</h4>
              <Select value={filters.priceType} onValueChange={(value: 'all' | 'negotiable' | 'fixed' | 'wholesale') => handleFilterChange('priceType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Price Types</SelectItem>
                  <SelectItem value="negotiable">Negotiable</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Sort by:</Label>
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rating</SelectItem>
              <SelectItem value="reviewCount">Most Reviews</SelectItem>
              <SelectItem value="distance">Nearest Distance</SelectItem>
              <SelectItem value="newest">Latest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {isRatingActive && (
              <Badge variant="secondary" className="text-xs">
                Rating: {filters.minRating[0]}+
              </Badge>
            )}
            {isLanguageActive && (
              <Badge variant="secondary" className="text-xs">
                Languages: {filters.languages.length}
              </Badge>
            )}
            {isLocationActive && (
              <Badge variant="secondary" className="text-xs">
                Location
              </Badge>
            )}
            {isPriceTypeActive && (
              <Badge variant="secondary" className="text-xs">
                {filters.priceType}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderFilters;
