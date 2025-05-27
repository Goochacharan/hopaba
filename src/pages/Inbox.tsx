import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/MainLayout';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarTrigger, 
  SidebarHeader,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchingProvidersContent } from '@/components/request/MatchingProvidersDialog';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, MessageSquare, Users, Building, ArrowRight, AlertCircle, RefreshCw, Database, MapPin, Star, Navigation, Phone } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useMultipleConversationUnreadCounts } from '@/hooks/useConversationUnreadCount';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { distanceService, type Location } from '@/services/distanceService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  calculateItemDistance,
  getDistanceDisplayText,
  type ProviderWithDistance 
} from '@/utils/locationFilterUtils';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';

// Create a custom sidebar toggle button component that uses useSidebar
const SidebarToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === "expanded";
  
  return (
    <button 
      onClick={toggleSidebar}
      className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 z-[100] bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg transition-all duration-300",
        "flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring",
        "md:h-16 md:w-8",
        "h-14 w-7",
        "border-r border-t border-b border-primary-foreground/20",
        isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <ArrowRight size={20} className="animate-pulse" />
    </button>
  );
};

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRequests, isLoadingUserRequests } = useServiceRequests();
  const { conversations, isLoadingConversations, conversationsError, refetchConversations, unreadCount } = useConversations();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("messages");
  const [retryCount, setRetryCount] = useState(0);
  
  // Location and sorting state for messages
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState<boolean>(false);
  const [messagesSortBy, setMessagesSortBy] = useState<string>('recent');
  const [conversationsWithDistance, setConversationsWithDistance] = useState<any[]>([]);
  
  // Enhanced debug logging for conversations
  useEffect(() => {
    console.log('Inbox - Conversations data:', conversations);
    console.log('Inbox - Loading state:', isLoadingConversations);
    console.log('Inbox - Error state:', conversationsError);
    console.log('Inbox - Selected request ID:', selectedRequestId);
    console.log('Inbox - User ID:', user?.id);
    
    if (conversationsError) {
      console.error('Detailed conversation error:', conversationsError);
    }
  }, [conversations, isLoadingConversations, conversationsError, selectedRequestId, user]);
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  const handleRequestClick = (requestId: string) => {
    console.log('Request clicked:', requestId);
    setSelectedRequestId(requestId);
    setActiveTab("messages");
    setRetryCount(0); // Reset retry count when switching requests
  };
  
  // Get the selected request details
  const selectedRequest = userRequests?.find(req => req.id === selectedRequestId);
  
  // Filter conversations for the selected request with debugging
  const requestConversations = conversations?.filter(
    conv => conv.request_id === selectedRequestId
  ) || [];
  
  // Get unread counts for the selected request
  const conversationIds = requestConversations.map(conv => conv.id);
  const { data: conversationUnreadCounts = {} } = useMultipleConversationUnreadCounts(conversationIds);
  
  // Calculate total unread count for the selected request
  const requestUnreadCount = Object.values(conversationUnreadCounts).reduce((total, count) => total + count, 0);

  // Get unread counts for ALL conversations to show in sidebar
  const allConversationIds = conversations?.map(conv => conv.id) || [];
  const { data: allConversationUnreadCounts = {} } = useMultipleConversationUnreadCounts(allConversationIds);
  
  // Calculate unread counts per request for sidebar display
  const requestUnreadCounts = useMemo(() => {
    if (!userRequests || !conversations || !allConversationUnreadCounts) return {};
    
    const counts: Record<string, number> = {};
    
    userRequests.forEach(request => {
      const requestConvs = conversations.filter(conv => conv.request_id === request.id);
      const totalUnread = requestConvs.reduce((total, conv) => {
        return total + (allConversationUnreadCounts[conv.id] || 0);
      }, 0);
      counts[request.id] = totalUnread;
    });
    
    return counts;
  }, [userRequests, conversations, allConversationUnreadCounts]);
  
  console.log('Filtered conversations for request:', selectedRequestId, requestConversations);
  console.log('Conversation unread counts:', conversationUnreadCounts);

  // Fetch enhanced provider details for conversations
  const { data: enhancedProviderDetails = {} } = useQuery({
    queryKey: ['enhancedProviderDetails', requestConversations.map(c => c.provider_id)],
    queryFn: async () => {
      if (!requestConversations.length) return {};
      
      const providerIds = requestConversations.map(c => c.provider_id);
      
      // Fetch provider details including address information, images, and contact_phone
      const { data: providerDetails } = await supabase
        .from('service_providers')
        .select('id, address, area, city, postal_code, images, contact_phone')
        .in('id', providerIds);
      
      // Fetch reviews for all providers from business_reviews table with criteria ratings
      const { data: reviews } = await supabase
        .from('business_reviews')
        .select('business_id, rating, criteria_ratings')
        .in('business_id', providerIds);

      // Fetch latest message with pricing info for each conversation
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('conversation_id, pricing_type, quotation_price, wholesale_price, negotiable_price')
        .in('conversation_id', requestConversations.map(c => c.id))
        .not('quotation_price', 'is', null)
        .order('created_at', { ascending: false });
      
      // Process the data to create enhanced provider details
      const enhancedDetails: Record<string, {
        address: string;
        area: string;
        city: string;
        postal_code: string;
        images: string[];
        contact_phone: string;
        rating: number;
        reviewCount: number;
        overallScore: number;
        latestPricing?: {
          pricing_type?: string;
          quotation_price?: number;
          wholesale_price?: number;
          negotiable_price?: number;
        };
      }> = {};
      
      requestConversations.forEach(conv => {
        const providerDetail = providerDetails?.find(p => p.id === conv.provider_id);
        const providerReviews = reviews?.filter(r => r.business_id === conv.provider_id) || [];
        const latestMessage = latestMessages?.find(m => m.conversation_id === conv.id);
        
        // Calculate average rating
        let rating = 4.5; // Default rating
        let reviewCount = 0;
        let overallScore = 0;
        
        if (providerReviews.length > 0) {
          rating = providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length;
          reviewCount = providerReviews.length;
          
          // Calculate overall score using criteria ratings
          const aggregatedCriteriaRatings: Record<string, number[]> = {};
          
          providerReviews.forEach(review => {
            if (review.criteria_ratings) {
              Object.entries(review.criteria_ratings).forEach(([criterionId, criteriaRating]) => {
                if (!aggregatedCriteriaRatings[criterionId]) {
                  aggregatedCriteriaRatings[criterionId] = [];
                }
                aggregatedCriteriaRatings[criterionId].push(criteriaRating as number);
              });
            }
          });
          
          // Calculate average for each criterion
          const averageCriteriaRatings: Record<string, number> = {};
          Object.entries(aggregatedCriteriaRatings).forEach(([criterionId, ratings]) => {
            const sum = ratings.reduce((acc, val) => acc + val, 0);
            averageCriteriaRatings[criterionId] = sum / ratings.length;
          });
          
          overallScore = calculateOverallRating(averageCriteriaRatings);
        }

        // Set all pricing related fields
        const pricingInfo = latestMessage ? {
          pricing_type: latestMessage.pricing_type,
          quotation_price: latestMessage.quotation_price,
          wholesale_price: latestMessage.wholesale_price,
          negotiable_price: latestMessage.negotiable_price
        } : undefined;
        
        enhancedDetails[conv.provider_id] = {
          address: providerDetail?.address || '',
          area: providerDetail?.area || 'Unknown',
          city: providerDetail?.city || 'Unknown',
          postal_code: providerDetail?.postal_code || '',
          images: providerDetail?.images || [],
          contact_phone: providerDetail?.contact_phone || '',
          rating,
          reviewCount,
          overallScore,
          latestPricing: pricingInfo
        };
      });
      
      return enhancedDetails;
    },
    enabled: requestConversations.length > 0,
    staleTime: 60000, // 1 minute cache
  });

  // Enhanced retry handler with better feedback
  const handleRetryConversations = () => {
    console.log('Retrying conversation fetch, attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    refetchConversations();
    
    toast({
      title: "Retrying...",
      description: `Attempting to reload conversations (${retryCount + 1}/3)`,
    });
  };

  // Handle location enable/disable for messages
  const handleLocationToggle = async () => {
    if (isLocationEnabled) {
      // Disable location
      setIsLocationEnabled(false);
      setUserLocation(null);
      setConversationsWithDistance([]);
      toast({
        title: "Location disabled",
        description: "Distance sorting is now disabled",
      });
    } else {
      // Enable location
      setIsCalculatingDistances(true);
      try {
        console.log('🔍 Getting user location for messages...');
        const location = await distanceService.getUserLocation();
        setUserLocation(location);
        setIsLocationEnabled(true);
        console.log('📍 User location obtained:', location);
        
        toast({
          title: "Location enabled",
          description: "Distance calculation enabled for message sorting",
        });

        // Calculate distances for current conversations
        if (requestConversations && requestConversations.length > 0) {
          await calculateDistancesForConversations(requestConversations, location);
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

  // Calculate distances for conversations
  const calculateDistancesForConversations = async (conversations: any[], userLoc: Location) => {
    setIsCalculatingDistances(true);
    try {
      const conversationsWithDist = await Promise.all(
        conversations.map(async (conversation) => {
          let calculatedDistance = null;
          let distanceText = null;

          // Get provider details for distance calculation
          const providerDetails = enhancedProviderDetails[conversation.provider_id];
          
          if (providerDetails && providerDetails.postal_code) {
            try {
              // Get coordinates from postal code (use fallback first as it's more reliable from browser)
              let providerLocation: Location;
              try {
                providerLocation = await distanceService.getCoordinatesFromPostalCodeFallback(providerDetails.postal_code);
                console.log(`📍 Geocoded ${providerDetails.postal_code} to:`, providerLocation);
              } catch (error) {
                console.warn('⚠️ Fallback geocoding failed, trying Google API...');
                providerLocation = await distanceService.getCoordinatesFromPostalCode(providerDetails.postal_code);
                console.log(`📍 Geocoded ${providerDetails.postal_code} to:`, providerLocation);
              }

              // Calculate straight-line distance
              const straightLineDistance = distanceService.calculateStraightLineDistance(userLoc, providerLocation);
              calculatedDistance = straightLineDistance; // Already in km
              distanceText = `${straightLineDistance.toFixed(1)} km`;
              console.log(`📍 Distance calculated for ${conversation.service_providers.name}: ${calculatedDistance.toFixed(2)} km`);
            } catch (error) {
              console.warn(`Failed to calculate distance for ${conversation.service_providers.name}:`, error);
            }
          } else {
            console.log(`⚠️ No postal code available for ${conversation.service_providers.name}`);
          }

          return {
            ...conversation,
            calculatedDistance,
            distanceText
          };
        })
      );
      
      setConversationsWithDistance(conversationsWithDist);
      console.log('✅ Distance calculation completed for', conversationsWithDist.length, 'conversations');
      
      // Log summary of distance calculations
      const withDistance = conversationsWithDist.filter(c => c.calculatedDistance !== null);
      const withoutDistance = conversationsWithDist.filter(c => c.calculatedDistance === null);
      console.log(`📊 Distance calculation summary: ${withDistance.length} with distance, ${withoutDistance.length} without distance`);
      
    } catch (error) {
      console.error('❌ Failed to calculate distances:', error);
      toast({
        title: "Distance calculation failed",
        description: "Using conversations without distance data",
        variant: "destructive"
      });
    } finally {
      setIsCalculatingDistances(false);
    }
  };

  // Recalculate distances when conversations change and location is enabled
  useEffect(() => {
    if (requestConversations && requestConversations.length > 0 && userLocation && isLocationEnabled) {
      calculateDistancesForConversations(requestConversations, userLocation);
    }
  }, [requestConversations, userLocation, isLocationEnabled, enhancedProviderDetails]);

  // Enhanced error message based on error type
  const getErrorMessage = (error: any) => {
    if (!error) return "Unknown error occurred";
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('syntax error')) {
      return "Database query error. Please try refreshing or contact support.";
    }
    if (errorMessage.includes('timeout')) {
      return "Request timed out. Please check your connection and try again.";
    }
    if (errorMessage.includes('authentication')) {
      return "Authentication error. Please log in again.";
    }
    
    return errorMessage;
  };

  // Sort conversations based on selected criteria
  const sortedConversations = useMemo(() => {
    // Use conversations with distance if location is enabled, otherwise use regular conversations
    const conversationsToSort = isLocationEnabled && conversationsWithDistance.length > 0
      ? conversationsWithDistance 
      : requestConversations || [];

    const sorted = [...conversationsToSort].sort((a, b) => {
      switch (messagesSortBy) {
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
          return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime();
        case 'rating':
          const aRating = enhancedProviderDetails[a.provider_id]?.rating || 0;
          const bRating = enhancedProviderDetails[b.provider_id]?.rating || 0;
          return bRating - aRating;
        case 'quotation':
          const aQuotation = a.latest_quotation || 0;
          const bQuotation = b.latest_quotation || 0;
          return aQuotation - bQuotation; // Lowest quotation first
        case 'recent':
        default:
          return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime();
      }
    });

    return sorted;
  }, [requestConversations, conversationsWithDistance, isLocationEnabled, messagesSortBy, enhancedProviderDetails]);
  
  // Helper function to get pricing type badge
  const getPricingTypeBadge = (pricingType: string | undefined) => {
    if (!pricingType) return null;
    
    switch (pricingType.toLowerCase()) {
      case 'fixed':
        return <Badge variant="default" className="ml-2">Fixed Price</Badge>;
      case 'negotiable':
        return <Badge variant="condition" className="ml-2 bg-orange-200 text-orange-800">Negotiable</Badge>;
      case 'wholesale':
        return <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">Wholesale</Badge>;
      default:
        return null;
    }
  };

  // Helper function to get pricing display
  const getPricingDisplay = (pricing: any) => {
    if (!pricing) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="bg-green-50 text-green-700 text-lg px-3 py-1">
            ₹{pricing.quotation_price?.toLocaleString()}
          </Badge>
          {getPricingTypeBadge(pricing.pricing_type)}
        </div>
        
        {pricing.pricing_type === 'negotiable' && pricing.negotiable_price && (
          <div className="text-xs text-center text-muted-foreground">
            Negotiable from ₹{pricing.negotiable_price.toLocaleString()}
          </div>
        )}
        
        {pricing.pricing_type === 'wholesale' && pricing.wholesale_price && (
          <div className="text-xs text-center text-muted-foreground">
            Wholesale: ₹{pricing.wholesale_price.toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  // Handle call functionality for provider call button
  const handleCall = (phone: string, providerName: string) => {
    if (phone) {
      const link = document.createElement('a');
      link.href = `tel:${phone}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Calling business",
        description: `Dialing ${phone}...`,
        duration: 2000
      });
    } else {
      toast({
        title: "Phone number not available",
        description: "This business has not provided a phone number",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Notification Prompt */}
        <NotificationPrompt className="mx-4 mt-4 mb-2" />
        
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-full min-h-[calc(100vh-128px)] w-full relative">
            <SidebarToggleButton />
            
            <Sidebar side="left">
              <SidebarHeader className="border-b border-border p-4">
                <h2 className="text-lg font-semibold">Your Requests</h2>
              </SidebarHeader>
              <SidebarContent>
                {isLoadingUserRequests ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !userRequests || userRequests.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No service requests yet.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {userRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => handleRequestClick(request.id)}
                        className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent relative ${
                          selectedRequestId === request.id ? 'bg-accent' : ''
                        }`}
                      >
                        {/* Unread count badge */}
                        {requestUnreadCounts[request.id] > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                              {requestUnreadCounts[request.id]}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-1 pr-8">
                          <h3 className="font-medium truncate">{request.title}</h3>
                          <Badge variant={request.status === 'open' ? 'default' : 'secondary'} className="ml-2">
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-1 mb-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Category:</span> {request.category}
                          {request.subcategory && (
                            <span> / {request.subcategory}</span>
                          )}
                        </div>
                        
                        {/* Show conversation count and unread indicator */}
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-muted-foreground">
                            {conversations?.filter(conv => conv.request_id === request.id).length || 0} conversations
                          </span>
                          {requestUnreadCounts[request.id] > 0 && (
                            <span className="text-blue-600 font-medium">
                              {requestUnreadCounts[request.id]} unread
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </SidebarContent>
              <SidebarRail />
            </Sidebar>
            
            <div className="flex-1 overflow-auto p-4">
              {!selectedRequestId ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <h2 className="text-xl font-medium">Select a Request</h2>
                  <p className="text-muted-foreground max-w-md">
                    Choose a service request from the sidebar to view messages and matching providers.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold">{selectedRequest?.title}</h1>
                      <p className="text-muted-foreground text-sm">
                        {selectedRequest?.category} {selectedRequest?.subcategory ? `/ ${selectedRequest.subcategory}` : ''}
                      </p>
                    </div>
                    <SidebarTrigger className="md:hidden" />
                  </div>
                  
                  {/* Location Toggle - moved above tabs */}
                  <div className="mb-4">
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
                  
                  <Tabs defaultValue="messages" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="messages">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages ({requestConversations.length})
                        {requestUnreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                            {requestUnreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="providers">
                        <Users className="h-4 w-4 mr-2" />
                        View Providers
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="messages">
                      {/* Sorting Controls */}
                      <div className="mb-4 flex items-center gap-4">
                        <label className="text-sm font-medium">Sort by:</label>
                        <Select value={messagesSortBy} onValueChange={setMessagesSortBy}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="rating">Highest Rating</SelectItem>
                            <SelectItem value="quotation">Lowest Quotation</SelectItem>
                            {isLocationEnabled && (
                              <SelectItem value="distance">Nearest Distance</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        {conversationsError ? (
                          <Alert variant="destructive" className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="flex flex-col gap-2">
                                <span className="font-medium">Failed to load messages</span>
                                <span className="text-sm">
                                  {getErrorMessage(conversationsError)}
                                </span>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button 
                                    onClick={handleRetryConversations} 
                                    variant="outline" 
                                    size="sm"
                                    disabled={retryCount >= 3}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {retryCount >= 3 ? 'Max retries reached' : `Retry (${retryCount}/3)`}
                                  </Button>
                                  <Button 
                                    onClick={() => window.location.reload()} 
                                    variant="outline" 
                                    size="sm"
                                  >
                                    <Database className="h-4 w-4 mr-2" />
                                    Refresh Page
                                  </Button>
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : isLoadingConversations ? (
                          <div className="flex justify-center py-8">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Loading messages...</span>
                            </div>
                          </div>
                        ) : sortedConversations.length === 0 ? (
                          <div className="text-center py-8 border rounded-md">
                            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                            <h3 className="text-lg font-medium">No messages yet</h3>
                            <p className="text-muted-foreground mb-4">
                              You haven't received any messages for this request.
                            </p>
                            <Button 
                              onClick={() => setActiveTab("providers")} 
                              variant="outline" 
                              className="mt-2"
                            >
                              Find Service Providers
                            </Button>
                          </div>
                        ) : (
                          sortedConversations.map((conversation) => {
                            const unreadCount = conversationUnreadCounts[conversation.id] || 0;
                            const providerDetails = enhancedProviderDetails[conversation.provider_id];
                            
                            return (
                              <Card key={conversation.id} className={cn(
                                "relative transition-all",
                                unreadCount > 0 && "border-blue-200 bg-blue-50/30"
                              )}>
                                {unreadCount > 0 && (
                                  <div className="absolute top-2 right-2 z-10">
                                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                      {unreadCount} new
                                    </Badge>
                                  </div>
                                )}
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg flex items-center justify-between">
                                    <span>{conversation.service_providers.name || "Service Provider"}</span>
                                    {providerDetails?.overallScore && (
                                      <div 
                                        className="flex items-center justify-center font-bold"
                                        style={{
                                          width: 48,
                                          height: 48,
                                          borderRadius: '50%',
                                          color: getRatingColor(providerDetails.overallScore),
                                          borderColor: getRatingColor(providerDetails.overallScore),
                                          borderWidth: 3,
                                          borderStyle: 'solid',
                                          fontSize: 20,
                                          background: '#fff',
                                          boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
                                        }}
                                        title={`Overall rating: ${providerDetails.overallScore}`}
                                      >
                                        {providerDetails.overallScore}
                                      </div>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {/* Shop Images Carousel */}
                                    {providerDetails && (
                                      <ProviderImageCarousel 
                                        images={providerDetails.images || []}
                                        providerName={conversation.service_providers.name || "Service Provider"}
                                        className="mb-3"
                                      />
                                    )}
                                    
                                    {/* Address Information - single display */}
                                    {providerDetails && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                          {providerDetails.address ? 
                                            `${providerDetails.address}, ${providerDetails.area}, ${providerDetails.city}` :
                                            `${providerDetails.area}, ${providerDetails.city}`
                                          }
                                          {providerDetails.postal_code && (
                                            <span className="text-xs ml-1">({providerDetails.postal_code})</span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Distance Information */}
                                    {conversation.calculatedDistance !== null && conversation.calculatedDistance !== undefined && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Navigation className="h-4 w-4 text-primary" />
                                        <span className="text-primary font-medium">
                                          {conversation.calculatedDistance.toFixed(1)} km away
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Fixed Star Rating with Review Count + Call Button */}
                                    {providerDetails && (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                          <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star 
                                                key={star} 
                                                className={cn(
                                                  "h-4 w-4",
                                                  star <= Math.round(providerDetails.rating) 
                                                    ? "fill-yellow-400 text-yellow-400" 
                                                    : "text-gray-300"
                                                )} 
                                              />
                                            ))}
                                          </div>
                                          <span className="text-muted-foreground">
                                            ({providerDetails.reviewCount})
                                          </span>
                                        </div>
                                        
                                        {/* Enhanced Call Button with proper styling */}
                                        {providerDetails.contact_phone && (
                                          <button
                                            onClick={() => handleCall(providerDetails.contact_phone, conversation.service_providers.name || "Service Provider")}
                                            title="Call Business"
                                            aria-label="Call business"
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-all rounded shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[2px] bg-blue-600 hover:bg-blue-500"
                                          >
                                            <Phone className="h-4 w-4" />
                                            Call
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Enhanced Quotation Price with Type */}
                                    {providerDetails?.latestPricing && getPricingDisplay(providerDetails.latestPricing)}
                                  </div>
                                </CardContent>
                                
                                {/* Bottom Navigation Bar */}
                                <CardFooter className="border-t pt-4 pb-4">
                                  <div className="flex w-full gap-2">
                                    <Button 
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => navigate(`/business/${conversation.provider_id}`)}
                                    >
                                      <Building className="h-4 w-4 mr-1" />
                                      View Profile
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className={cn(
                                        "flex-1",
                                        unreadCount > 0 && "bg-blue-600 hover:bg-blue-700"
                                      )}
                                      onClick={() => {
                                        // Set navigation source for back button
                                        sessionStorage.setItem('conversationNavigationSource', 'inbox');
                                        window.location.href = `/messages/${conversation.id}`;
                                      }}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      {unreadCount > 0 ? 'View New Messages' : 'View Chat'}
                                    </Button>
                                  </div>
                                </CardFooter>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="providers">
                      <div className="border rounded-lg p-4 shadow-sm">
                        {selectedRequestId && (
                          <MatchingProvidersContent requestId={selectedRequestId} />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </SidebarProvider>
      </div>
    </MainLayout>
  );
};

export default Inbox;
