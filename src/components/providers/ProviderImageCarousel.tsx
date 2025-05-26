
import React, { useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderImageCarouselProps {
  images: string[];
  providerName: string;
  className?: string;
}

const ProviderImageCarousel: React.FC<ProviderImageCarouselProps> = ({
  images,
  providerName,
  className
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={cn("relative", className)}>
        <AspectRatio ratio={16 / 9}>
          <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
            <span className="text-muted-foreground text-sm">No images available</span>
          </div>
        </AspectRatio>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={cn("relative group", className)}>
      <AspectRatio ratio={16 / 9}>
        <img
          src={images[currentImageIndex]}
          alt={`${providerName} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover rounded-md"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Navigation arrows - only show if more than one image */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={previousImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Dots indicator - only show if more than one image */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentImageIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/75"
                )}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </AspectRatio>
    </div>
  );
};

export default ProviderImageCarousel;
