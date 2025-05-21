
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, DollarSign, MapPin, MessageSquare, AlertCircle, Eye, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';

interface ProviderInboxProps {
  providerId: string;
  category: string;
  subcategory?: string[];
}

const ProviderInbox: React.FC<ProviderInboxProps> = ({
  providerId,
  category,
  subcategory
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation, conversations } = useConversations();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  console.log('Provider filtering with:', { 
    providerId, 
    category, 
    subcategory: subcategory || [],
    subcategoryType: typeof subcategory
  });
  
  // Fetch matching requests for this provider's category/subcategory
  const { 
    data: matchingRequests, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['matchingRequests', providerId, category, subcategory],
    queryFn: async () => {
      console.log('Fetching requests for category:', category);
      // Optimize query to only select needed columns and add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .select('id, title, description, budget, area, city, created_at, subcategory, user_id, status')
          .eq('status', 'open')
          .eq('category', category)
          .order('created_at', { ascending: false });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        
        console.log('Found service requests:', data?.length || 0);
        
        // If subcategory is specified, filter results client-side with case-insensitive matching
        let filteredData = data as ServiceRequest[];
        if (subcategory && subcategory.length > 0) {
          console.log('Filtering by subcategories:', subcategory);
          
          // Case-insensitive filtering with trimming
          filteredData = filteredData.filter(req => {
            if (!req.subcategory) return false;
            
            // Trim and convert both to lowercase for case-insensitive comparison
            const requestSubLower = req.subcategory.toLowerCase().trim();
            
            // Check if any of the provider's subcategories match (case-insensitive with trim)
            return subcategory.some(providerSub => 
              providerSub.toLowerCase().trim() === requestSubLower
            );
          });
          
          console.log('After subcategory filtering, found:', filteredData.length);
        }
        
        return filteredData;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // If query timed out or was aborted
        if (error.code === '20' || error.name === 'AbortError') {
          throw new Error('Query timed out. The database might be busy. Please try again.');
        }
        
        throw error;
      }
    },
    enabled: !!providerId && !!user && !!category,
    staleTime: 60000, // 1 minute cache
    retry: false // We'll handle retries manually
  });
  
  // Check if the provider already has a conversation for a request
  const hasExistingConversation = (requestId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  };
  
  // Handle creating a new conversation
  const handleContactRequester = (request: ServiceRequest) => {
    if (!user) return;
    console.log('Creating conversation:', {
      requestId: request.id,
      providerId,
      userId: request.user_id
    });
    
    // Call the createConversation with the updated signature
    createConversation(request.id, providerId, request.user_id);
  };

  // Handle viewing request details
  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };
  
  // Retry fetching data
  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      refetch();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-4 py-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Error loading matching requests'}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button 
            onClick={handleRetry}
            variant="outline"
            disabled={retryCount >= MAX_RETRIES}
            className="flex items-center gap-2"
          >
            <Loader2 className={retryCount < MAX_RETRIES ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {retryCount < MAX_RETRIES ? `Retry (${retryCount}/${MAX_RETRIES})` : 'Max retries reached'}
          </Button>
        </div>
      </div>
    );
  }
  
  if (!matchingRequests || matchingRequests.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium mb-1">No matching requests</h3>
        <p className="text-sm text-muted-foreground">
          There are no open service requests matching your business category.
        </p>
      </div>
    );
  }
  
  // Group requests into "new" and "responded"
  const respondedRequests = matchingRequests.filter(req => hasExistingConversation(req.id));
  const newRequests = matchingRequests.filter(req => !hasExistingConversation(req.id));
  
  return (
    <>
      <div className="space-y-4">
        {newRequests.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">New Requests</h3>
            <div className="space-y-4">
              {newRequests.slice(0, 5).map(request => (
                <Card key={request.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Badge>New</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(request.created_at), 'dd MMM yyyy')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {request.budget ? `Budget: ₹${request.budget}` : 'No budget specified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{request.area}, {request.city}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{request.description}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => handleContactRequester(request)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Quotation
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {respondedRequests.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Responded Requests</h3>
            <div className="space-y-4">
              {respondedRequests.slice(0, 5).map(request => (
                <Card key={request.id} className="border-muted">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Responded
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(request.created_at), 'dd MMM yyyy')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {request.budget ? `Budget: ₹${request.budget}` : 'No budget specified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{request.area}, {request.city}</span>
                      </div>
                      <p className="text-sm line-clamp-2">{request.description}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button 
                      variant="secondary"
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        const conversation = conversations?.find(c => c.request_id === request.id && c.provider_id === providerId);
                        if (conversation) {
                          navigate(`/messages/${conversation.id}`);
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Conversation
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {newRequests.length === 0 && respondedRequests.length === 0 && (
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">No matching requests</h3>
            <p className="text-sm text-muted-foreground">
              There are no open service requests matching your business category.
            </p>
          </div>
        )}
      </div>

      {/* Request Details Dialog */}
      <RequestDetailsDialog 
        request={selectedRequest}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        providerId={providerId}
      />
    </>
  );
};

export default ProviderInbox;
