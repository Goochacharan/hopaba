import React from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useBusinessDetail, useBusinessReviews } from '@/hooks/useBusinessDetail';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, MapPin, Phone, MessageSquare, Mail, Globe, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BusinessReviews from '@/components/business/BusinessReviews';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2 } from '@/components/ui/loader';
import { ImageIcon } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import ProviderInbox from "@/components/business/ProviderInbox";

const BusinessDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: businessDetail, isLoading: isLoadingBusiness, error: businessError } = useBusinessDetail(id);
  const { reviews, addReview } = useBusinessReviews(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isOwner = user && businessDetail?.user_id === user.id;

  if (isLoadingBusiness) {
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
  
  if (businessError || !businessDetail) {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoadingBusiness ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : businessError ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading business details. Please try again later.</p>
          </div>
        ) : businessDetail ? (
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{businessDetail.name}</h1>
                <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-4">
                  <Badge variant="outline">{businessDetail.category}</Badge>
                  {businessDetail.subcategory && (
                    <Badge variant="outline">{businessDetail.subcategory}</Badge>
                  )}
                  <div className="flex items-center ml-2">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span>{businessDetail.area}, {businessDetail.city}</span>
                  </div>
                </div>
              </div>
              {/* Business action buttons can be added here */}
            </div>

            {/* Images and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                {/* Images carousel */}
                {businessDetail.images && businessDetail.images.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative h-[300px] rounded-md overflow-hidden">
                        <img
                          src={businessDetail.images[0]}
                          alt={businessDetail.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {businessDetail.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2 p-2">
                          {businessDetail.images.slice(1, 5).map((image, idx) => (
                            <div 
                              key={idx} 
                              className="h-16 rounded-md overflow-hidden cursor-pointer"
                            >
                              <img
                                src={image}
                                alt={`${businessDetail.name} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 flex items-center justify-center h-[300px]">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No images available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Info Card */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-medium">Phone</span>
                      </div>
                      <p className="text-sm pl-6">{businessDetail.contact_phone}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-medium">WhatsApp</span>
                      </div>
                      <p className="text-sm pl-6">{businessDetail.whatsapp}</p>
                    </div>

                    {businessDetail.contact_email && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="font-medium">Email</span>
                        </div>
                        <p className="text-sm pl-6">{businessDetail.contact_email}</p>
                      </div>
                    )}

                    {businessDetail.website && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="font-medium">Website</span>
                        </div>
                        <p className="text-sm pl-6">
                          <a 
                            href={businessDetail.website.startsWith('http') ? 
                              businessDetail.website : `https://${businessDetail.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {businessDetail.website}
                          </a>
                        </p>
                      </div>
                    )}

                    {businessDetail.instagram && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Instagram className="h-4 w-4 text-primary" />
                          <span className="font-medium">Instagram</span>
                        </div>
                        <p className="text-sm pl-6">
                          <a 
                            href={businessDetail.instagram.startsWith('http') ? 
                              businessDetail.instagram : 
                              `https://instagram.com/${businessDetail.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {businessDetail.instagram}
                          </a>
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <Button variant="outline" className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="default" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
                
                {/* For business owners: Service Request Inbox */}
                {isOwner && businessDetail && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Service Requests</CardTitle>
                      <CardDescription>
                        Requests matching your business category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProviderInbox
                        providerId={businessDetail.id}
                        category={businessDetail.category}
                        subcategory={businessDetail.subcategory}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="about" className="mt-6">
              <TabsList className="mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services & Pricing</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                {isOwner && <TabsTrigger value="inbox">Request Inbox</TabsTrigger>}
              </TabsList>

              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>About {businessDetail.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{businessDetail.description}</p>

                    {businessDetail.experience && (
                      <div className="mt-4">
                        <h3 className="font-medium text-lg mb-2">Experience</h3>
                        <p>{businessDetail.experience}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <CardTitle>Services & Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Price Range */}
                    <div className="mb-6">
                      <h3 className="font-medium text-lg mb-2">Price Range</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="text-md font-bold">
                          {businessDetail.price_range_min && businessDetail.price_range_max ? 
                            `₹${businessDetail.price_range_min} - ₹${businessDetail.price_range_max}` : 
                            businessDetail.price_range_min ? 
                              `From ₹${businessDetail.price_range_min}` : 
                              businessDetail.price_range_max ? 
                                `Up to ₹${businessDetail.price_range_max}` : 
                                'Price not specified'}
                        </Badge>
                        {businessDetail.price_unit && (
                          <span className="text-muted-foreground">{businessDetail.price_unit}</span>
                        )}
                      </div>
                    </div>

                    {/* Services/Tags */}
                    {businessDetail.tags && businessDetail.tags.length > 0 && (
                      <div>
                        <h3 className="font-medium text-lg mb-2">Services Offered</h3>
                        <div className="flex flex-wrap gap-2">
                          {businessDetail.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Address</h3>
                      <p className="text-muted-foreground">
                        {businessDetail.address}, {businessDetail.area}, {businessDetail.city}, {businessDetail.postal_code}
                      </p>
                    </div>

                    {businessDetail.map_link && (
                      <div className="pt-4">
                        <a 
                          href={businessDetail.map_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button>
                            <MapPin className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Availability</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Working Hours */}
                    <div>
                      <h3 className="font-medium text-lg mb-2">Business Hours</h3>
                      <p>
                        {businessDetail.hours_from && businessDetail.hours_to ? 
                          `${businessDetail.hours_from} - ${businessDetail.hours_to}` : 
                          'Hours not specified'}
                      </p>
                    </div>

                    {/* Available Days */}
                    {businessDetail.availability_days && businessDetail.availability_days.length > 0 && (
                      <div>
                        <h3 className="font-medium text-lg mb-2">Available Days</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <div 
                              key={day} 
                              className={`p-2 rounded-md text-center ${
                                businessDetail.availability_days!.includes(day) ? 
                                  'bg-primary/10 text-primary border border-primary/20' : 
                                  'bg-muted text-muted-foreground'
                              }`}
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Inbox Tab - Only visible to business owners */}
              {isOwner && (
                <TabsContent value="inbox">
                  <Card>
                    <CardHeader>
                      <CardTitle>Service Request Inbox</CardTitle>
                      <CardDescription>
                        View and respond to service requests that match your business category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProviderInbox
                        providerId={businessDetail.id}
                        category={businessDetail.category}
                        subcategory={businessDetail.subcategory}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => navigate('/messages')}>
                        View All Conversations
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default BusinessDetails;
