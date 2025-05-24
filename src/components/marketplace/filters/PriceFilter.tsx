
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { IndianRupee } from 'lucide-react';

interface PriceFilterProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({
  priceRange,
  setPriceRange,
  activeFilter,
  setActiveFilter
}) => {
  const isPriceFilterActive = priceRange[0] > 0 || priceRange[1] < 10000000;

  return (
    <Popover open={activeFilter === 'price'} onOpenChange={open => setActiveFilter(open ? 'price' : null)}>
      <PopoverTrigger asChild>
        <Button 
          variant={isPriceFilterActive ? "default" : "outline"} 
          size="icon" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-8 h-8 relative p-0", 
            activeFilter === 'price' && "border-primary ring-2 ring-primary/20", 
            isPriceFilterActive && "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
          )}
        >
          <IndianRupee className="h-4 w-4" />
          {isPriceFilterActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium">
              ₹
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Price Range</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm font-medium inline-flex items-center">
                <span className="text-sm">₹</span>
                <span className="text-sm">{new Intl.NumberFormat('en-IN', {
                  maximumFractionDigits: 0
                }).format(priceRange[0])}</span>
              </span>
            </div>
            <Slider 
              value={[priceRange[0]]} 
              min={0} 
              max={10000000} 
              step={100000} 
              onValueChange={value => setPriceRange([value[0], priceRange[1]])} 
            />
            <div className="flex justify-between mt-4">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm font-medium inline-flex items-center">
                <span className="text-sm">₹</span>
                <span className="text-sm">{new Intl.NumberFormat('en-IN', {
                  maximumFractionDigits: 0
                }).format(priceRange[1])}</span>
              </span>
            </div>
            <Slider 
              value={[priceRange[1]]} 
              min={0} 
              max={10000000} 
              step={100000} 
              onValueChange={value => setPriceRange([priceRange[0], value[0]])} 
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PriceFilter;
