
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, IndianRupee, Clock, MapPin, Phone, Instagram, Film, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  availability?: string;
  area?: string;
  city?: string;
  contact_phone?: string;
  instagram?: string;
  tags?: string[];
}

interface BusinessCardProps {
  business: Business;
  onEdit: (business: Business) => void;
  onDelete: (id: string) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onEdit, onDelete }) => {
  const { toast } = useToast();

  const handleInstagramClick = (e: React.MouseEvent, instagram: string | undefined, businessName: string) => {
    e.stopPropagation();
    if (instagram) {
      window.open(instagram, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening video content",
        description: `Visiting ${businessName}'s video content`,
        duration: 2000
      });
    } else {
      toast({
        title: "Video content not available",
        description: "This business has not provided any video links",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  return (
    <Card key={business.id} className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex justify-between items-start">
          <span>{business.name}</span>
          <span className="text-sm font-normal text-muted-foreground px-2 py-1 bg-muted rounded-md">
            {business.category}
          </span>
        </CardTitle>
        <CardDescription className="line-clamp-none">
          <ScrollArea className="min-h-[12em] max-h-[12em] pr-3">
            <p className="whitespace-pre-line leading-relaxed text-base font-normal text-slate-700">
              {business.description}
            </p>
          </ScrollArea>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span>
              ₹{business.price_range_min} - ₹{business.price_range_max} {business.price_unit}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{business.availability}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{business.area}, {business.city}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{business.contact_phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <span>{business.instagram}</span>
          {business.instagram && (
            <button 
              onClick={(e) => handleInstagramClick(e, business.instagram, business.name)}
              title="Watch video content" 
              className="bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 rounded-full hover:shadow-md transition-all ml-2 px-4 py-2 flex items-center"
            >
              <Film className="h-5 w-5 text-white mr-1" />
              <span className="text-white text-xs font-medium">Video</span>
            </button>
          )}
        </div>
        
        {business.tags && business.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Popular Items/Services:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/10 gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(business)}
          className="flex items-center gap-1"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(business.id)}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BusinessCard;
