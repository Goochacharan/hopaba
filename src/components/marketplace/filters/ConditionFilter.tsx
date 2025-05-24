
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface ConditionFilterProps {
  conditionFilter: string;
  setConditionFilter: (condition: string) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
}

const ConditionFilter: React.FC<ConditionFilterProps> = ({
  conditionFilter,
  setConditionFilter,
  activeFilter,
  setActiveFilter
}) => {
  const isConditionFilterActive = conditionFilter !== 'all';

  return (
    <Popover open={activeFilter === 'condition'} onOpenChange={open => setActiveFilter(open ? 'condition' : null)}>
      <PopoverTrigger asChild>
        <Button 
          variant={isConditionFilterActive ? "default" : "outline"} 
          size="icon" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-8 h-8 relative p-0", 
            activeFilter === 'condition' && "border-primary ring-2 ring-primary/20", 
            isConditionFilterActive && "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
          )}
        >
          <Layers className="h-4 w-4" />
          {isConditionFilterActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium">
              •
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h4 className="font-medium">Item Condition</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={conditionFilter === 'all' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('all')}>
              All
            </Button>
            <Button variant={conditionFilter === 'new' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('new')}>
              New
            </Button>
            <Button variant={conditionFilter === 'like new' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('like new')}>
              Like New
            </Button>
            <Button variant={conditionFilter === 'good' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('good')}>
              Good
            </Button>
            <Button variant={conditionFilter === 'fair' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('fair')}>
              Fair
            </Button>
            <Button variant={conditionFilter === 'poor' ? "default" : "outline"} size="sm" onClick={() => setConditionFilter('poor')}>
              Poor
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConditionFilter;
