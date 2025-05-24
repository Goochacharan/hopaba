
import React from 'react';
import { MapPin, Calendar, Film } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ListingMetadataProps {
  location: string | null;
  createdAt: string;
  condition: string;
  sellerInstagram?: string | null;
  sellerName?: string;
  showInCard?: boolean;
  modelYear?: string | null;
}

const ListingMetadata: React.FC<ListingMetadataProps> = ({
  location,
  createdAt,
  condition,
  sellerInstagram,
  sellerName,
  showInCard = false,
  modelYear
}) => {
  const { toast } = useToast();

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerInstagram) {
      console.log("Opening video content:", sellerInstagram);
      window.open(sellerInstagram, '_blank');
      toast({
        title: "Opening video content",
        description: `Visiting ${sellerName || 'seller'}'s video content`,
        duration: 2000
      });
    } else {
      toast({
        title: "Video content not available",
        description: "The seller has not provided any video links",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-sm text-muted-foreground py-0 my-0">
      {location && (
        <div className="flex items-center gap-1 py-[3px]">
          <MapPin className="h-3 w-3" />
          <span className="text-sm">{location}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1 my-0 py-0 px-0">
        <Calendar className="h-3 w-3" />
        <span className="text-xs">
          Listed on {format(new Date(createdAt), 'PPP')}
          {modelYear && ` • ${modelYear}`}
        </span>
        
        {sellerInstagram && (
          <button 
            onClick={handleInstagramClick} 
            title="Watch video content" 
            className="bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 hover:shadow-md transition-all ml-2 shadow-[0_4px_0px_0px_rgba(0,0,0,0.25)] hover:shadow-[0_2px_0px_0px_rgba(0,0,0,0.25)] active:shadow-none active:translate-y-[3px] flex items-center gap-1 rounded text-base font-bold my-0 px-[6px] py-px mx-[40px]"
          >
            <Film className="h-5 w-5 text-white" />
            <span className="text-white text-xs">Video</span>
          </button>
        )}
      </div>
      {/* Condition badge has been moved to the image */}
    </div>
  );
};

export default ListingMetadata;
