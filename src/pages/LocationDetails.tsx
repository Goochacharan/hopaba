import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/MainLayout';
import { ArrowLeft, Search, Loader } from 'lucide-react';
import { getRecommendationById, mockRecommendations } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import ImageViewer from '@/components/ImageViewer';
import { Review } from '@/components/location/ReviewsList';
import { ReviewFormValues } from '@/components/location/ReviewForm';
import LocationHeader from '@/components/location/LocationHeader';
import LocationAbout from '@/components/location/LocationAbout';
import ReviewsSection from '@/components/location/ReviewsSection';
import CommunityNoteForm from '@/components/location/CommunityNoteForm';
import CommunityNotesList from '@/components/location/CommunityNotesList';
import { Input } from '@/components/ui/input';
import { Category } from '@/hooks/useCategories';

const getStoredReviews = (locationId: string): Review[] => {
  try {
    const storedReviews = localStorage.getItem(`reviews_${locationId}`);
    return storedReviews ? JSON.parse(storedReviews) : [];
  } catch (error) {
    console.error('Error getting stored reviews:', error);
    return [];
  }
};

const storeReviews = (locationId: string, reviews: Review[]) => {
  try {
    localStorage.setItem(`reviews_${locationId}`, JSON.stringify(reviews));
    console.log('Stored reviews for location:', locationId, reviews);
  } catch (error) {
    console.error('Error storing reviews:', error);
  }
};

const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return sum / reviews.length;
};

// New component for search results
const ServiceProviderSearchResults = ({ providers }: { providers: any[] }) => {
  const navigate = useNavigate();

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No service providers found matching your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {providers.map((provider) => (
        <div 
          key={provider.id} 
          className="border rounded-lg p-4 hover:bg-accent cursor-pointer"
          onClick={() => navigate(`/location/${provider.id}`)}
        >
          <h3 className="text-lg font-semibold">{provider.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{provider.category}</p>
          
          <div className="flex items-center gap-1">
            <span className="text-amber-500">★</span>
            <span>4.5</span>
          </div>
          
          <p className="mt-2 line-clamp-2">{provider.description}</p>
          
          {provider.area && (
            <div className="mt-2 text-sm text-muted-foreground">
              {provider.area}, {provider.city}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const LocationDetails = () => {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [communityNotesRefreshTrigger, setCommunityNotesRefreshTrigger] = useState(0);
  
  // New state for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    getCurrentUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    setLoading(true);
    
    // Load saved reviews from localStorage for this location
    const savedReviews = getStoredReviews(id);
    setUserReviews(savedReviews);
    
    if (savedReviews.length > 0) {
      const avgRating = calculateAverageRating(savedReviews);
      setAverageRating(avgRating);
    }
    
    const mockLocation = getRecommendationById(id);
    
    const isCornerHouseId = id === 'corner-house-01' || id.toLowerCase().includes('corner');
    
    if (mockLocation) {
      console.log("Found location in mock data:", mockLocation);
      setLocation(mockLocation);
      setLoading(false);
    } else if (isCornerHouseId) {
      const cornerHouse = mockRecommendations.find(rec => rec.name === 'Corner House');
      if (cornerHouse) {
        console.log("Using Corner House data:", cornerHouse);
        setLocation(cornerHouse);
        setLoading(false);
      } else {
        fetchLocationFromSupabase();
      }
    } else {
      fetchLocationFromSupabase();
    }
  }, [id, navigate, toast]);

  const fetchLocationFromSupabase = async () => {
    try {
      const { data: serviceProvider, error: serviceError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (serviceProvider) {
        console.log("Found location in service_providers:", serviceProvider);
        setLocation(serviceProvider);
        setLoading(false);
        return;
      }

      const { data: recommendation, error: recommendationError } = await supabase
        .from('recommendations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (recommendation) {
        console.log("Found location in recommendations:", recommendation);
        setLocation(recommendation);
        setLoading(false);
        return;
      }

      const { data: cornerHouse, error: cornerHouseError } = await supabase
        .from('service_providers')
        .select('*')
        .ilike('name', '%Corner House%')
        .maybeSingle();

      if (cornerHouse) {
        console.log("Found Corner House in service_providers:", cornerHouse);
        setLocation(cornerHouse);
        setLoading(false);
        return;
      }

      toast({
        title: "Location not found",
        description: "We couldn't find the location you're looking for",
        variant: "destructive"
      });
      navigate('/');
    } catch (error) {
      console.error("Error fetching location:", error);
      toast({
        title: "Error",
        description: "There was an error loading the location details",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
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
    
    let updatedReviews = [...userReviews];
    const userName = user.user_metadata?.full_name || user.email || user.id;
    const currentDate = "Just now";
    
    if (values.reviewId) {
      updatedReviews = updatedReviews.map(review => {
        if (review.id === values.reviewId) {
          return {
            ...review,
            rating: values.rating,
            isMustVisit: values.isMustVisit,
            isHiddenGem: values.isHiddenGem,
            criteriaRatings: values.criteriaRatings,
            date: currentDate
          };
        }
        return review;
      });
    } else {
      const existingUserReview = userReviews.find(
        review => review.userId === user.id
      );

      if (existingUserReview) {
        toast({
          title: "Review already submitted",
          description: "You have already submitted a review for this location.",
          variant: "destructive"
        });
        return;
      }

      const reviewId = Math.random().toString(36).substring(2, 9);
      
      const newReview: Review = {
        id: reviewId,
        name: userName,
        date: currentDate,
        rating: values.rating,
        isMustVisit: values.isMustVisit,
        isHiddenGem: values.isHiddenGem,
        text: "",
        userId: user.id,
        criteriaRatings: values.criteriaRatings
      };
      
      updatedReviews = [newReview, ...updatedReviews];
    }
    
    setUserReviews(updatedReviews);
    
    const newAverageRating = calculateAverageRating(updatedReviews);
    setAverageRating(newAverageRating);
    
    if (id) {
      storeReviews(id, updatedReviews);
    }
  };

  const refreshCommunityNotes = () => {
    console.log("Refreshing community notes list");
    setCommunityNotesRefreshTrigger(prev => prev + 1);
  };

  // New function to handle search with categories and subcategories
  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedCategory === 'all' && !selectedSubcategory) {
      toast({
        title: "Empty search",
        description: "Please enter a search term or select a category",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    setSearchResults([]);

    try {
      let query = supabase
        .from('service_providers')
        .select('*')
        .eq('approval_status', 'approved');
      
      // Apply search term if provided
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      // Apply subcategory filter
      if (selectedSubcategory) {
        query = query.eq('subcategory', selectedSubcategory);
      }
      
      // Get results
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error searching service providers:", error);
        toast({
          title: "Search error",
          description: "Failed to search service providers",
          variant: "destructive"
        });
        return;
      }
      
      setSearchResults(data || []);
    } catch (err) {
      console.error("Exception during search:", err);
      toast({
        title: "Search error",
        description: "Something went wrong while searching",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Handler for category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
  };
  
  // Handler for subcategory change
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
  };

  const allReviews = [...userReviews];
  const locationImages = location?.images && location.images.length > 0 ? location.images : [location?.image];
  const reviewCount = userReviews.length;
  
  const displayRating = userReviews.length > 0 ? averageRating : (location?.rating || 4.5);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-4 px-4 max-w-none">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!location) return null;

  return (
    <MainLayout>
      <div className="container mx-auto py-4 max-w-none px-[7px]">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 pl-0 text-muted-foreground" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to results
        </Button>
        
        {/* New Search Bar Section with Category and Subcategory */}
        <div className="mb-6 p-4 bg-accent/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Search Service Providers</h3>
          
          {/* Category Selector */}
          <div className="mb-4">
            import React from './CategoryScrollBar';
            import { CategoryScrollBar } from '@/components/business/CategoryScrollBar';
            <CategoryScrollBar
              selected={selectedCategory}
              onSelect={handleCategoryChange}
              selectedSubcategory={selectedSubcategory}
              onSubcategorySelect={handleSubcategoryChange}
            />
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search for businesses, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
          
          {/* Search Results Section */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Search Results ({searchResults.length})</h4>
              <ServiceProviderSearchResults providers={searchResults} />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LocationHeader
              name={location.name}
              rating={displayRating}
              reviewCount={reviewCount}
              images={locationImages}
              onImageClick={handleImageClick}
            />
            
            <LocationAbout
              name={location.name}
              description={location.description}
              tags={location.tags || []}
              category={location.category}
              subcategory={location.subcategory}
            />
            
            <ReviewsSection
              reviews={allReviews}
              totalReviewCount={reviewCount}
              locationRating={displayRating}
              locationId={location.id}
              locationName={location.name}
              locationCategory={location.category}
              onSubmitReview={handleSubmitReview}
              currentUser={user}
              hasUserReviewed={userReviews.some(review => review.userId === (user?.id || null))}
            />

            <div className="mt-8" id="community-notes">
              <CommunityNoteForm locationId={location.id} onNoteCreated={refreshCommunityNotes} />
              <CommunityNotesList locationId={location.id} key={`notes-list-${communityNotesRefreshTrigger}`} />
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Right sidebar content goes here if needed */}
          </div>
        </div>
        
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
