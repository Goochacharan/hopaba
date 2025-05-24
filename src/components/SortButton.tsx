
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SortOption = 'rating' | 'distance' | 'reviewCount' | 'newest';

interface SortButtonProps {
  onSortChange: (option: SortOption) => void;
  currentSort: SortOption;
}

const SortButton: React.FC<SortButtonProps> = ({ onSortChange, currentSort }) => {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'rating', label: 'Rating (High to Low)' },
    { value: 'distance', label: 'Distance (Near to Far)' },
    { value: 'reviewCount', label: 'Review Count' },
    { value: 'newest', label: 'Newest First' },
  ];

  // Check if a non-default sort is applied (something other than 'rating')
  const isSortActive = currentSort !== 'rating';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isSortActive ? "default" : "outline"} 
          size="icon" 
          className={cn(
            "rounded-full border border-border/60 flex items-center justify-center bg-background w-10 h-10 relative shadow-[0_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[3px] transition-all",
            isSortActive && "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          <ArrowUpDown className="h-4 w-4" />
          {isSortActive && (
            <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-primary text-white">
              •
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={currentSort === option.value ? "bg-secondary font-medium" : ""}
            onClick={() => onSortChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortButton;
