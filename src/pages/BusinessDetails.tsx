import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';
import { MapPin, Phone, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBusinessDetail, useBusinessReviews } from '@/hooks/useBusinessDetail';
import BusinessRatingOverview from '@/components/business/BusinessRatingOverview';
import BusinessReviewsList from '@/components/business/BusinessReviewsList';
import BusinessReviewForm from '@/components/business/BusinessReviewForm';
import { useAuth } from '@/hooks/useAuth';
import ImageViewer from '@/components/ImageViewer';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const BusinessDetails: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();

  // State for image viewer
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use our custom hook to fetch business details
  const {
    data: business,
    isLoading,
    error
  } = useBusinessDetail(id);

  // Use our custom hook to fetch and manage business reviews
  const {
    reviews,
    addReview
  } = useBusinessReviews(id);

  // Calculate average rating from reviews
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  // Count reviews by rating
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    return {
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 ? reviews.filter(r => r.rating === rating).length / reviews.length * 100 : 0
    };
  });

  // Handle image click to open the image viewer
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageViewerOpen(true);
  };

  // Aggregate criteria ratings from all reviews
  const aggregatedCriteriaRatings = React.useMemo(() => {
    const allRatings: Record<string, number[]> = {};
    reviews.forEach(review => {
      if (review.criteriaRatings) {
        Object.entries(review.criteriaRatings).forEach(([criterionId, rating]) => {
          if (!allRatings[criterionId]) {
            allRatings[criterionId] = [];
          }
          allRatings[criterionId].push(rating);
        });
      }
    });

    // Calculate average for each criterion
    const averageRatings: Record<string, number> = {};
    Object.entries(allRatings).forEach(([criterionId, ratings]) => {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      averageRatings[criterionId] = sum / ratings.length;
    });
    return averageRatings;
  }, [reviews]);
  
  const handleSubmitReview = async (review: {
    rating: number;
    text: string;
    isMustVisit?: boolean;
    isHiddenGem?: boolean;
    criteriaRatings?: Record<string, number>;
  }) => {
    if (!user) return Promise.reject(new Error("User not authenticated"));
    const userName = user.user_metadata?.full_name || user.email || user.id;
    return addReview({
      ...review,
      name: userName,
      userId: user.id
    });
  };
  if (isLoading) {
    return <MainLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MainLayout>;
  }
  if (error) {
    return <MainLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error</h2>
          <p className="text-gray-500">Failed to load business details.</p>
        </div>
      </MainLayout>;
  }
  if (!business) {
    return <MainLayout>
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Business Not Found</h2>
          <p className="text-gray-500">The requested business could not be found.</p>
        </div>
      </MainLayout>;
  }
  return <MainLayout>
      <div className="container mx-auto mt-8 p-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col">
              <CardTitle className="text-2xl font-bold">{business.name}</CardTitle>
              <div className="flex items-center mt-2">
              </div>
            </div>
          </CardHeader>
          
          {/* Carousel section at the top */}
          <CardContent className="grid gap-6">
            {business.images && business.images.length > 0 && (
              <div className="w-full">
                <Carousel className="w-full">
                  <CarouselContent>
                    {business.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <div 
                            className="relative aspect-[16/9] w-full overflow-hidden rounded-md cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          >
                            <img 
                              src={image} 
                              alt={`${business.name} image ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
                
                <ImageViewer 
                  images={business.images}
                  initialIndex={currentImageIndex}
                  open={isImageViewerOpen}
                  onOpenChange={setIsImageViewerOpen}
                />
              </div>
            )}
            
            <Separator />
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rating & Reviews</h3>
                <BusinessRatingOverview avgRating={avgRating} totalReviews={reviews.length} ratingDistribution={ratingDistribution} criteriaRatings={aggregatedCriteriaRatings} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Review Form */}
        {business.id && <div className="mt-6">
            <BusinessReviewForm businessId={business.id} businessName={business.name} businessCategory={business.category} onReviewSubmit={handleSubmitReview} />
          </div>}
        
        {/* Reviews section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <BusinessReviewsList reviews={reviews} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>;
};
export default BusinessDetails;
