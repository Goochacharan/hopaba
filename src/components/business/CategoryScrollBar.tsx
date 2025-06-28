
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

interface CategoryScrollBarProps {
  selected: string;
  onSelect: (category: string) => void;
  selectedSubcategory?: string[];
  onSubcategorySelect?: (subcategories: string[]) => void;
  className?: string; // Add className prop
}

const CategoryScrollBar: React.FC<CategoryScrollBarProps> = ({
  selected,
  onSelect,
  selectedSubcategory = [],
  onSubcategorySelect,
  className // Add className parameter
}) => {
  const { data: categories = [], isLoading } = useCategories();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    if (!categories) return [];

    // Filter out categories without names
    const validCategories = categories.filter(cat => cat.name);

    // Sort categories alphabetically by name
    validCategories.sort((a, b) => a.name.localeCompare(b.name));

    return validCategories;
  }, [categories]);

  return (
    <ScrollArea className={cn("w-full pb-1", className)}>
      <div className="flex items-center gap-1 px-1 py-1 overflow-x-auto min-w-max">
        {/* All Categories Button - Made more compact */}
        <Button
          variant={selected === 'All' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect('All')}
          className={cn(
            "flex-shrink-0 rounded-full h-6 px-2 text-xs font-medium border transition-colors",
            selected === 'All'
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
              : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          )}
        >
          All
        </Button>

        {/* Category Buttons - Made more compact */}
        {availableCategories.map((category) => {
          const hasSubcategories = category.subcategories && category.subcategories.length > 0;
          const isSelected = selected === category.name;
          const hasSelectedSubcategory = selectedSubcategory.length > 0 && isSelected;

          if (!hasSubcategories) {
            return (
              <Button
                key={category.name}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelect(category.name)}
                className={cn(
                  "flex-shrink-0 rounded-full h-6 px-2 text-xs font-medium border transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {category.name}
              </Button>
            );
          }

          return (
            <Popover
              key={category.name}
              open={openPopoverId === category.name}
              onOpenChange={(open) => setOpenPopoverId(open ? category.name : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "flex-shrink-0 rounded-full h-6 px-2 text-xs font-medium border transition-colors gap-1",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {category.name}
                  {hasSelectedSubcategory && (
                    <span className="bg-white/20 text-xs px-1 rounded">
                      {selectedSubcategory.length}
                    </span>
                  )}
                  {openPopoverId === category.name ? (
                    <ChevronUp className="h-2 w-2" />
                  ) : (
                    <ChevronDown className="h-2 w-2" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{category.name} Subcategories</h4>
                  <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto">
                    {category.subcategories?.map((subcategory) => (
                      <Button
                        key={subcategory}
                        variant={selectedSubcategory.includes(subcategory) ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          onSelect(category.name);
                          if (onSubcategorySelect) {
                            if (selectedSubcategory.includes(subcategory)) {
                              onSubcategorySelect(selectedSubcategory.filter(s => s !== subcategory));
                            } else {
                              onSubcategorySelect([subcategory]);
                            }
                          }
                          setOpenPopoverId(null);
                        }}
                        className="justify-start text-xs h-6"
                      >
                        {subcategory}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default CategoryScrollBar;
