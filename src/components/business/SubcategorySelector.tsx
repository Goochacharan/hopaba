
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubcategories } from '@/hooks/useCategories';
import { Check, ChevronDown } from 'lucide-react';
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
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  
  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="w-full">
      <Select 
        value={selectedValue} 
        onValueChange={handleValueChange}
        disabled={disabled || isLoading || !categoryId}
      >
        <SelectTrigger 
          className={cn(
            "w-full border-2 py-6 px-4 bg-white text-base font-medium rounded-xl shadow-md",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            selectedValue ? "border-primary/70 text-primary" : "border-gray-200",
            className
          )}
        >
          <SelectValue placeholder="Select subcategory" />
        </SelectTrigger>
        <SelectContent 
          className="w-[var(--radix-select-trigger-width)] max-h-[300px] bg-white border-2 border-gray-100 shadow-xl rounded-xl"
          position="popper"
          sideOffset={8}
        >
          <div className="py-2 px-1">
            <SelectItem 
              value="" 
              className="py-3 px-2 text-base rounded-lg focus:bg-primary/10 focus:text-primary"
            >
              All subcategories
            </SelectItem>
            {subcategories && subcategories.map((subcategory) => (
              <SelectItem 
                key={subcategory.id} 
                value={subcategory.name}
                className="py-3 px-2 text-base rounded-lg focus:bg-primary/10 focus:text-primary"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{subcategory.name}</span>
                  {selectedValue === subcategory.name && (
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
