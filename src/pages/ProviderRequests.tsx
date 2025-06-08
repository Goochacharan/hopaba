import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import ProviderInbox from '@/components/business/ProviderInbox'; 
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const ProviderRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Get provider data for the current user
  const { data: providerData, isLoading: isLoadingProvider, error } = useQuery({
    queryKey: ['providerData', user?.id],
    queryFn: async () => {
      console.log('Fetching provider data for user ID:', user.id);
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      console.log('Provider data found:', data);
      return data;
    }
  });
  
  if (isLoadingProvider) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">There was an error loading your provider data.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!providerData || providerData.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Service Provider Profile</h1>
            <p className="text-muted-foreground mb-4">You need to create a service provider profile to view and respond to requests.</p>
            <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
          <h1 className="text-2xl font-bold">Service Provider</h1>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="requests">Matching Requests</TabsTrigger>
              <TabsTrigger value="conversations">Active Conversations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests">
              {providerData?.map((provider) => (
                <div key={provider.id}>
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-medium">Your Business Profile</h3>
                    <h4 className="text-lg font-bold mt-1">{provider.name}</h4>
                    <p className="text-sm mt-1">Category: <strong>{provider.category}</strong></p>
                    {provider.subcategory && provider.subcategory.length > 0 && (
                      <p className="text-sm mt-1">
                        Subcategories: <strong>{provider.subcategory.join(', ')}</strong>
                      </p>
                    )}
                  </div>
                  
                  <ProviderInbox
                    providerId={provider.id}
                    category={provider.category}
                    subcategory={provider.subcategory || []}
                    providerCity={provider.city}
                  />
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="conversations">
              <p className="text-center py-8 text-muted-foreground">
                Your active conversations will appear here.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProviderRequests;
