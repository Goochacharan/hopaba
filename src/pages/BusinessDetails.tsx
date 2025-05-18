
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/MainLayout';
import { Loader2 } from 'lucide-react';
import { MapPin, Phone, Globe, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Business {
  id: string;
  created_at: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  country?: string;
  contact_phone: string;
  website: string;
  images: string[];
  approval_status: string;
  user_id?: string;
  postal_code?: string;
  hours_from?: string;
  hours_to?: string;
  whatsapp?: string;
}

const BusinessDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Cast the data to match our Business interface
      return data as unknown as Business;
    },
    enabled: !!id,
  });

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
      <div className="container mx-auto mt-8 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">{business.name}</CardTitle>
              {business.approval_status === 'approved' ? (
                <Badge variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Pending
                </Badge>
              )}
            </div>
            <CardDescription>{business.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>{business.address}, {business.city}{business.postal_code ? ` - ${business.postal_code}` : ''}{business.country ? `, ${business.country}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${business.contact_phone}`}>{business.contact_phone}</a>
                </div>
                {business.website && (
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer">{business.website}</a>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Category</h3>
                <p>Category: {business.category}</p>
                <p>Subcategory: {business.subcategory}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
              <p>
                <Calendar className="h-4 w-4 inline-block mr-1" />
                {business.hours_from || 'N/A'} - {business.hours_to || 'N/A'}
              </p>
            </div>

            {business.images && business.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Images</h3>
                <div className="grid grid-cols-3 gap-4">
                  {business.images.map((image, index) => (
                    <img key={index} src={image} alt={`Business ${index + 1}`} className="rounded-md" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="mt-4">
          {business.user_id ? (
            <Link to={`/user/${business.user_id}`}>
              <Button variant="secondary">View User Profile</Button>
            </Link>
          ) : (
            <p>User profile not available.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BusinessDetails;
