
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubcategories } from '@/hooks/useCategories';

interface SubcategorySelectorProps {
  categoryId?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({ 
  categoryId, 
  value, 
  onChange,
  className,
  disabled = false
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
  
  return (
    <Select 
      value={selectedValue} 
      onValueChange={handleValueChange}
      disabled={disabled || isLoading || !categoryId}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select subcategory" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All subcategories</SelectItem>
        {subcategories && subcategories.map((subcategory) => (
          <SelectItem key={subcategory.id} value={subcategory.name}>
            {subcategory.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SubcategorySelector;
