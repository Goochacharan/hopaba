import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import { useSellerDetails } from '@/hooks/useSellerDetails';
import SellerProfileCard from '@/components/marketplace/SellerProfileCard';
import SellerDetailsTabs from '@/components/marketplace/SellerDetailsTabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SellerDetails = () => {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sellerDetails, loading, error, refreshData } = useSellerDetails(id || '');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleAddReview = async (review: { rating: number; comment: string; }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to write a review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!id) {
      toast({
        title: "Error",
        description: "Seller ID is missing",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);
    console.log("Submitting review:", review);
    
    try {
      const { error: insertError, data: insertData } = await supabase
        .from('seller_reviews')
        .insert({
          seller_id: id,
          reviewer_id: user.id,
          reviewer_name: user.user_metadata?.full_name || user.email || 'Anonymous',
          rating: review.rating,
          comment: review.comment
        })
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      
      console.log("Review inserted successfully:", insertData);
      
      await refreshData();
      
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!'
      });
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error submitting review',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async (reviewId: string, review: { rating: number; comment: string; }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to edit your review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    console.log("Editing review:", reviewId, review);
    
    try {
      const { error: updateError } = await supabase
        .from('seller_reviews')
        .update({
          rating: review.rating,
          comment: review.comment
        })
        .eq('id', reviewId)
        .eq('reviewer_id', user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }
      
      await refreshData();
      
      toast({
        title: 'Review updated',
        description: 'Your review has been successfully updated'
      });
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast({
        title: 'Error updating review',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to delete your review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setSubmittingReview(true);
    console.log("Deleting review:", reviewId);
    
    try {
      const { error: deleteError } = await supabase
        .from('seller_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('reviewer_id', user.id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }
      
      await refreshData();
      
      toast({
        title: 'Review deleted',
        description: 'Your review has been successfully deleted'
      });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error deleting review',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-full mx-auto px-4 py-6">
        <div className="max-w-[1400px] mx-0 px-[2px] py-0 my-0">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-lg">Loading seller details...</p>
            </div>
          ) : error ? (
            <Card className="p-10 text-center my-6">
              <AlertCircle className="h-14 w-14 mx-auto text-destructive" />
              <h3 className="mt-4 text-xl font-semibold">Error Loading Seller</h3>
              <p className="mt-3 text-lg text-muted-foreground">{error}</p>
              <Button className="mt-6 px-6 py-5 text-lg" onClick={() => navigate('/marketplace')}>
                Return to Marketplace
              </Button>
            </Card>
          ) : sellerDetails ? (
            <>
              <div className="w-full gap-6 mb-8">
                <SellerProfileCard 
                  sellerName={sellerDetails.name} 
                  sellerRating={sellerDetails.rating} 
                  reviewCount={sellerDetails.review_count} 
                  joinedDate={sellerDetails.listings[0]?.created_at}
                  sellerPhone={sellerDetails.listings[0]?.seller_phone}
                  sellerWhatsapp={sellerDetails.listings[0]?.seller_whatsapp}
                  location={sellerDetails.listings[0]?.location}
                  mapLink={sellerDetails.listings[0]?.map_link}
                  listingId={id}
                />
              </div>

              <SellerDetailsTabs
                sellerId={sellerDetails.id}
                sellerName={sellerDetails.name}
                listings={sellerDetails.listings}
                reviews={sellerDetails.reviews}
                onAddReview={handleAddReview}
                onEditReview={handleEditReview}
                onDeleteReview={handleDeleteReview}
                isSubmittingReview={submittingReview}
                location={sellerDetails.listings[0]?.location}
                mapLink={sellerDetails.listings[0]?.map_link}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Seller not found.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SellerDetails;
