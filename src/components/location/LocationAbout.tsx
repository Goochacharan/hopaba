
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface LocationAboutProps {
  name: string;
  description: string;
  tags: string[];
  category?: string;
  subcategory?: string;
}

const LocationAbout = ({ name, description, tags, category, subcategory }: LocationAboutProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-6 p-6">
      <h2 className="text-xl font-semibold mb-4">About {name}</h2>
      
      {/* Category and subcategory display */}
      {(category || subcategory) && (
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {category && (
              <Badge variant="outline" className="bg-secondary/50">
                {category}
              </Badge>
            )}
            {subcategory && (
              <Badge variant="outline" className="bg-secondary/30">
                {subcategory}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <ScrollArea className="h-[120px] mb-4">
        <p className="text-muted-foreground">{description}</p>
      </ScrollArea>
      
      <div className="mt-4">
        {tags && tags.length > 0 && tags.map((tag, i) => (
          <span key={i} className="inline-block bg-secondary text-xs px-2 py-1 rounded-full text-muted-foreground mr-2 mb-2">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LocationAbout;
