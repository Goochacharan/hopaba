
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  loadingClassName?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  loadingClassName,
  priority = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading when image is 50px from viewport
        threshold: 0.1
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const onLoad = () => {
    setIsLoading(false);
  };

  const onError = () => {
    setIsLoading(false);
    setError(true);
    console.error(`Failed to load image: ${src}`);
  };

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!src || src.startsWith('data:')) return undefined;
    
    const sizes = [320, 640, 960, 1280];
    return sizes
      .map(size => {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('width', size.toString());
        return `${url.toString()} ${size}w`;
      })
      .join(', ');
  };

  return (
    <div className={cn("relative", className)}>
      {isLoading && !error && (
        <Skeleton className={cn(
          "absolute inset-0 bg-muted/30",
          loadingClassName
        )} />
      )}
      <img
        ref={imageRef}
        src={shouldLoad ? src : undefined}
        srcSet={shouldLoad ? generateSrcSet() : undefined}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        loading={priority ? "eager" : "lazy"}
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10 text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
};
