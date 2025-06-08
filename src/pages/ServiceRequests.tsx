
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import ProviderInbox from '@/components/business/ProviderInbox';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { distanceService, type Location } from '@/services/distanceService';
import { toast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';

const ServiceRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'new' | 'responded'>('new');
  
  // Use global location context
  const { 
    userLocation, 
    isLocationEnabled, 
    isCalculatingLocation,
    enableLocation, 
    disableLocation 
  } = useLocation();
  
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

  // Get conversations to check which providers have requests
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['providerConversations', user?.id],
    queryFn: async () => {
      if (!providerData || providerData.length === 0) return [];
      
      const providerIds = providerData.map(p => p.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          provider_id,
          request_id,
          last_message_at,
          service_requests!inner(
            id,
            title,
            category,
            subcategory,
            status
          )
        `)
        .in('provider_id', providerIds)
        .order('last_message_at', { ascending: false });
        
      if (error) throw error;
      
      return data;
    },
    enabled: !!providerData && providerData.length > 0
  });

  // Filter providers that have actual service requests
  const providersWithRequests = providerData?.filter(provider => {
    return conversations?.some(conv => conv.provider_id === provider.id);
  }) || [];

  // Handle location toggle
  const handleLocationToggle = async () => {
    if (isLocationEnabled) {
      disableLocation();
      toast({
        title: "Location disabled",
        description: "Distance sorting is now disabled",
      });
    } else {
      try {
        await enableLocation();
        toast({
          title: "Location enabled",
          description: "Distance calculation enabled for request sorting",
        });
      } catch (error) {
        console.error('❌ Failed to get user location:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access to enable distance sorting",
          variant: "destructive"
        });
      }
    }
  };
  
  if (isLoadingProvider || isLoadingConversations) {
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

  if (providersWithRequests.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Service Requests</h1>
            <p className="text-muted-foreground mb-4">You don't have any service requests yet. Service requests will appear here when customers contact you.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Location Toggle */}
          <div className="bg-white rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Enable Location</span>
              </div>
              <Button
                variant={isLocationEnabled ? "default" : "outline"}
                onClick={handleLocationToggle}
                disabled={isCalculatingLocation}
                className="flex items-center gap-2"
              >
                {isCalculatingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {isLocationEnabled ? "Disable Location" : "Enable Location"}
              </Button>
            </div>
          </div>

          {/* Toggle Section */}
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'new' | 'responded')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Requests</TabsTrigger>
              <TabsTrigger value="responded">Responded Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              {providersWithRequests.map((provider) => (
                <div key={provider.id} className="mb-8">
                  <ProviderInbox
                    providerId={provider.id}
                    category={provider.category}
                    subcategory={provider.subcategory || []}
                    section="new"
                    userLocation={userLocation}
                    isLocationEnabled={isLocationEnabled}
                    providerCity={provider.city}
                  />
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="responded">
              {providersWithRequests.map((provider) => (
                <div key={provider.id} className="mb-8">
                  <ProviderInbox
                    providerId={provider.id}
                    category={provider.category}
                    subcategory={provider.subcategory || []}
                    section="responded"
                    userLocation={userLocation}
                    isLocationEnabled={isLocationEnabled}
                    providerCity={provider.city}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceRequests;
