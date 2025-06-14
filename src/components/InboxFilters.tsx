import React, { useState, useEffect } from 'react';
import { Star, Languages, MapPin, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface InboxFiltersProps {
  minRating: number[];
  setMinRating: (value: number[]) => void;
  languages: string[];
  setLanguages: (value: string[]) => void;
  city: string;
  setCity: (value: string) => void;
  postalCode: string;
  setPostalCode: (value: string) => void;
  priceType: 'all' | 'negotiable' | 'fixed' | 'wholesale';
  setPriceType: (value: 'all' | 'negotiable' | 'fixed' | 'wholesale') => void;
  sortBy: 'price' | 'latest' | 'rating' | 'distance';
  setSortBy: (value: 'price' | 'latest' | 'rating' | 'distance') => void;
  isLocationEnabled?: boolean;
}

const InboxFilters: React.FC<InboxFiltersProps> = ({
  minRating,
  setMinRating,
  languages,
  setLanguages,
  city,
  setCity,
  postalCode,
  setPostalCode,
  priceType,
  setPriceType,
  sortBy,
  setSortBy,
  isLocationEnabled = false
}) => {
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

  // Helper to check if rating filter is active
  const isRatingActive = minRating[0] > 0;

  // Helper to check if language filter is active
  const isLanguageActive = languages.length > 0;

  // Helper to check if location filters are active
  const isLocationActive = city.trim() !== '' || postalCode.trim() !== '';

  // Helper to check if price type filter is active
  const isPriceTypeActive = priceType !== 'all';

  // Count active filters
  const activeFilterCount = [
    isRatingActive,
    isLanguageActive,
    isLocationActive,
    isPriceTypeActive
  ].filter(Boolean).length;

  // Handle language selection
  const handleLanguageToggle = (languageId: string) => {
    if (languages.includes(languageId)) {
      setLanguages(languages.filter(id => id !== languageId));
    } else {
      setLanguages([...languages, languageId]);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setMinRating([0]);
    setLanguages([]);
    setCity('');
    setPostalCode('');
    setPriceType('all');
    setActiveFilter(null);
  };

  // Get language names for display
  const getLanguageNames = (languageIds: string[]) => {
    return languageIds
      .map(id => availableLanguages.find(lang => lang.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
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
                {minRating[0]}+
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
                  <span className="text-sm font-medium">{minRating[0] === 0 ? 'Any' : `${minRating[0]}+`}</span>
                </div>
              </div>
              <Slider 
                id="rating" 
                value={minRating} 
                min={0} 
                max={100} 
                step={5} 
                onValueChange={setMinRating} 
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
                {languages.length}
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
                      checked={languages.includes(language.id)}
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="postalCode" className="text-sm font-medium">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="Enter postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
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
            <Select value={priceType} onValueChange={setPriceType}>
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

      {/* Sort By */}
      <div className="flex items-center gap-2 ml-4">
        <Label className="text-sm font-medium whitespace-nowrap">Sort by:</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            {isLocationEnabled && (
              <SelectItem value="distance">Distance</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Clear All Filters */}
      {activeFilterCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAllFilters}
          className="ml-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear ({activeFilterCount})
        </Button>
      )}

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1 ml-2">
          {isRatingActive && (
            <Badge variant="secondary" className="text-xs">
              Rating: {minRating[0]}+
            </Badge>
          )}
          {isLanguageActive && (
            <Badge variant="secondary" className="text-xs">
              Languages: {languages.length}
            </Badge>
          )}
          {isLocationActive && (
            <Badge variant="secondary" className="text-xs">
              Location
            </Badge>
          )}
          {isPriceTypeActive && (
            <Badge variant="secondary" className="text-xs">
              {priceType}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default InboxFilters; 