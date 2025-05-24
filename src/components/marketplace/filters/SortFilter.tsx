
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SortFilterProps {
  sortOption: string;
  onSortChange: (option: string) => void;
}

const SortFilter: React.FC<SortFilterProps> = ({ sortOption, onSortChange }) => {
  const isSortFilterActive = sortOption !== 'newest';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={isSortFilterActive ? "default" : "outline"} 
          size="sm" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-8 h-8 relative p-0",
            isSortFilterActive && "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
          )}
        >
          <ChevronDown className="h-3 w-3" />
          {isSortFilterActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium">
              •
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48 p-2">
        <div className="space-y-1">
          <Button variant={sortOption === 'newest' ? "default" : "ghost"} size="sm" className="w-full justify-start" onClick={() => onSortChange('newest')}>
            Newest First
          </Button>
          <Button variant={sortOption === 'price-low-high' ? "default" : "ghost"} size="sm" className="w-full justify-start" onClick={() => onSortChange('price-low-high')}>
            Price: Low to High
          </Button>
          <Button variant={sortOption === 'price-high-low' ? "default" : "ghost"} size="sm" className="w-full justify-start" onClick={() => onSortChange('price-high-low')}>
            Price: High to Low
          </Button>
          <Button variant={sortOption === 'top-rated' ? "default" : "ghost"} size="sm" className="w-full justify-start" onClick={() => onSortChange('top-rated')}>
            Top Rated
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SortFilter;
