
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import SortButton, { SortOption } from '@/components/SortButton';

interface ProviderFiltersProps {
  cities: string[];
  onFilterChange: (filters: ProviderFilters) => void;
  onSortChange: (option: SortOption) => void;
  currentSort: SortOption;
}

export interface ProviderFilters {
  minRating: number;
  city: string | null;
}

const ProviderFilters: React.FC<ProviderFiltersProps> = ({
  cities,
  onFilterChange,
  onSortChange,
  currentSort
}) => {
  const [filters, setFilters] = useState<ProviderFilters>({
    minRating: 0,
    city: null
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const clearFilters = () => {
    const newFilters = { minRating: 0, city: null };
    setFilters(newFilters);
    onFilterChange(newFilters);
    setIsFilterOpen(false);
  };
  
  const activeFilterCount = (
    (filters.minRating > 0 ? 1 : 0) + 
    (filters.city ? 1 : 0)
  );
  
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={activeFilterCount > 0 ? "default" : "outline"} 
              size="sm"
              className={cn(
                "flex items-center gap-1 rounded-full relative",
                activeFilterCount > 0 && "bg-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-1 bg-background text-foreground h-5 w-5 p-0 flex items-center justify-center rounded-full"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Rating</h4>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={filters.minRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('minRating', rating)}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>
              
              {cities.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">City</h4>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={filters.city === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('city', null)}
                    >
                      Any
                    </Button>
                    {cities.map((city) => (
                      <Button
                        key={city}
                        variant={filters.city === city ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange('city', city)}
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Active filter badges */}
        <div className="flex flex-wrap gap-1">
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.minRating}+ Stars
              <button 
                className="ml-1 hover:bg-muted rounded-full"
                onClick={() => handleFilterChange('minRating', 0)}
              >
                ×
              </button>
            </Badge>
          )}
          
          {filters.city && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.city}
              <button 
                className="ml-1 hover:bg-muted rounded-full"
                onClick={() => handleFilterChange('city', null)}
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      </div>
      
      <SortButton 
        currentSort={currentSort} 
        onSortChange={onSortChange} 
      />
    </div>
  );
};

export default ProviderFilters;
