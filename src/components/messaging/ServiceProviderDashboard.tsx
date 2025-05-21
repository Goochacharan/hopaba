import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileSearch } from 'lucide-react';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type ServiceProvider = Database['public']['Tables']['service_providers']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

interface ServiceRequestWithConversation extends ServiceRequest {
  conversation?: Conversation | null;
}

const useServiceRequests = () => {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      setLoading(true);
      try {
        const { data: serviceRequests, error } = await supabase
          .from('service_requests')
          .select('*');

        if (error) {
          setError(error);
        } else {
          setData(serviceRequests || []);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequests();
  }, []);

  return { data, loading, error };
};

const useServiceProvider = (userId: string | undefined) => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServiceProvider = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          setError(error);
        } else {
          setProvider(data || null);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceProvider();
  }, [userId]);

  return { provider, loading, error };
};

const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          setError(error);
        } else {
          setConversations(data || []);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId]);

  return { conversations, loading, error };
};

const useServiceRequestsForProvider = (provider: ServiceProvider | null) => {
  const { data: allRequests, loading: requestsLoading, error: requestsError } = useServiceRequests();
  const { conversations, loading: conversationsLoading, error: conversationsError } = useConversations(provider?.user_id);
  const { toast } = useToast();
  const [data, setData] = useState<ServiceRequestWithConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (requestsLoading || conversationsLoading) {
      setLoading(true);
      return;
    }

    if (requestsError || conversationsError) {
      setError(requestsError || conversationsError || null);
      setLoading(false);
      return;
    }

    if (!provider) {
      setLoading(false);
      return;
    }

    // Filter service requests based on provider's category and subcategory
    // Improved subcategory matching logic for subcategory array
    const filteredRequests = allRequests.filter(req => {
      // If provider has no subcategories, show all requests in their category
      if (!provider.subcategory || provider.subcategory.length === 0) {
        return req.category.toLowerCase() === provider.category.toLowerCase();
      }
      
      // If request has no subcategory, show it to all providers in that category
      if (!req.subcategory) return req.category.toLowerCase() === provider.category.toLowerCase();
      
      // Check if any of the provider's subcategories match the request's subcategory
      return provider.subcategory.some(sub => 
        req.subcategory?.toLowerCase() === sub.toLowerCase() && req.category.toLowerCase() === provider.category.toLowerCase()
      );
    });

    // Attach conversations to the service requests
    const requestsWithConversations = filteredRequests.map(req => ({
      ...req,
      conversation: conversations.find(c => c.request_id === req.id),
    }));

    setData(requestsWithConversations);
    setLoading(false);
    setError(null);

  }, [allRequests, conversations, provider, requestsError, conversationsError, requestsLoading, conversationsLoading, toast]);
     
  return { data, loading, error };
};

const ServiceProviderDashboard = () => {
  const { user } = useAuth();
  const { provider, loading: providerLoading, error: providerError } = useServiceProvider(user?.id);
  const { data: serviceRequests, loading: requestsLoading, error: requestsError } = useServiceRequestsForProvider(provider);
  const [activeTab, setActiveTab] = useState('requests');

  if (providerLoading) {
    return <div className="h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Fetching your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center">
            <Avatar>
              <Skeleton className="h-9 w-9 rounded-full" />
            </Avatar>
            <div className="ml-4 space-y-1">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
        </CardContent>
      </Card>
    </div>;
  }

  if (providerError) {
    return <div className="h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: {providerError.message}</p>
        </CardContent>
      </Card>
    </div>;
  }

  if (!provider) {
    return <div className="h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>No Profile Found</CardTitle>
          <CardDescription>You don't have a service provider profile yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please create a service provider profile to view service requests.</p>
          <Button asChild>
            <Link to="/settings">Create Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Service Provider Dashboard</CardTitle>
          <CardDescription>
            Manage service requests related to your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={`https://avatar.vercel.sh/${provider.name}.png`} />
              <AvatarFallback>{provider.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{provider.name}</h2>
              <p className="text-sm text-muted-foreground">{provider.category} {provider.subcategory && provider.subcategory.length > 0 && `(${provider.subcategory.join(', ')})`}</p>
            </div>
          </div>
          <div className="grid gap-4">
            {requestsLoading ? (
              <div className="flex items-center justify-center">
                <p>Loading service requests...</p>
              </div>
            ) : requestsError ? (
              <div className="flex items-center justify-center">
                <p className="text-red-500">Error: {requestsError.message}</p>
              </div>
            ) : serviceRequests && serviceRequests.length > 0 ? (
              <ScrollArea className="rounded-md border">
                <div className="p-4">
                  {serviceRequests.map((request) => (
                    <Card key={request.id} className="mb-4">
                      <CardHeader>
                        <CardTitle>{request.title}</CardTitle>
                        <CardDescription>
                          {request.city}, {request.area} - {request.postal_code}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{request.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Budget: ₹{request.budget || 'Not specified'}
                        </p>
                        {request.subcategory && (
                          <Badge variant="secondary" className="mr-2">
                            {request.subcategory}
                          </Badge>
                        )}
                      </CardContent>
                      <div className="flex justify-end space-x-2 p-4">
                        <Button asChild variant="outline">
                          <Link to={`/service-requests/${request.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {request.conversation ? (
                          <Button asChild>
                            <Link to={`/messages/${request.conversation.id}`}>
                              View Conversation
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild>
                            <Link to={`/service-requests/${request.id}`}>
                              Start Conversation
                            </Link>
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No service requests found.</p>
                <p className="text-muted-foreground">
                  Check back later for new requests matching your business.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderDashboard;
