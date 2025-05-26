
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import ProviderInbox from '@/components/business/ProviderInbox';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ServiceRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'new' | 'responded'>('new');
  
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
        <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
          <h1 className="text-2xl font-bold">Service Requests</h1>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {/* Toggle Section */}
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as 'new' | 'responded')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Requests</TabsTrigger>
              <TabsTrigger value="responded">Responded Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              {providersWithRequests.map((provider) => (
                <div key={provider.id} className="mb-8">
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
                    section="new"
                  />
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="responded">
              {providersWithRequests.map((provider) => (
                <div key={provider.id} className="mb-8">
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
                    section="responded"
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
