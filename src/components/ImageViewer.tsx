import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex,
  open,
  onOpenChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;
  
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      resetView();
      
      document.body.style.overflow = 'hidden';
      document.body.classList.add('image-viewer-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('image-viewer-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('image-viewer-open');
    };
  }, [open, initialIndex]);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 0.5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex];
    link.download = `image-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const x = e.clientX - dragStart.x;
      const y = e.clientY - dragStart.y;
      setPosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    
    if (isDragging && scale > 1) {
      const x = e.touches[0].clientX - dragStart.x;
      const y = e.touches[0].clientY - dragStart.y;
      setPosition({ x, y });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    
    if (scale > 1) return;
    
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrevious();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goPrevious = () => {
    resetView();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goNext = () => {
    resetView();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goPrevious();
    } else if (e.key === 'ArrowRight') {
      goNext();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === '+') {
      handleZoomIn();
    } else if (e.key === '-') {
      handleZoomOut();
    } else if (e.key === 'r') {
      handleRotate();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-none bg-black/95 z-[9999]"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="fixed top-4 right-4 z-[10000] flex gap-2">
          <button 
            onClick={handleZoomIn} 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={handleZoomOut} 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={handleRotate} 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Rotate"
          >
            <RotateCw size={20} />
          </button>
          <button 
            onClick={handleDownload} 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Download"
          >
            <Download size={20} />
          </button>
          <DialogClose className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70" aria-label="Close">
            <X size={20} />
          </DialogClose>
        </div>

        <div 
          className="w-full h-full flex items-center justify-center cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imageRef}
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-100"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            draggable={false}
          />
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center">
            <div className="flex gap-2 p-3 bg-black/60 rounded-full overflow-x-auto max-w-[90vw]">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-lg overflow-hidden cursor-pointer border-2",
                    currentIndex === idx ? "border-[#1EAEDB]" : "border-transparent"
                  )}
                  onClick={() => {
                    resetView();
                    setCurrentIndex(idx);
                  }}
                >
                  <AspectRatio ratio={1/1} className="w-12 h-12">
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={goPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 z-[10000]"
              aria-label="Previous image"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 z-[10000]"
              aria-label="Next image"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;
