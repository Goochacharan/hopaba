import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/MainLayout';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarIcon, MapPinIcon, PhoneIcon, DollarSign, MessageSquare, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ServiceProvider, ServiceRequest } from '@/types/serviceRequestTypes';

// Define the shape of the data returned from the database function
interface MatchingProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  user_id: string;
}

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClosingRequest, setIsClosingRequest] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  
  const { getRequestById, updateRequest, deleteRequest, isDeleting, isUpdating } = useServiceRequests();
  const { getConversationsForRequest, createConversation, isCreatingConversation } = useConversations();
  
  // Fetch request details
  const { 
    data: request,
    isLoading: isLoadingRequest,
    error: requestError
  } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestById(id!),
    enabled: !!id
  });
  
  // Fetch conversations for this request
  const { 
    data: requestConversations,
    isLoading: isLoadingConversations,
    error: conversationsError
  } = useQuery({
    queryKey: ['requestConversations', id],
    queryFn: () => getConversationsForRequest(id!),
    enabled: !!id && !!user
  });
  
  // Fetch matching service providers
  const { 
    data: matchingProviders,
    isLoading: isLoadingProviders
  } = useQuery({
    queryKey: ['matchingProviders', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .rpc('get_matching_providers_for_request', { request_id: id })
        .select();
      
      if (error) throw error;
      return data as MatchingProvider[];
    },
    enabled: !!id && !!request
  });
  
  const isLoading = isLoadingRequest || isLoadingConversations || isLoadingProviders;
  const isError = requestError || conversationsError;
  
  // Check if the current provider has been contacted
  const getProviderContactStatus = (providerId: string) => {
    if (!requestConversations) return false;
    return requestConversations.some(conv => conv.provider_id === providerId);
  };
  
  // Handle delete request
  const handleDelete = () => {
    if (!id) return;
    
    deleteRequest(id);
    setIsDeleteDialogOpen(false);
  };
  
  // Handle toggle request status
  const handleToggleStatus = () => {
    if (!request) return;
    
    const newStatus = request.status === 'open' ? 'closed' : 'open';
    updateRequest({
      id: request.id,
      status: newStatus
    });
    setIsClosingRequest(false);
  };
  
  // Handle contact provider
  const handleContactProvider = (provider: MatchingProvider) => {
    if (!request || !user) return;
    
    createConversation(request.id, provider.provider_id, user.id);
  };
  
  // Format date range if available
  const formatDateRange = () => {
    if (!request) return '';
    
    if (request.date_range_start && request.date_range_end) {
      return `${format(parseISO(request.date_range_start), 'dd MMM yyyy')} - ${format(parseISO(request.date_range_end), 'dd MMM yyyy')}`;
    } else if (request.date_range_start) {
      return format(parseISO(request.date_range_start), 'dd MMM yyyy');
    } else {
      return 'Not specified';
    }
  };
  
  // Existing conversations with providers
  const existingConversations = requestConversations || [];
  
  // Available providers (those not yet contacted)
  const availableProviders = React.useMemo(() => {
    if (!matchingProviders || !requestConversations) return [];
    
    // Filter out providers that already have conversations
    return matchingProviders.filter(provider => 
      !requestConversations.some(conv => conv.provider_id === provider.provider_id)
    );
  }, [matchingProviders, requestConversations]);
  
  if (isError) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Request</h2>
          <p className="text-muted-foreground mb-6">
            There was a problem loading this request. Please try again later.
          </p>
          <Button onClick={() => navigate('/requests')}>Back to Requests</Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : request ? (
          <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{request.title}</h1>
                  <Badge variant={request.status === 'open' ? 'default' : 'outline'}>
                    {request.status === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Posted on {format(parseISO(request.created_at), 'PPP')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/requests')}
                >
                  Back
                </Button>
                
                <Button
                  variant={request.status === 'open' ? 'destructive' : 'default'}
                  onClick={() => setIsClosingRequest(true)}
                  disabled={isUpdating}
                >
                  {request.status === 'open' ? 'Close Request' : 'Reopen Request'}
                </Button>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this request? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            
            {/* Request details */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-sm">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Category</h3>
                    <p className="text-sm">
                      {request.category}
                      {request.subcategory && <span className="text-muted-foreground"> / {request.subcategory}</span>}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Budget</h3>
                    <p className="text-sm flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {request.budget ? `₹${request.budget}` : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Date Range</h3>
                    <p className="text-sm flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDateRange()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p className="text-sm flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {request.area}, {request.city}, {request.postal_code}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Contact</h3>
                    <p className="text-sm flex items-center gap-1">
                      <PhoneIcon className="h-4 w-4" />
                      {request.contact_phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-8">
              <Tabs defaultValue="conversations">
                <TabsList>
                  <TabsTrigger value="conversations">
                    Conversations ({existingConversations.length})
                  </TabsTrigger>
                  <TabsTrigger value="providers">
                    Matching Providers ({availableProviders.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="conversations" className="pt-4">
                  {existingConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium mb-1">No conversations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't started any conversations with service providers yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {existingConversations.map((conversation) => (
                        <Card key={conversation.id} className="overflow-hidden">
                          <div className="flex items-center p-4 gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {conversation.service_providers.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <h3 className="font-medium">{conversation.service_providers.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Started {format(parseISO(conversation.created_at), 'PPP')}
                              </p>
                            </div>
                            <Button onClick={() => {
                              // Set navigation source for back button
                              sessionStorage.setItem('conversationNavigationSource', `request-${id}`);
                              navigate(`/messages/${conversation.id}`);
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Messages
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="providers" className="pt-4">
                  {isLoadingProviders ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : availableProviders.length === 0 ? (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium mb-1">No matching providers available</h3>
                      <p className="text-muted-foreground">
                        {matchingProviders && matchingProviders.length > 0 ? 
                          "You've already contacted all matching providers" : 
                          "There are no providers matching your request category"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableProviders.map((provider) => (
                        <Card key={provider.provider_id} className="overflow-hidden">
                          <div className="flex items-center p-4 gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {provider.provider_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                              <h3 className="font-medium">{provider.provider_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {provider.provider_category}
                                {provider.provider_subcategory && ` / ${provider.provider_subcategory}`}
                              </p>
                            </div>
                            <Button 
                              disabled={isCreatingConversation && selectedProviderId === provider.provider_id}
                              onClick={() => {
                                setSelectedProviderId(provider.provider_id);
                                handleContactProvider(provider);
                              }}
                            >
                              {isCreatingConversation && selectedProviderId === provider.provider_id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="h-4 w-4 mr-2" />
                              )}
                              Contact
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Dialog for closing/reopening request */}
            <Dialog open={isClosingRequest} onOpenChange={setIsClosingRequest}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {request.status === 'open' ? 'Close Request' : 'Reopen Request'}
                  </DialogTitle>
                  <DialogDescription>
                    {request.status === 'open' 
                      ? 'Closing this request will prevent new providers from contacting you. Existing conversations will still be accessible.'
                      : 'Reopening this request will allow new providers to contact you again.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsClosingRequest(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : request.status === 'open' ? 'Close Request' : 'Reopen Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default RequestDetail;
