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
  
  // Helper function for normalized subcategory comparison with improved debugging
  const isSubcategoryMatch = (requestSubcategory?: string | string[], providerSubcategories?: string[]) => {
    console.log(`Checking subcategory match - Request: "${requestSubcategory}", Provider: ${JSON.stringify(providerSubcategories)}`);
    console.log(`Request subcategory type: ${typeof requestSubcategory}`, requestSubcategory);
    
    // If provider has no subcategories, match any request
    if (!providerSubcategories || providerSubcategories.length === 0) {
      console.log('Provider has no subcategories - MATCH');
      return true;
    }
    
    // If request has no subcategory but provider has subcategories,
    // accept it as a match to be more inclusive
    if (!requestSubcategory) {
      console.log('Request has no subcategory - MATCH');
      return true;
    }
    
    // Special direct check for "Catering" subcategory since it's common
    if (typeof requestSubcategory === 'string' && requestSubcategory.toLowerCase().includes('catering')) {
      const hasCateringProvider = providerSubcategories.some(
        sub => sub && sub.toLowerCase().includes('catering')
      );
      
      if (hasCateringProvider) {
        console.log('Direct catering match found - MATCH');
        return true;
      }
    }
    
    // Handle different subcategory formats
    let requestSubcategories: string[] = [];
    
    if (typeof requestSubcategory === 'string') {
      // If it's a string, convert to array
      requestSubcategories = [requestSubcategory.trim()];
      console.log('Request subcategory is a string, converted to array:', requestSubcategories);
    } else if (Array.isArray(requestSubcategory)) {
      // If it's already an array, use it
      requestSubcategories = requestSubcategory.filter(sub => sub && typeof sub === 'string');
      console.log('Request subcategory is an array:', requestSubcategories);
    } else {
      console.log('Unknown request subcategory format, treating as empty');
      return true; // Be permissive if format is unknown
    }
    
    // If after normalization we have no subcategories, match anything
    if (requestSubcategories.length === 0) {
      console.log('No valid request subcategories after normalization - MATCH');
      return true;
    }
    
    // For each request subcategory, check if any provider subcategory matches
    for (const reqSub of requestSubcategories) {
      const normalizedReqSub = reqSub.toLowerCase().trim();
      console.log(`Checking normalized request subcategory: "${normalizedReqSub}"`);
      
      for (const providerSub of providerSubcategories) {
        // Skip empty subcategories
        if (!providerSub || providerSub.trim() === '') continue;
        
        // Normalize provider subcategory
        const normalizedProviderSub = providerSub.toLowerCase().trim();
        console.log(`Comparing with provider subcategory: "${normalizedProviderSub}"`);
        
        // Check for exact match
        if (normalizedReqSub === normalizedProviderSub) {
          console.log('Exact match found - MATCH');
          return true;
        }
        
        // Check for partial match (more flexible)
        if (normalizedReqSub.includes(normalizedProviderSub) || 
            normalizedProviderSub.includes(normalizedReqSub)) {
          console.log('Partial match found - MATCH');
          return true;
        }
      }
    }
    
    console.log('No matching subcategory found - NO MATCH');
    return false;
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
      // Optimize query to only select needed columns and add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        console.log(`Fetching service requests for provider ${providerId}:`, {
          category,
          subcategory
        });
        
        // Check for RLS issues by trying to access service_requests as admin
        console.log('Checking if RLS policies might be blocking access...');
        // Try multiple approaches to debug RLS issues
        try {
          // First check if we're authenticated
          const { data: authData } = await supabase.auth.getUser();
          console.log('Current authenticated user:', authData?.user?.id);
          
          // Try to access the service_requests directly with minimum columns
          const directCheck = await supabase
            .from('service_requests')
            .select('id, status')
            .limit(5);
            
          console.log('Direct service_requests access check:', directCheck);
        } catch (err) {
          console.error('RLS diagnostic error:', err);
        }
        
        // Diagnostic: Check if we can access the service_requests table at all
        const testResponse = await supabase
          .from('service_requests')
          .select('count');
        
        console.log('Service requests count test:', testResponse);
        
        if (testResponse.error) {
          console.error('Permission or access error:', testResponse.error);
          throw new Error(`Cannot access service_requests table: ${testResponse.error.message}`);
        }
        
        // Check if there are any service requests in the table
        // First try with authenticated client to check for RLS issues
        console.log('Checking permissions - RLS test:');
        const authTest = await supabase.auth.getSession();
        console.log('Current auth session:', authTest);
        
        const rlsTest = await supabase
          .from('service_requests')
          .select('id, title, status, category')
          .limit(1);
          
        console.log('RLS test result:', rlsTest);
        
        if (rlsTest.error) {
          console.error('Possible Row Level Security (RLS) issue:', rlsTest.error);
          // Don't throw here, try to continue
        }
        
        // Try a special approach with service_providers table to get around RLS
        console.log('Trying approach through service providers junction...');
        const serviceProviderQuery = await supabase
          .from('service_providers')
          .select(`
            id,
            service_requests (
              id, title, description, budget, area, city, created_at, subcategory, user_id, status, category
            )
          `)
          .eq('id', providerId);

        console.log('Service provider query result:', serviceProviderQuery);
        
        // Now try regular query but get ALL requests regardless of category first
        const rawRequests = await supabase
          .from('service_requests')
          .select('id, title, status, category, subcategory')
          .limit(100);
          
        console.log('Raw service requests (up to 100):', rawRequests);

        if (rawRequests.error) {
          console.error('Error fetching raw requests:', rawRequests.error);
          throw rawRequests.error;
        }

        if (!rawRequests.data || rawRequests.data.length === 0) {
          console.log('No service requests found in the database');
          return [];
        }

        // Log unique status and category values to help debug
        const statusValues = [...new Set(rawRequests.data.map(req => req.status))];
        const categoryValues = [...new Set(rawRequests.data.map(req => req.category))];
        console.log('Status values in database:', statusValues);
        console.log('Category values in database:', categoryValues);

        // Try to find matching requests with flexible criteria but WITHOUT category filter first
        const { data, error } = await supabase
          .from('service_requests')
          .select('id, title, description, budget, area, city, created_at, subcategory, user_id, status, category')
          .or(`status.eq.open,status.eq.Open,status.eq.OPEN,status.is.null`)
          .order('created_at', { ascending: false });
        
        console.log('All open requests (regardless of category):', data);
        console.log('Detailed request data for debugging:', data?.map(req => ({
          id: req.id,
          category: req.category, 
          subcategory: req.subcategory,
          title: req.title,
          status: req.status
        })));
        
        if (error) {
          console.error('Error in status query:', error);
          throw error;
        }
        
        // Filter by category in JavaScript to see all possibilities
        const categoryMatches = data?.filter(req => 
          req.category && req.category.toLowerCase() === category.toLowerCase()
        ) || [];
        
        console.log(`Requests matching category "${category}" (JS filter, case insensitive):`, categoryMatches);
        
        // Also check if we got any requests from the service provider query
        let serviceProviderRequests: any[] = [];
        if (serviceProviderQuery.data && serviceProviderQuery.data[0]?.service_requests) {
          serviceProviderRequests = serviceProviderQuery.data[0].service_requests;
          console.log('Service requests from provider query:', serviceProviderRequests);
          
          // Filter these requests by category
          const spCategoryMatches = serviceProviderRequests.filter(req => 
            req.category && req.category.toLowerCase() === category.toLowerCase()
          );
          
          console.log(`Service provider requests matching category "${category}":`, spCategoryMatches);
          
          // Add unique items from spCategoryMatches to categoryMatches
          spCategoryMatches.forEach(spReq => {
            if (!categoryMatches.some(cm => cm.id === spReq.id)) {
              categoryMatches.push(spReq);
            }
          });
          
          console.log('Combined category matches after merging:', categoryMatches);
        }
        
        // Now filter by subcategory
        let finalResults = categoryMatches;
        if (subcategory && subcategory.length > 0) {
          console.log('Filtering by subcategories:', subcategory);
          finalResults = finalResults.filter(req => isSubcategoryMatch(req.subcategory, subcategory));
          console.log('Results after subcategory filtering:', finalResults);
        }
        
        // If we have no matches with category filter, log all available requests
        if (finalResults.length === 0 && data && data.length > 0) {
          console.log('No category matches found. All available requests:', data);
        }
        
        clearTimeout(timeoutId);
        return finalResults as ServiceRequest[];
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Error in queryFn:', error);
        
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
  
  // Handle opening the quotation dialog
  const handleContactRequester = (request: ServiceRequest) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to contact a requester.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedRequest(request);
    setIsQuotationDialogOpen(true);
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
        <p className="text-sm text-muted-foreground mb-2">
          There are no open service requests matching your business category.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Your provider details:</p>
          <p>Category: <strong>{category}</strong></p>
          <p>Subcategories: <strong>{subcategory && subcategory.length > 0 ? subcategory.join(', ') : 'None'}</strong></p>
        </div>
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md max-w-md mx-auto">
          <h4 className="text-amber-800 font-medium mb-2">Troubleshooting</h4>
          <ul className="text-sm text-amber-700 text-left list-disc pl-4 space-y-1">
            <li>Make sure service requests exist in the system</li>
            <li>Verify requests have status "open" (or "Open")</li>
            <li>Check that requests have category "{category}"</li>
            <li>Refresh the page to update data</li>
          </ul>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
              onClick={async () => {
                try {
                  // Create a test service request with all required fields
                  const testRequest = {
                    title: `Test Request - ${category}`,
                    description: 'This is a test request created to diagnose service request issues',
                    category: category.toLowerCase(), // Use lowercase category to match user-created requests
                    subcategory: subcategory && subcategory.length > 0 ? 
                      subcategory[0].toLowerCase() : // Use lowercase subcategory
                      "catering", // Default to catering if no subcategory provided
                    status: 'open', // Using lowercase status as seen in database
                    budget: 1000,
                    city: 'Test City',
                    area: 'Test Area',
                    postal_code: '123456',
                    contact_phone: '1234567890',
                    user_id: user?.id,
                    created_at: new Date().toISOString(),
                    date_range_start: new Date().toISOString().split('T')[0],
                    date_range_end: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                  };
                  
                  console.log('Creating test request with:', testRequest);
                  
                  const { data, error } = await supabase
                    .from('service_requests')
                    .insert(testRequest)
                    .select();
                    
                  if (error) {
                    console.error('Error creating test request:', error);
                    toast({
                      title: 'Error creating test request',
                      description: error.message,
                      variant: 'destructive'
                    });
                  } else {
                    console.log('Test request created:', data);
                    
                    // Try to fetch the created request to verify it's accessible
                    const verifyResponse = await supabase
                      .from('service_requests')
                      .select('*')
                      .eq('id', data[0].id);
                      
                    console.log('Verify test request is accessible:', verifyResponse);
                    
                    toast({
                      title: 'Test request created!',
                      description: 'Refresh the page to see the new request',
                      variant: 'default'
                    });

                    // Force refetch after 1 second
                    setTimeout(() => {
                      refetch();
                    }, 1000);
                  }
                } catch (err) {
                  console.error('Exception creating test request:', err);
                  toast({
                    title: 'Error',
                    description: 'An unexpected error occurred',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Create Test Request
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
              onClick={async () => {
                try {
                  // Show provider ID for debugging
                  console.log('Debug - Current provider ID:', providerId);
                  console.log('Debug - Current user ID:', user?.id);
                  
                  // Direct query to fetch ALL requests without filters for debugging
                  const { data, error } = await supabase
                    .from('service_requests')
                    .select('*')
                    .limit(20);
                  
                  console.log('Debug - All service requests (first 20):', data);
                  
                  if (error) {
                    console.error('Debug query error:', error);
                    toast({
                      title: 'Query Error',
                      description: error.message,
                      variant: 'destructive'
                    });
                    return;
                  }
                  
                  if (!data || data.length === 0) {
                    toast({
                      title: 'No Service Requests Found',
                      description: 'The database contains no service requests',
                      variant: 'destructive'
                    });
                    return;
                  }
                  
                  // Check for service requests that might be created by other users
                  const nonOwnerRequests = data.filter(req => req.user_id !== user?.id);
                  console.log('Debug - Requests created by other users:', nonOwnerRequests);
                  
                  // Check specific request matching
                  const matchingCategory = data.filter(req => 
                    req.category && req.category.toLowerCase() === category.toLowerCase()
                  );
                  
                  console.log(`Debug - Requests with category "${category}":`, matchingCategory);
                  
                  let matchingSubcategory = [];
                  if (subcategory && subcategory.length > 0 && matchingCategory.length > 0) {
                    matchingSubcategory = matchingCategory.filter(req => 
                      isSubcategoryMatch(req.subcategory, subcategory)
                    );
                    console.log('Debug - Requests with matching subcategory:', matchingSubcategory);
                  }
                  
                  const matchingStatus = data.filter(req => 
                    req.status && req.status.toLowerCase() === 'open'
                  );
                  
                  console.log('Debug - Requests with status "open":', matchingStatus);
                  
                  // Now perform a direct test query for the specific category 
                  const directCategoryTest = await supabase
                    .from('service_requests')
                    .select('*')
                    .eq('status', 'open')
                    .ilike('category', `%${category}%`);
                    
                  console.log('Debug - Direct category test query:', directCategoryTest);
                  
                  // Print out detailed info about each service request
                  if (data.length > 0) {
                    console.log('Debug - Detailed service request info:');
                    data.forEach((req, index) => {
                      console.log(`Request ${index + 1}:`, {
                        id: req.id,
                        title: req.title,
                        category: req.category,
                        subcategory: req.subcategory,
                        status: req.status,
                        user_id: req.user_id,
                        matchesCategory: req.category?.toLowerCase() === category.toLowerCase(),
                        matchesSubcategory: subcategory && subcategory.length > 0 ? 
                          isSubcategoryMatch(req.subcategory, subcategory) : 'N/A',
                        matchesStatus: req.status?.toLowerCase() === 'open'
                      });
                    });
                  }
                  
                  toast({
                    title: 'Debug Results',
                    description: `Found ${data.length} total, ${matchingCategory.length} category matches, ${matchingStatus.length} open, ${matchingSubcategory.length} subcategory matches, ${nonOwnerRequests.length} by other users`,
                    variant: 'default'
                  });
                } catch (err) {
                  console.error('Exception in debug query:', err);
                  toast({
                    title: 'Error',
                    description: 'An unexpected error occurred during debugging',
                    variant: 'destructive'
                  });
                }
              }}
            >
              Debug Query
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Group requests into "new" and "responded"
  const respondedRequests = matchingRequests?.filter(req => hasExistingConversation(req.id)) || [];
  const newRequests = matchingRequests?.filter(req => !hasExistingConversation(req.id)) || [];
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
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
                          <p>You haven't responded to this request yet</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {request.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(request.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {request.budget && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>Budget: ₹{request.budget.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{request.area}, {request.city}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex space-x-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 flex items-center gap-1"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 flex items-center gap-1"
                        onClick={() => handleContactRequester(request)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Contact
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              {newRequests.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {newRequests.length} requests
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {respondedRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-3">
              Responded Requests
              <Badge variant="outline" className="ml-2">{respondedRequests.length}</Badge>
            </h3>
            <div className="space-y-4">
              {respondedRequests.slice(0, 3).map(request => (
                <Card key={request.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Responded
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You've already responded to this request</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {request.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(request.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {request.budget && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>Budget: ₹{request.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/messages')}
                    >
                      View Conversation
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {respondedRequests.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/messages')}
                  >
                    View all {respondedRequests.length} conversations
                  </Button>
                </div>
              )}
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
      
      {/* Quotation Dialog */}
      <QuotationDialog 
        request={selectedRequest}
        open={isQuotationDialogOpen}
        onOpenChange={setIsQuotationDialogOpen}
        providerId={providerId}
      />
    </TooltipProvider>
  );
};

export default ProviderInbox;
