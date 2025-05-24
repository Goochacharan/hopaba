
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Sparkles, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlist } from '@/contexts/WishlistContext';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

interface ListingImageCarouselProps {
  images: string[] | null;
  onImageClick?: (index: number) => void;
  className?: string;
  listing: MarketplaceListing;
  isDamageImages?: boolean;
}

const ListingImageCarousel: React.FC<ListingImageCarouselProps> = ({
  images,
  onImageClick,
  className,
  listing,
  isDamageImages = false
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist
  } = useWishlist();
  const {
    toast
  } = useToast();
  const isInWishlistAlready = isInWishlist(listing.id, 'marketplace');
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const imageArray = images && images.length > 0 ? images : ['/placeholder.svg'];

  const isNew = differenceInDays(new Date(), new Date(listing.created_at)) < 7;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? imageArray.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === imageArray.length - 1 ? 0 : prev + 1);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (onImageClick) {
      e.stopPropagation();
      onImageClick(currentImageIndex);
    }
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWishlistAlready) {
      removeFromWishlist(listing.id, 'marketplace');
    } else {
      addToWishlist({...listing, type: 'marketplace'});
    }
  };

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (listing?.seller_instagram) {
      window.open(listing.seller_instagram, '_blank');
      
      if (toast) {
        toast({
          title: "Opening Instagram",
          description: "Redirecting to Instagram...",
          duration: 3000,
        });
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && imageArray.length > 1) {
      e.stopPropagation();
      setCurrentImageIndex(prev => prev === imageArray.length - 1 ? 0 : prev + 1);
    } else if (isRightSwipe && imageArray.length > 1) {
      e.stopPropagation();
      setCurrentImageIndex(prev => prev === 0 ? imageArray.length - 1 : prev - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Check if parent has search-result-card class to determine if we're in search results
  const isInSearchResults = className?.includes('search-result-card');
  const isLocationDetailsPage = window.location.pathname.includes('/location/');
  const shouldIncreaseHeight = isInSearchResults || isLocationDetailsPage;
  
  // Adjust image height based on context
  const imageHeightClass = shouldIncreaseHeight 
    ? "h-[400px]" // Increased height for search results and location details
    : "h-full";

  return (
    <div className={cn("relative group", className)}>
      <AspectRatio ratio={4 / 5} className="bg-muted">
        <img 
          src={imageArray[currentImageIndex]} 
          alt={`Product image ${currentImageIndex + 1}`} 
          className={cn(
            "w-full cursor-pointer", 
            imageHeightClass, 
            "object-cover" // Always use object-cover for proper fitting
          )} 
          onClick={handleImageClick} 
          onTouchStart={onTouchStart} 
          onTouchMove={onTouchMove} 
          onTouchEnd={onTouchEnd} 
        />
        
        {!isDamageImages && (
          <Button size="icon" variant="secondary" className={cn("absolute top-2 right-2 z-10 opacity-90 shadow-md", isInWishlistAlready ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background text-foreground")} onClick={toggleWishlist}>
            <Heart className={cn("h-5 w-5", isInWishlistAlready ? "fill-current" : "")} />
          </Button>
        )}

        {isDamageImages && (
          <Badge 
            variant="destructive" 
            className="absolute top-2 left-2 z-10"
          >
            Damage/Scratch Photo
          </Badge>
        )}

        {isNew && !isDamageImages && <div className="absolute top-2 left-2 z-10 text-white text-L font-semibold py-0.5 rounded flex items-center gap-1 shadow-md mx-0 my-0 bg-[#b123bc] px-[14px]">
            <Sparkles className="h-3 w-3" />
            New post
          </div>}
          
        {/* Position the condition badge in the bottom-right corner of the image */}
        {!isDamageImages && (
          <Badge 
            variant="outline" 
            className="absolute bottom-2 right-2 z-10 flex items-center gap-1 text-amber-600 bg-amber-50/90 shadow-sm border-amber-200"
          >
            <BadgeCheck className="h-3 w-3" />
            <span>{listing.condition}</span>
          </Badge>
        )}

        {imageArray.length > 1 && (
          <>
            <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/70" onClick={handlePreviousImage}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background/70" onClick={handleNextImage}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </AspectRatio>
      
      {imageArray.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {imageArray.map((_, index) => (
            <button 
              key={index} 
              className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-primary scale-125' : 'bg-background/70 hover:bg-background'}`} 
              onClick={e => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }} 
              aria-label={`View image ${index + 1}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingImageCarousel;
