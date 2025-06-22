
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface LocationHeaderProps {
  name: string;
  rating: number;
  reviewCount: number;
  images: string[];
  onImageClick: (index: number) => void;
}

const LocationHeader = ({ name, rating, reviewCount, onImageClick, images }: LocationHeaderProps) => {
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(Array(images.length).fill(false));

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const totalStars = 5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="fill-amber-500 stroke-amber-500 w-4 h-4" />
        ))}
        
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <Star className="absolute stroke-amber-500 w-4 h-4" />
            <div className="absolute overflow-hidden w-[50%]">
              <Star className="fill-amber-500 stroke-amber-500 w-4 h-4" />
            </div>
          </div>
        )}
        
        {[...Array(totalStars - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="stroke-amber-500 w-4 h-4" />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-6">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Carousel className="w-full h-full">
          <CarouselContent className="h-full">
            {images.map((img, index) => (
              <CarouselItem key={index} className="h-full relative">
                <div className={`absolute inset-0 bg-muted/30 ${imageLoaded[index] ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} />
                <img 
                  src={img} 
                  alt={`${name} - image ${index + 1}`} 
                  className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded[index] ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'} cursor-pointer`} 
                  onLoad={() => handleImageLoad(index)}
                  onClick={() => onImageClick(index)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </div>
      
      <div className="p-6">
        <div className="mb-2">
          <h1 className="text-3xl font-bold">{name}</h1>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {renderStarRating(rating)}
            <span className="text-xs text-muted-foreground ml-1.5">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationHeader;
