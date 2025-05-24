import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/MainLayout';
import { ArrowLeft } from 'lucide-react';
import { getRecommendationById, mockRecommendations } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import ImageViewer from '@/components/ImageViewer';
import { ReviewFormValues } from '@/components/location/ReviewForm';
import LocationHeader from '@/components/location/LocationHeader';
import LocationAbout from '@/components/location/LocationAbout';
import ReviewsSection from '@/components/location/ReviewsSection';
import CommunityNoteForm from '@/components/location/CommunityNoteForm';
import CommunityNotesList from '@/components/location/CommunityNotesList';
import { useAuth } from '@/hooks/useAuth';
import { useLocationReviews } from '@/hooks/useLocationReviews';

const LocationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [communityNotesRefreshTrigger, setCommunityNotesRefreshTrigger] = useState(0);

  // Use the new Supabase-based review hook
  const {
    reviews,
    userReview,
    averageRating,
    totalReviews,
    createReview,
    updateReview,
    isCreating,
    isUpdating
  } = useLocationReviews(id || '');

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // First try to get from Supabase
        const { data: supabaseData, error } = await supabase
          .from('recommendations')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseData && !error) {
          setRecommendation(supabaseData);
        } else {
          // Fallback to mock data
          const mockData = getRecommendationById(id);
          if (mockData) {
            setRecommendation(mockData);
          } else {
            toast({
              title: "Location not found",
              description: "The requested location could not be found.",
              variant: "destructive"
            });
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error fetching recommendation:', error);
        // Fallback to mock data
        const mockData = getRecommendationById(id);
        if (mockData) {
          setRecommendation(mockData);
        } else {
          toast({
            title: "Error loading location",
            description: "There was an error loading the location details.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [id, navigate, toast]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
  };

  const refreshCommunityNotes = () => {
    setCommunityNotesRefreshTrigger(prev => prev + 1);
  };

  const handleSubmitReview = (values: ReviewFormValues) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to submit a review",
        variant: "destructive"
      });
      return;
    }

    if (!id) {
      toast({
        title: "Error",
        description: "Location ID is missing",
        variant: "destructive"
      });
      return;
    }

    if (values.reviewId && userReview) {
      // Update existing review
      updateReview({
        reviewId: userReview.id,
        reviewData: {
          rating: values.rating,
          is_must_visit: values.isMustVisit,
          is_hidden_gem: values.isHiddenGem,
          criteria_ratings: values.criteriaRatings,
          text: ''
        }
      });
    } else {
      // Create new review
      createReview({
        location_id: id,
        rating: values.rating,
        is_must_visit: values.isMustVisit,
        is_hidden_gem: values.isHiddenGem,
        criteria_ratings: values.criteriaRatings,
        text: ''
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  if (!recommendation) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-4">Location Not Found</h2>
          <p className="text-gray-500 mb-4">The requested location could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Convert Supabase reviews to the format expected by ReviewsSection
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    name: review.reviewer_name,
    date: new Date(review.created_at).toLocaleDateString(),
    rating: review.rating,
    text: review.text || '',
    isMustVisit: review.is_must_visit || false,
    isHiddenGem: review.is_hidden_gem || false,
    userId: review.user_id,
    criteriaRatings: review.criteria_ratings || {}
  }));

  const locationImages = recommendation.images && recommendation.images.length > 0 
    ? recommendation.images 
    : [recommendation.image];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <LocationHeader 
          name={recommendation.name}
          rating={averageRating}
          reviewCount={totalReviews}
          images={locationImages}
          onImageClick={handleImageClick}
        />

        <LocationAbout 
          name={recommendation.name}
          description={recommendation.description}
          tags={recommendation.tags || []}
          category={recommendation.category}
          subcategory={recommendation.subcategory}
        />

        <ReviewsSection
          reviews={formattedReviews}
          totalReviewCount={totalReviews}
          locationRating={averageRating}
          locationId={id}
          locationName={recommendation.name}
          locationCategory={recommendation.category}
          onSubmitReview={handleSubmitReview}
          currentUser={user}
          hasUserReviewed={!!userReview}
        />

        {id && (
          <>
            <CommunityNoteForm 
              locationId={id} 
              onNoteCreated={refreshCommunityNotes}
            />
            <CommunityNotesList 
              locationId={id} 
              key={`notes-list-${communityNotesRefreshTrigger}`}
            />
          </>
        )}

        {locationImages.length > 0 && (
          <ImageViewer 
            images={locationImages} 
            initialIndex={selectedImageIndex} 
            open={imageViewerOpen} 
            onOpenChange={setImageViewerOpen} 
          />
        )}
      </div>
    </MainLayout>
  );
};

export default LocationDetails;
