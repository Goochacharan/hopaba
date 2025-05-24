import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, IndianRupee, MapPin, MessageSquare, AlertCircle, Eye, CheckCircle2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';
import { QuotationDialog } from '@/components/request/QuotationDialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

interface ProviderInboxProps {
  providerId: string;
  category: string;
  subcategory?: string[];
}

/**
 * Displays service requests that match provider's category and subcategories
 * Shows both new requests and requests that the provider has already responded to
 */
const ProviderInbox: React.FC<ProviderInboxProps> = ({
  providerId,
  category,
  subcategory
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations } = useConversations();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  
  // Debug logs for state changes
  console.log('ProviderInbox - Current state:', {
    selectedRequest: selectedRequest?.id || 'none',
    isDetailsOpen,
    isQuotationDialogOpen,
    providerId,
    user: user?.id || 'none'
  });
  
  // Helper function for normalized subcategory comparison with improved debugging
  const isSubcategoryMatch = (requestSubcategory?: string, providerSubcategories?: string[]) => {
    // For debugging
    console.log('Matching subcategories:', { 
      request: requestSubcategory, 
      provider: providerSubcategories 
    });
    
    // If provider has no subcategories, match any request
    if (!providerSubcategories || providerSubcategories.length === 0) {
      console.log('Provider has no subcategories, matching all requests');
      return true;
    }
    
    // If request has no subcategory but provider has subcategories,
    // only match if one of provider's subcategories is empty
    if (!requestSubcategory || requestSubcategory.trim() === '') {
      const hasEmptySubcategory = providerSubcategories.some(s => !s || s.trim() === '');
      console.log('Request has no subcategory, matching if provider has empty subcategory:', hasEmptySubcategory);
      return hasEmptySubcategory;
    }
    
    // Normalize request subcategory
    const normalizedRequestSub = requestSubcategory.toLowerCase().trim();
    console.log('Normalized request subcategory:', normalizedRequestSub);
    
    // Check if any of provider's subcategories match the request subcategory
    const match = providerSubcategories.some(providerSub => {
      // Skip empty subcategories
      if (!providerSub || providerSub.trim() === '') return false;
      
      // Normalize provider subcategory and compare
      const normalizedProviderSub = providerSub.toLowerCase().trim();
      console.log('Comparing request:', normalizedRequestSub, 'with provider:', normalizedProviderSub);
      
      // Check for exact match and partial match
      const exactMatch = normalizedRequestSub === normalizedProviderSub;
      const includesMatch = normalizedRequestSub.includes(normalizedProviderSub) || 
                            normalizedProviderSub.includes(normalizedRequestSub);
      
      console.log('Match result:', { exactMatch, includesMatch });
      return exactMatch || includesMatch;
    });
    
    console.log('Final subcategory match result:', match);
    return match;
  };
  
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
          .select('id, title, description, budget, area, city, created_at, subcategory, user_id, status, category')
          .eq('status', 'open')
          .eq('category', category)
          .order('created_at', { ascending: false });
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        
        console.log('Found service requests:', data?.length || 0);
        if (data && data.length > 0) {
          // Log some details about the found requests for debugging
          data.forEach(req => {
            console.log(`Request ${req.id}: Category: ${req.category}, Subcategory: ${req.subcategory}`);
          });
        }
        
        // Filter results on the client side for better subcategory matching
        let filteredData = data as ServiceRequest[];
        
        if (subcategory && subcategory.length > 0) {
          console.log('Filtering by subcategories:', subcategory);
          
          // Use the isSubcategoryMatch helper function
          filteredData = filteredData.filter(req => isSubcategoryMatch(req.subcategory, subcategory));
          
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
  
  // Handle opening the quotation dialog with extensive debugging
  const handleContactRequester = (request: ServiceRequest) => {
    console.log('=== DEBUG: handleContactRequester called ===');
    console.log('Request:', request);
    console.log('User:', user);
    console.log('Current state before change:', {
      selectedRequest: selectedRequest?.id,
      isQuotationDialogOpen
    });
    
    if (!user) {
      console.log('DEBUG: No user found, showing auth error');
      toast({
        title: "Authentication required",
        description: "You must be logged in to contact a requester.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('DEBUG: Setting selected request and opening dialog');
    setSelectedRequest(request);
    setIsQuotationDialogOpen(true);
    
    console.log('DEBUG: State should be changed now');
    
    // Force a re-render debug
    setTimeout(() => {
      console.log('DEBUG: State after timeout:', {
        selectedRequest: selectedRequest?.id,
        isQuotationDialogOpen
      });
    }, 100);
  };

  // Handle viewing request details with debugging
  const handleViewDetails = (request: ServiceRequest) => {
    console.log('=== DEBUG: handleViewDetails called ===');
    console.log('Request:', request);
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
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Your provider details:</p>
          <p>Category: {category}</p>
          <p>Subcategories: {subcategory && subcategory.length > 0 ? subcategory.join(', ') : 'None'}</p>
        </div>
      </div>
    );
  }
  
  // Group requests into "new" and "responded"
  const respondedRequests = matchingRequests?.filter(req => hasExistingConversation(req.id)) || [];
  const newRequests = matchingRequests?.filter(req => !hasExistingConversation(req.id)) || [];
  
  // Debug dialog state changes
  const handleQuotationDialogChange = (open: boolean) => {
    console.log('=== DEBUG: QuotationDialog onOpenChange called ===');
    console.log('New open state:', open);
    setIsQuotationDialogOpen(open);
  };

  const handleDetailsDialogChange = (open: boolean) => {
    console.log('=== DEBUG: RequestDetailsDialog onOpenChange called ===');
    console.log('New open state:', open);
    setIsDetailsOpen(open);
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Debug info */}
        <div className="p-2 bg-gray-100 text-xs rounded">
          DEBUG: Dialog states - Details: {isDetailsOpen ? 'OPEN' : 'CLOSED'}, Quotation: {isQuotationDialogOpen ? 'OPEN' : 'CLOSED'}, Selected: {selectedRequest?.id || 'none'}
        </div>
        
        {newRequests.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">
              New Requests 
              <Badge variant="secondary" className="ml-2">{newRequests.length}</Badge>
            </h3>
            <div className="space-y-4">
              {newRequests.slice(0, 5).map(request => (
                <Card key={request.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge>
                            <Mail className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>New request - you haven't responded yet</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(request.created_at), 'dd MMM yyyy')}
                      </span>
                      {request.subcategory && (
                        <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {request.subcategory}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <IndianRupee className="h-4 w-4" />
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
                      onClick={() => {
                        console.log('DEBUG: View Details button clicked for request:', request.id);
                        handleViewDetails(request);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        console.log('DEBUG: Send Quotation button clicked for request:', request.id);
                        handleContactRequester(request);
                      }}
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
            <h3 className="font-medium mb-3">
              Responded Requests
              <Badge variant="outline" className="ml-2">{respondedRequests.length}</Badge>
            </h3>
            <div className="space-y-4">
              {respondedRequests.slice(0, 5).map(request => (
                <Card key={request.id} className="border-l-4 border-l-muted-foreground">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Responded
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You've already sent a quotation for this request</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(request.created_at), 'dd MMM yyyy')}
                      </span>
                      {request.subcategory && (
                        <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {request.subcategory}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <IndianRupee className="h-4 w-4" />
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
                      onClick={() => {
                        console.log('DEBUG: View Details button clicked for request:', request.id);
                        handleViewDetails(request);
                      }}
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
        onOpenChange={handleDetailsDialogChange}
        providerId={providerId}
      />
      
      {/* Quotation Dialog with debugging */}
      <QuotationDialog 
        request={selectedRequest}
        open={isQuotationDialogOpen}
        onOpenChange={handleQuotationDialogChange}
        providerId={providerId}
      />
      
      {/* Debug overlay */}
      {isQuotationDialogOpen && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-[9999]">
          QUOTATION DIALOG SHOULD BE OPEN
        </div>
      )}
    </TooltipProvider>
  );
};

export default ProviderInbox;
