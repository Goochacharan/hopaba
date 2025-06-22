
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Globe, Clock, Loader2, Navigation } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { useBusinessDetail } from '@/hooks/useBusinessDetail';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessReviews } from '@/hooks/useBusinessReviews';
import BusinessReviewForm from '@/components/business/BusinessReviewForm';
import BusinessReviewsList from '@/components/business/BusinessReviewsList';
import BusinessActionButtons from '@/components/business/BusinessActionButtons';
import ImageViewer from '@/components/ImageViewer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { calculateAndLogDistance } from '@/utils/distanceUtils';
import RatingBadge from '@/components/business/RatingBadge';
import StarRating from '@/components/marketplace/StarRating';
import { calculateOverallRating } from '@/utils/ratingUtils';
import InteractiveMapInterface from '@/components/business/InteractiveMapInterface';

const BusinessDetails: React.FC = () => {
  const { id } = useParams<{ id: string; }>();
  const { user } = useAuth();
  const { data: business, isLoading, error } = useBusinessDetail(id);
  const [distance, setDistance] = useState<string>('');

  // State for image viewer
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use the new Supabase-based review hook
  const {
    reviews,
    userReview,
    averageRating,
    averageCriteriaRatings,
    totalReviews,
    createReview,
    updateReview,
    isCreating,
    isUpdating
  } = useBusinessReviews(id || '');

  // Use pre-calculated distance from business object for consistency with main shop page
  useEffect(() => {
    const fetchDistance = async () => {
      if (business) {
        try {
          // First check if we have pre-calculated distance (same as main shop page)
          if ((business as any).distanceText) {
            setDistance((business as any).distanceText);
            return;
          }
          
          // If no pre-calculated distance, fall back to calculation
          const addressToUse = business.postal_code || business.address;
          
          if (addressToUse) {
            const result = await calculateAndLogDistance(addressToUse);
            if (result) {
              setDistance(result.distance);
            }
          }
        } catch (error) {
          console.error('Failed to calculate distance:', error);
        }
      }
    };

    fetchDistance();
  }, [business]);

  // Use same calculation as BusinessCardPublic - criteria-based rating
  const ratingOutOf100 = calculateOverallRating(averageCriteriaRatings);

  // Handle image click to open the image viewer
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const handleSubmitReview = async (review: {
    rating: number;
    text: string;
    isMustVisit?: boolean;
    isHiddenGem?: boolean;
    criteriaRatings?: Record<string, number>;
  }) => {
    if (!user) return Promise.reject(new Error("User not authenticated"));
    if (!id) return Promise.reject(new Error("Business ID is missing"));
    
    try {
      if (userReview) {
        await new Promise<void>(resolve => {
          updateReview({
            reviewId: userReview.id,
            reviewData: {
              rating: review.rating,
              text: review.text,
              is_must_visit: review.isMustVisit,
              is_hidden_gem: review.isHiddenGem,
              criteria_ratings: review.criteriaRatings
            }
          });
          resolve();
        });
      } else {
        await new Promise<void>(resolve => {
          createReview({
            business_id: id,
            rating: review.rating,
            text: review.text,
            is_must_visit: review.isMustVisit,
            is_hidden_gem: review.isHiddenGem,
            criteria_ratings: review.criteriaRatings
          });
          resolve();
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // Convert Supabase reviews to the format expected by BusinessReviewsList
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    name: review.reviewer_name,
    date: review.created_at,
    rating: review.rating,
    text: review.text || '',
    isMustVisit: review.is_must_visit || false,
    isHiddenGem: review.is_hidden_gem || false,
    userId: review.user_id,
    criteriaRatings: review.criteria_ratings || {}
  }));

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
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg cursor-pointer" onClick={() => handleImageClick(index)}>
                            <img src={image} alt={`${business.name} image ${index + 1}`} className="object-cover w-full h-full" />
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
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                    <Badge variant="secondary" className="mb-2">
                      {business.category}
                    </Badge>
                    
                    {/* Distance Display */}
                    {distance && (
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {distance} away
                        </span>
                      </div>
                    )}

                    {/* Star Rating Display */}
                    {totalReviews > 0 && (
                      <div className="mb-2">
                        <StarRating 
                          rating={averageRating} 
                          showCount={true} 
                          count={totalReviews} 
                          size="medium"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Circular 100-point Rating Badge */}
                  {totalReviews > 0 && (
                    <div className="flex flex-col items-center">
                      <RatingBadge rating={ratingOutOf100} size="lg" />
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">{business.description}</p>
                
                <div className="space-y-2">
                  {(business.area || business.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{[business.area, business.city].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
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

                {/* Action Buttons */}
                <BusinessActionButtons 
                  businessId={business.id} 
                  name={business.name} 
                  phone={business.contact_phone} 
                  whatsapp={(business as any).whatsapp} 
                  instagram={(business as any).instagram} 
                  location={business.address || ''} 
                  mapLink={(business as any).map_link} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Map Interface */}
        <InteractiveMapInterface 
          businessName={business.name}
          address={business.address}
          area={business.area}
          city={business.city}
          latitude={business.latitude ? Number(business.latitude) : undefined}
          longitude={business.longitude ? Number(business.longitude) : undefined}
        />
        
        {/* Review Form */}
        {business.id && (
          <div className="mt-6">
            <BusinessReviewForm 
              businessId={business.id} 
              businessName={business.name} 
              businessCategory={business.category} 
              businessAddress={business.address}
              onReviewSubmit={handleSubmitReview} 
            />
          </div>
        )}
        
        {/* Reviews section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews ({totalReviews})</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessReviewsList reviews={formattedReviews} />
            </CardContent>
          </Card>
        </div>

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
