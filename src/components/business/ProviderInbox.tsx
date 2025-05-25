import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, IndianRupee, MapPin, MessageSquare, AlertCircle, Eye, CheckCircle2, Mail, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';
import { useMultipleConversationUnreadCounts } from '@/hooks/useConversationUnreadCount';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestDetailsDialog } from '@/components/request/RequestDetailsDialog';
import { EnhancedQuotationDialog } from '@/components/request/EnhancedQuotationDialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { distanceService, type Location } from '@/services/distanceService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Location and sorting state for requests
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState<boolean>(false);
  const [requestsSortBy, setRequestsSortBy] = useState<string>('recent');
  const [requestsWithDistance, setRequestsWithDistance] = useState<any[]>([]);
  
  // Define a fallback empty array
  const emptyArray = useMemo<ServiceRequest[]>(() => [], []);
  
  // Helper function for normalized subcategory comparison with improved debugging
  const isSubcategoryMatch = useCallback((requestSubcategory?: string | string[], providerSubcategories?: string[]) => {
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
  }, []);
  
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
        
        // We don't attempt to join service_providers with service_requests
        // as there's no relationship defined between these tables in Supabase
        console.log('Skipping service_providers join - no relationship exists');
        
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
        
        // We don't query service_providers for service_requests anymore
        // since there's no relationship defined in Supabase
        let serviceProviderRequests: any[] = [];
        
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
  
  // Fetch business name for the provider
  const { data: businessData } = useQuery({
    queryKey: ['business-name', providerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('service_providers')
        .select('name')
        .eq('id', providerId)
        .single();
      return data;
    },
    enabled: !!providerId
  });
  
  // Check if the provider already has a conversation for a request
  const hasExistingConversation = useCallback((requestId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  }, [conversations, providerId]);
  
  // Get the conversation ID for a specific request
  const getConversationId = useCallback((requestId: string) => {
    if (!conversations) return null;
    const conversation = conversations.find(c => c.request_id === requestId && c.provider_id === providerId);
    return conversation ? conversation.id : null;
  }, [conversations, providerId]);
  
  // Handle opening the quotation dialog
  const handleContactRequester = useCallback((request: ServiceRequest) => {
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
  }, [user, setSelectedRequest, setIsQuotationDialogOpen]);

  // Handle viewing request details
  const handleViewDetails = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  }, [setSelectedRequest, setIsDetailsOpen]);
  
  // Retry fetching data
  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      refetch();
    }
  }, [retryCount, MAX_RETRIES, refetch]);
  
  // Group requests into "new" and "responded" using normal variables, not hooks
  const respondedRequests = useMemo(() => {
    if (!matchingRequests) return emptyArray;
    return matchingRequests.filter(req => hasExistingConversation(req.id)) || emptyArray;
  }, [matchingRequests, hasExistingConversation, emptyArray]);
  
  const newRequests = useMemo(() => {
    if (!matchingRequests) return emptyArray;
    return matchingRequests.filter(req => !hasExistingConversation(req.id)) || emptyArray;
  }, [matchingRequests, hasExistingConversation, emptyArray]);
  
  // Get conversation IDs for all responded requests - ensure this array is always defined
  const respondedRequestConversationIds = useMemo(() => {
    if (!respondedRequests || !conversations) return [];
    
    return respondedRequests
      .map(req => {
        const conversation = conversations.find(c => c.request_id === req.id && c.provider_id === providerId);
        return conversation ? conversation.id : '';
      })
      .filter(id => id !== '');
  }, [respondedRequests, conversations, providerId]);

  // Get unread counts for all conversations - MUST be called unconditionally at top level
  const { data: unreadCounts = {} } = useMultipleConversationUnreadCounts(respondedRequestConversationIds);
  
  // Calculate total unread count for all responded requests
  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  }, [unreadCounts]);
  
  // Create the unread badge rendering function
  const renderUnreadBadge = useCallback((requestId: string) => {
    const conversationId = getConversationId(requestId);
    if (!conversationId) return null;
    
    const unreadCount = unreadCounts[conversationId] || 0;
    if (unreadCount <= 0) return null;
    
    return (
      <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
        {unreadCount}
      </Badge>
    );
  }, [unreadCounts, getConversationId]);

  // Handle location enable/disable for requests
  const handleLocationToggle = async () => {
    if (isLocationEnabled) {
      // Disable location
      setIsLocationEnabled(false);
      setUserLocation(null);
      setRequestsWithDistance([]);
      toast({
        title: "Location disabled",
        description: "Distance sorting is now disabled",
      });
    } else {
      // Enable location
      setIsCalculatingDistances(true);
      try {
        console.log('🔍 Getting user location for requests...');
        const location = await distanceService.getUserLocation();
        setUserLocation(location);
        setIsLocationEnabled(true);
        console.log('📍 User location obtained:', location);
        
        toast({
          title: "Location enabled",
          description: "Distance calculation enabled for request sorting",
        });

        // Calculate distances for current requests
        if (matchingRequests && matchingRequests.length > 0) {
          await calculateDistancesForRequests(matchingRequests, location);
        }
      } catch (error) {
        console.error('❌ Failed to get user location:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access to enable distance sorting",
          variant: "destructive"
        });
      } finally {
        setIsCalculatingDistances(false);
      }
    }
  };

  // Calculate distances for requests
  const calculateDistancesForRequests = async (requests: any[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const requestsWithDist = await Promise.all(
        requests.map(async (request) => {
          let calculatedDistance = null;
          let distanceText = null;

          if (request.postal_code) {
            try {
              // Get coordinates from postal code (use fallback first as it's more reliable from browser)
              let requestLocation: Location;
              try {
                requestLocation = await distanceService.getCoordinatesFromPostalCodeFallback(request.postal_code);
                console.log(`📍 Geocoded ${request.postal_code} to:`, requestLocation);
              } catch (error) {
                console.warn('⚠️ Fallback geocoding failed, trying Google API...');
                requestLocation = await distanceService.getCoordinatesFromPostalCode(request.postal_code);
                console.log(`📍 Geocoded ${request.postal_code} to:`, requestLocation);
              }

              // Calculate straight-line distance
              const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, requestLocation);
              calculatedDistance = straightLineDistance; // Already in km
              distanceText = `${straightLineDistance.toFixed(1)} km`;
              console.log(`📍 Distance calculated for ${request.title}: ${calculatedDistance.toFixed(2)} km`);
            } catch (error) {
              console.warn(`Failed to calculate distance for ${request.title}:`, error);
            }
          } else {
            console.log(`⚠️ No postal code available for ${request.title}`);
          }

          return {
            ...request,
            calculatedDistance,
            distanceText
          };
        })
      );
      
      setRequestsWithDistance(requestsWithDist);
      console.log('✅ Distance calculation completed for', requestsWithDist.length, 'requests');
      
      // Log summary of distance calculations
      const withDistance = requestsWithDist.filter(r => r.calculatedDistance !== null);
      const withoutDistance = requestsWithDist.filter(r => r.calculatedDistance === null);
      console.log(`📊 Distance calculation summary: ${withDistance.length} with distance, ${withoutDistance.length} without distance`);
      
    } catch (error) {
      console.error('❌ Failed to calculate distances:', error);
      toast({
        title: "Distance calculation failed",
        description: "Using requests without distance data",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Recalculate distances when requests change and location is enabled
  useEffect(() => {
    if (matchingRequests && matchingRequests.length > 0 && userLocation && isLocationEnabled) {
      calculateDistancesForRequests(matchingRequests, userLocation);
    }
  }, [matchingRequests, userLocation, isLocationEnabled]);

  // Sort requests based on selected criteria
  const sortedNewRequests = useMemo(() => {
    // Use requests with distance if location is enabled, otherwise use regular requests
    const requestsToSort = isLocationEnabled && requestsWithDistance.length > 0
      ? requestsWithDistance.filter(req => !hasExistingConversation(req.id))
      : newRequests;

    const sorted = [...requestsToSort].sort((a, b) => {
      switch (requestsSortBy) {
        case 'distance':
          // Sort by calculated distance if available
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          // Fall back to recent if no distance data
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'budget':
          return (b.budget || 0) - (a.budget || 0); // Highest budget first
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [newRequests, requestsWithDistance, isLocationEnabled, requestsSortBy, hasExistingConversation]);

  const sortedRespondedRequests = useMemo(() => {
    // Use requests with distance if location is enabled, otherwise use regular requests
    const requestsToSort = isLocationEnabled && requestsWithDistance.length > 0
      ? requestsWithDistance.filter(req => hasExistingConversation(req.id))
      : respondedRequests;

    const sorted = [...requestsToSort].sort((a, b) => {
      switch (requestsSortBy) {
        case 'distance':
          // Sort by calculated distance if available
          const aDistance = a.calculatedDistance ?? null;
          const bDistance = b.calculatedDistance ?? null;
          
          if (aDistance !== null && bDistance !== null) {
            return aDistance - bDistance;
          }
          if (aDistance !== null) return -1;
          if (bDistance !== null) return 1;
          // Fall back to recent if no distance data
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'budget':
          return (b.budget || 0) - (a.budget || 0); // Highest budget first
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [respondedRequests, requestsWithDistance, isLocationEnabled, requestsSortBy, hasExistingConversation]);
  
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
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Location Toggle and Sorting Controls */}
        <div className="mb-4 space-y-4">
          {/* Location Toggle */}
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Distance Calculation</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable location to sort requests by distance
                  </p>
                </div>
              </div>
              <Button
                variant={isLocationEnabled ? "default" : "outline"}
                onClick={handleLocationToggle}
                disabled={isCalculatingDistances}
                className="flex items-center gap-2"
              >
                {isCalculatingDistances ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {isLocationEnabled ? "Disable Location" : "Enable Location"}
              </Button>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={requestsSortBy} onValueChange={setRequestsSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="budget">Highest Budget</SelectItem>
                {isLocationEnabled && (
                  <SelectItem value="distance">Nearest Distance</SelectItem>
                )}
              </SelectContent>
            </Select>
            {isCalculatingDistances && requestsSortBy === 'distance' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating distances...
              </div>
            )}
          </div>
        </div>
        {sortedNewRequests.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">
              New Requests 
              <Badge variant="secondary" className="ml-2">{sortedNewRequests.length}</Badge>
            </h3>
            <div className="space-y-4">
              {sortedNewRequests.slice(0, 5).map(request => (
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
                      {request.calculatedDistance !== null && request.calculatedDistance !== undefined && (
                        <div className="flex items-center gap-1">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="text-primary font-medium">
                            {request.calculatedDistance.toFixed(1)} km away
                          </span>
                        </div>
                      )}
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
              {sortedNewRequests.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Showing 5 of {sortedNewRequests.length} requests
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {sortedRespondedRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              Responded Requests
              <Badge variant="outline" className="ml-2">{sortedRespondedRequests.length}</Badge>
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {totalUnreadCount} unread
                </Badge>
              )}
            </h3>
            <div className="space-y-4">
              {sortedRespondedRequests.slice(0, 3).map(request => (
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
                      onClick={() => {
                        const conversationId = getConversationId(request.id);
                        if (conversationId) {
                          navigate(`/messages/${conversationId}`);
                        } else {
                          navigate('/messages');
                        }
                      }}
                    >
                      View Conversation
                      {renderUnreadBadge(request.id)}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {sortedRespondedRequests.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/messages')}
                  >
                    View all {sortedRespondedRequests.length} conversations
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {sortedNewRequests.length === 0 && sortedRespondedRequests.length === 0 && (
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
      <EnhancedQuotationDialog 
        request={selectedRequest}
        open={isQuotationDialogOpen}
        onOpenChange={setIsQuotationDialogOpen}
        providerId={providerId}
        businessName={businessData?.name}
      />
    </TooltipProvider>
  );
};

export default ProviderInbox;
