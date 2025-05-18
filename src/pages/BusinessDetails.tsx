
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useBusinessDetail, useBusinessReviews, useBusinessNotes } from '@/hooks/useBusinessDetail';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, Globe, MapPin, Instagram, Clock, Languages, IndianRupee, ArrowLeft, Building, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BusinessReviews from '@/components/business/BusinessReviews';
import BusinessCommunityNotes from '@/components/business/BusinessCommunityNotes';
import { useToast } from '@/hooks/use-toast';

const BusinessDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: business, isLoading, error } = useBusinessDetail(id);
  const { reviews, addReview } = useBusinessReviews(id);
  const { notes, addNote } = useBusinessNotes(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('about');
  
  // Format days for display
  const formatDays = (days: string[] | undefined) => {
    if (!days || days.length === 0) return 'Not specified';
    
    const dayMap: Record<string, string> = {
      '0': 'Sunday',
      '1': 'Monday',
      '2': 'Tuesday',
      '3': 'Wednesday',
      '4': 'Thursday',
      '5': 'Friday',
      '6': 'Saturday'
    };
    
    return days.map(day => dayMap[day] || day).join(', ');
  };
  
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
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="notes">Community Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">About the Business</h2>
                    <p className="whitespace-pre-line text-base">{business.description}</p>
                    
                    {business.tags && business.tags.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Popular Services/Products:</h3>
                        <div className="flex flex-wrap gap-2">
                          {business.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Business Details</h2>
                    
                    <div className="grid gap-4">
                      {/* Price */}
                      {(business.price_range_min || business.price_range_max) && (
                        <div className="flex items-start gap-3">
                          <IndianRupee className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-medium">Pricing</h3>
                            <p>
                              {business.price_range_min && business.price_range_max
                                ? `₹${business.price_range_min} - ₹${business.price_range_max}`
                                : business.price_range_min
                                ? `From ₹${business.price_range_min}`
                                : `Up to ₹${business.price_range_max}`
                              }
                              {business.price_unit ? ` ${business.price_unit}` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Availability */}
                      {business.availability_days && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-medium">Availability</h3>
                            <p>{formatDays(business.availability_days)}</p>
                            {business.availability_start_time && business.availability_end_time && (
                              <p className="text-muted-foreground">
                                {business.availability_start_time} - {business.availability_end_time}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Languages */}
                      {business.languages && business.languages.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Languages className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-medium">Languages</h3>
                            <p>{business.languages.join(', ')}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Experience */}
                      {business.experience && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-medium">Experience</h3>
                            <p>{business.experience}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator className="my-6" />
                    
                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Location</h3>
                        <p>{business.address || `${business.area}, ${business.city}`}</p>
                        {business.map_link && (
                          <a 
                            href={business.map_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View on map
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
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
              </TabsContent>
              
              <TabsContent value="notes">
                <BusinessCommunityNotes 
                  businessId={business.id}
                  notes={notes}
                  onAddNote={addNote}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column with contact info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  {/* Phone */}
                  {business.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <a 
                          href={`tel:${business.contact_phone}`} 
                          className="hover:underline"
                        >
                          {business.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Email */}
                  {business.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <a 
                          href={`mailto:${business.contact_email}`} 
                          className="hover:underline break-all"
                        >
                          {business.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Website */}
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Website</h3>
                        <a 
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all text-primary"
                        >
                          {new URL(business.website).hostname}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Instagram */}
                  {business.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Instagram</h3>
                        <a 
                          href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:underline"
                        >
                          {business.instagram}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
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
