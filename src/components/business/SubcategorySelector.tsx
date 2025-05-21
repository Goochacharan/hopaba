
import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubcategories } from '@/hooks/useCategories';
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SubcategorySelectorProps {
  categoryId?: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
  isVisible?: boolean;
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({ 
  categoryId, 
  value = [],
  onChange,
  className,
  disabled = false,
  isVisible = true
}) => {
  const { data: subcategories, isLoading } = useSubcategories(categoryId);
  const [selectedValues, setSelectedValues] = useState<string[]>(value || []);
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    // Ensure value is always treated as an array
    setSelectedValues(Array.isArray(value) ? value : value ? [value] : []);
  }, [value]);
  
  const handleValueChange = (newValue: string) => {
    let updatedValues: string[];
    
    if (newValue === 'all') {
      // Clear all selections when "All subcategories" is selected
      updatedValues = [];
    } else if (selectedValues.includes(newValue)) {
      // Remove the value if it's already selected
      updatedValues = selectedValues.filter(v => v !== newValue);
    } else {
      // Add the new value
      updatedValues = [...selectedValues, newValue];
    }
    
    setSelectedValues(updatedValues);
    onChange(updatedValues);
  };
  
  const removeValue = (valueToRemove: string) => {
    const updatedValues = selectedValues.filter(v => v !== valueToRemove);
    setSelectedValues(updatedValues);
    onChange(updatedValues);
  };
  
  if (!isVisible) return null;

  const subcategoryCount = subcategories?.length || 0;
  const hasSelections = selectedValues.length > 0;
  
  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div 
            className={cn(
              "w-full border-2 py-4 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-between",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              hasSelections ? "border-primary text-primary font-medium" : "border-gray-200",
              className
            )}
            role="button"
            aria-expanded={open}
            aria-disabled={disabled || isLoading || !categoryId}
            tabIndex={0}
            onClick={() => !disabled && !isLoading && categoryId && setOpen(true)}
          >
            <div className="flex items-center gap-2 w-full flex-wrap overflow-hidden">
              <Filter className="h-4 w-4 shrink-0 opacity-70" />
              {!hasSelections ? (
                <span className="text-muted-foreground">
                  {`Select subcategories (${subcategoryCount})`}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedValues.map(item => (
                    <Badge 
                      key={item} 
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {item}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeValue(item);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] max-h-[300px] p-0" 
          align="start" 
          side="bottom"
          sideOffset={8}
        >
          <Command>
            <CommandInput placeholder="Search subcategories..." />
            <CommandList className="max-h-[250px] overflow-y-auto">
              <CommandEmpty>No subcategories found.</CommandEmpty>
              <CommandGroup>
                {subcategories?.map((subcategory) => (
                  <CommandItem 
                    key={subcategory.id}
                    value={subcategory.name}
                    onSelect={() => handleValueChange(subcategory.name)}
                    className="py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{subcategory.name}</span>
                      {selectedValues.includes(subcategory.name) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isLoading && (
        <div className="mt-2 text-sm text-muted-foreground">
          Loading subcategories...
        </div>
      )}
    </div>
  );
};

export default SubcategorySelector;
