
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Globe, Clock, Loader2 } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useBusinessDetail } from '@/hooks/useBusinessDetail';
import ImageViewer from '@/components/ImageViewer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const BusinessDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: business, isLoading, error } = useBusinessDetail(id);
  
  // State for image viewer
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle image click to open the image viewer
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error</h2>
          <p className="text-gray-500">Failed to load business details.</p>
        </div>
      </MainLayout>
    );
  }

  if (!business) {
    return (
      <MainLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Business Not Found</h2>
          <p className="text-gray-500">The requested business could not be found.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Business Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {business.images && business.images.length > 0 && (
                <div className="md:w-1/3">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {business.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div 
                            className="relative aspect-[4/3] w-full overflow-hidden rounded-lg cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          >
                            <img 
                              src={image} 
                              alt={`${business.name} image ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {business.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                    <Badge variant="secondary" className="mb-2">
                      {business.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">{business.description}</p>
                
                <div className="space-y-2">
                  {business.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{business.address}</span>
                    </div>
                  )}
                  
                  {business.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{business.contact_phone}</span>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                  
                  {business.availability && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{business.availability}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Viewer */}
        {business.images && business.images.length > 0 && (
          <ImageViewer 
            images={business.images}
            initialIndex={currentImageIndex}
            open={isImageViewerOpen}
            onOpenChange={setIsImageViewerOpen}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default BusinessDetails;
