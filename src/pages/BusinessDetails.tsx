import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useBusinessDetail, useBusinessReviews } from '@/hooks/useBusinessDetail';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BusinessReviews from '@/components/business/BusinessReviews';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

const BusinessDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: business, isLoading, error } = useBusinessDetail(id);
  const { reviews, addReview } = useBusinessReviews(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading business details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !business) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-lg text-destructive">Error loading business details</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shop')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Shop
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header section with back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="text-sm">
                  {business.category}
                </Badge>
                {business.subcategory && (
                  <Badge variant="outline" className="text-sm">
                    {business.subcategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column with business details */}
          <div className="md:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="overflow-hidden rounded-lg">
              {business.images && business.images.length > 0 ? (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img 
                    src={business.images[0]} 
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted flex justify-center items-center">
                  <Building className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
              )}
            </div>
            
            {/* Reviews Section - Now the only section */}
            <BusinessReviews 
              businessName={business.name}
              businessCategory={business.category}
              reviews={reviews}
              onAddReview={async (reviewData) => {
                try {
                  await addReview({
                    ...reviewData,
                    name: 'You' // In a real app, this would be the user's name
                  });
                  return Promise.resolve();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to submit your review",
                    variant: "destructive"
                  });
                  return Promise.reject(error);
                }
              }}
            />
          </div>
          
          {/* Right column - Keep only owner/rep card */}
          <div className="space-y-6">
            {/* Owner/Representative Card */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-2">Business Representative</h2>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {business.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{business.name} Team</p>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BusinessDetails;
