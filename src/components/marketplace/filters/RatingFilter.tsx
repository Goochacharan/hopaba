
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface RatingFilterProps {
  ratingFilter: number;
  setRatingFilter: (rating: number) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

const RatingFilter: React.FC<RatingFilterProps> = ({
  ratingFilter,
  setRatingFilter,
  activeFilter,
  setActiveFilter
}) => {
  const isRatingFilterActive = ratingFilter > 0;

  return (
    <Popover open={activeFilter === 'rating'} onOpenChange={open => setActiveFilter(open ? 'rating' : null)}>
      <PopoverTrigger asChild>
        <Button 
          variant={isRatingFilterActive ? "default" : "outline"} 
          size="icon" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-8 h-8 relative p-0", 
            activeFilter === 'rating' && "border-primary ring-2 ring-primary/20", 
            isRatingFilterActive && "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
          )}
        >
          <Star className="h-4 w-4" />
          {isRatingFilterActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium">
              {ratingFilter}+
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Minimum Seller Rating</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Show results rated</span>
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
                <span className="text-sm font-medium">{ratingFilter}+</span>
              </div>
            </div>
            <Slider value={[ratingFilter]} min={0} max={5} step={0.5} onValueChange={value => setRatingFilter(value[0])} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RatingFilter;
