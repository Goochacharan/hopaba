
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubcategories } from '@/hooks/useCategories';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubcategorySelectorProps {
  categoryId?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  isVisible?: boolean;
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({ 
  categoryId, 
  value, 
  onChange,
  className,
  disabled = false,
  isVisible = true
}) => {
  const { data: subcategories, isLoading } = useSubcategories(categoryId);
  const [selectedValue, setSelectedValue] = useState<string>(value || 'all');
  
  useEffect(() => {
    setSelectedValue(value || 'all');
  }, [value]);
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };
  
  if (!isVisible) return null;

  // Convert empty value to 'all' for display, and map 'all' to empty string for the parent component
  const displayValue = selectedValue === '' ? 'all' : selectedValue;
  const subcategoryCount = subcategories?.length || 0;
  
  return (
    <div className="w-full">
      <Select 
        value={displayValue} 
        onValueChange={handleValueChange}
        disabled={disabled || isLoading || !categoryId}
      >
        <SelectTrigger 
          className={cn(
            "w-full border-2 py-6 px-4 bg-white text-base font-medium rounded-xl shadow-md",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            displayValue !== 'all' ? "border-primary text-primary font-semibold" : "border-gray-200",
            className
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 opacity-70" />
              <SelectValue placeholder={`Select subcategory (${subcategoryCount})`} />
            </div>
          </div>
        </SelectTrigger>
        <SelectContent 
          className="w-[var(--radix-select-trigger-width)] max-h-[300px] bg-white border-2 border-gray-100 shadow-xl rounded-xl"
          position="popper"
          sideOffset={8}
        >
          <div className="py-2 px-1 max-h-[250px] overflow-y-auto">
            <SelectItem 
              value="all" 
              className="py-3 px-2 text-base rounded-lg focus:bg-primary/10 focus:text-primary"
            >
              <div className="flex items-center justify-between w-full">
                <span>All subcategories</span>
                {displayValue === 'all' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </SelectItem>
            {subcategories && subcategories.map((subcategory) => (
              <SelectItem 
                key={subcategory.id} 
                value={subcategory.name}
                className="py-3 px-2 text-base rounded-lg focus:bg-primary/10 focus:text-primary"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{subcategory.name}</span>
                  {displayValue === subcategory.name && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="mt-2 text-sm text-muted-foreground">
          Loading subcategories...
        </div>
      )}
    </div>
  );
};

export default SubcategorySelector;
