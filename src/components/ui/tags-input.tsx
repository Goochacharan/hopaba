
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './input';
import { Badge } from './badge';

interface TagsInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
}

export function TagsInput({ placeholder, tags, setTags }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button 
              type="button"
              onClick={() => removeTag(tag)} 
              className="w-4 h-4 rounded-full flex items-center justify-center"
              aria-label="Remove tag"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        type="text"
        placeholder={placeholder || "Type and press Enter to add"}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
    </div>
  );
}
