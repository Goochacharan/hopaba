
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  value?: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, value = [], onChange }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(value);

  const handleToggle = (item: string) => {
    const newSelection = selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item];
    setSelectedItems(newSelection);
    onChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedItems.map(item => (
          <Badge key={item} variant="secondary" className="flex items-center gap-1">
            {item}
            <X className="w-3 h-3 cursor-pointer" onClick={() => handleToggle(item)} />
          </Badge>
        ))}
      </div>
      <Select onValueChange={handleToggle}>
        <SelectTrigger>
          <SelectValue placeholder="Select options..." />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
