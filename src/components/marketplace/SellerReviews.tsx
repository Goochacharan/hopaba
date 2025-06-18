
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SellerReview } from '@/hooks/useSellerDetails';
import { LogIn, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';
import MapInterface from './MapInterface';

interface SellerReviewsProps {
  sellerId: string;
  sellerName: string;
  reviews: SellerReview[];
  onAddReview?: (review: { rating: number; comment: string }) => Promise<void>;
  onEditReview?: (reviewId: string, review: { rating: number; comment: string }) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  isSubmitting?: boolean;
  location?: string;
  mapLink?: string | null;
  latitude?: number;
  longitude?: number;
}

const SellerReviews: React.FC<SellerReviewsProps> = ({
  sellerId,
  sellerName,
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  isSubmitting = false,
  location,
  mapLink,
  latitude,
  longitude
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);
  const [initialRating, setInitialRating] = useState(5);
  const [initialComment, setInitialComment] = useState('');
  
  // Find the user's existing review
  const userReview = user ? reviews.find(review => review.reviewer_id === user.id) : null;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (dialogOpen && userReview && editMode) {
      setInitialRating(userReview.rating);
      setInitialComment(userReview.comment);
    } else if (!dialogOpen) {
      setInitialRating(5);
      setInitialComment('');
      setEditMode(false);
      setCurrentReviewId(null);
    }
  }, [dialogOpen, userReview, editMode]);

  const handleSubmit = async (review: { rating: number; comment: string }) => {
    try {
      if (editMode && userReview && onEditReview) {
        await onEditReview(userReview.id, review);
        toast({
          title: "Review updated",
          description: "Your review has been successfully updated",
        });
      } else if (onAddReview) {
        await onAddReview(review);
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleDeleteReview = async () => {
    if (userReview && onDeleteReview) {
      try {
        await onDeleteReview(userReview.id);
        setDeleteDialogOpen(false);
      } catch (error: any) {
        toast({
          title: "Error deleting review",
          description: error.message || "There was an error deleting your review",
          variant: "destructive",
        });
      }
    }
  };

  const handleReviewButtonClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to write a review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (userReview) {
      setEditMode(true);
      setInitialRating(userReview.rating);
      setInitialComment(userReview.comment);
      setCurrentReviewId(userReview.id);
    } else {
      setEditMode(false);
      setInitialRating(5);
      setInitialComment('');
    }
    
    setDialogOpen(true);
  };

  const handleEditReview = (review: SellerReview) => {
    setEditMode(true);
    setCurrentReviewId(review.id);
    setInitialRating(review.rating);
    setInitialComment(review.comment);
    setDialogOpen(true);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Reviews & Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Map Interface */}
        <MapInterface
          sellerName={sellerName}
          location={location}
          mapLink={mapLink}
          latitude={latitude}
          longitude={longitude}
        />
        
        {/* Write Review Button */}
        <div className="mb-4 flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size="sm" onClick={handleReviewButtonClick}>
              {!user ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login to Review
                </>
              ) : userReview ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Your Review
                </>
              ) : (
                "Write a Review"
              )}
            </Button>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit your review" : `Review ${sellerName}`}</DialogTitle>
                <DialogDescription>
                  {editMode 
                    ? "Update your review to better reflect your experience"
                    : "Share your experience with this seller to help others"}
                </DialogDescription>
              </DialogHeader>
              <ReviewForm
                initialRating={initialRating}
                initialComment={initialComment}
                isSubmitting={isSubmitting}
                isEditMode={editMode}
                onCancel={() => setDialogOpen(false)}
                onSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <ReviewsList
          reviews={reviews}
          userReviewId={user?.id}
          onEditReview={handleEditReview}
          onDeleteReview={() => setDeleteDialogOpen(true)}
        />
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SellerReviews;
