
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface YearFilterProps {
  yearRange: [number, number];
  setYearRange: (range: [number, number]) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

const YearFilter: React.FC<YearFilterProps> = ({
  yearRange,
  setYearRange,
  activeFilter,
  setActiveFilter
}) => {
  const isYearFilterActive = yearRange[0] > 2010 || yearRange[1] < new Date().getFullYear();

  return (
    <Popover open={activeFilter === 'year'} onOpenChange={open => setActiveFilter(open ? 'year' : null)}>
      <PopoverTrigger asChild>
        <Button 
          variant={isYearFilterActive ? "default" : "outline"} 
          size="icon" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-8 h-8 relative p-0", 
            activeFilter === 'year' && "border-primary ring-2 ring-primary/20", 
            isYearFilterActive && "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
          )}
        >
          <Calendar className="h-4 w-4" />
          {isYearFilterActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium">
              {yearRange[0].toString().slice(-2)}-{yearRange[1].toString().slice(-2)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Model Year Range</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm font-medium">{yearRange[0]}</span>
            </div>
            <Slider value={[yearRange[0]]} min={2000} max={new Date().getFullYear()} step={1} onValueChange={value => setYearRange([value[0], yearRange[1]])} />
            <div className="flex justify-between mt-4">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm font-medium">{yearRange[1]}</span>
            </div>
            <Slider value={[yearRange[1]]} min={2000} max={new Date().getFullYear()} step={1} onValueChange={value => setYearRange([yearRange[0], value[0]])} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default YearFilter;
