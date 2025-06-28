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
import { CalendarIcon, Loader2, MessageSquare, Users, Building, ArrowRight, AlertCircle, RefreshCw, Database, MapPin, Star, Navigation, Phone, Languages, Trash2, Heart } from 'lucide-react';
import { useConversationsOptimized } from '@/hooks/useConversationsOptimized';
import { useMultipleConversationUnreadCounts } from '@/hooks/useConversationUnreadCount';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from '@/contexts/LocationContext';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import { useDistanceCache } from '@/hooks/useDistanceCache';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';
import { useInboxFilters } from '@/hooks/useSearchFilters';
import InboxFilters from '@/components/InboxFilters';
import { usePresence } from '@/hooks/usePresence';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import ChatDialog from '@/components/messaging/ChatDialog';
import { useServiceProviderLanguages } from '@/hooks/useBusinessLanguages';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useWishlist, BusinessWishlistItem } from '@/contexts/WishlistContext';

// Create a custom sidebar toggle button component that uses useSidebar
const SidebarToggleButton = () => {
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === "expanded";
  
  return (
    <button 
      onClick={toggleSidebar}
      className={cn(
        "fixed left-0 top-1/2 -translate-y-1/2 z-[100] bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg transition-all duration-300",
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

// Component to display provider languages
const ProviderLanguages: React.FC<{ providerId: string }> = ({ providerId }) => {
  const { data: languages } = useServiceProviderLanguages(providerId);
  
  if (!languages || languages.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Languages className="h-4 w-4" />
      <span className="line-clamp-1">
        {languages.map(lang => lang.name).join(', ')}
      </span>
    </div>
  );
};

const Inbox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRequests, isLoadingUserRequests, deleteRequest, isDeleting } = useServiceRequests();
  const { conversations, isLoading: isLoadingConversations, unreadCount } = useConversationsOptimized();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("messages");
  const [retryCount, setRetryCount] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Chat dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Add presence tracking for online status
  const { isUserOnline } = usePresence('general');
  
  // Sorting state for messages
  const [messagesSortBy, setMessagesSortBy] = useState<string>('recent');
  
  // Initialize inbox filters
  const { filters: inboxFilters, setters: inboxSetters } = useInboxFilters();
  
  // Use global location context
  const { isLocationEnabled, userLocation } = useLocation();
  
  // Distance caching
  const { calculateDistancesForBusinesses } = useDistanceCache();

  // Auto-select first request if none selected and requests are available
  useEffect(() => {
    if (!selectedRequestId && userRequests && userRequests.length > 0 && !isLoadingUserRequests) {
      console.log('Auto-selecting first request:', userRequests[0].id);
      setSelectedRequestId(userRequests[0].id);
    }
  }, [selectedRequestId, userRequests, isLoadingUserRequests]);
  
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

  // Handle deleting a request
  const handleDeleteRequest = (requestId: string, requestTitle: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent request selection when clicking delete
    
    // If we're deleting the currently selected request, we need to handle selection
    if (selectedRequestId === requestId) {
      // Find the next request to select after deletion
      const currentIndex = userRequests?.findIndex(req => req.id === requestId) || 0;
      const nextRequest = userRequests?.[currentIndex + 1] || userRequests?.[currentIndex - 1];
      
      // Set the next selected request before deletion
      if (nextRequest) {
        setSelectedRequestId(nextRequest.id);
      } else {
        setSelectedRequestId(null);
      }
    }
    
    deleteRequest(requestId);
  };
  
  // Handle opening chat dialog
  const handleChatOpen = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setChatDialogOpen(true);
  };

  // Handle closing chat dialog
  const handleChatClose = () => {
    setChatDialogOpen(false);
    setSelectedConversationId(null);
  };
  
  // Get the selected request details
  const selectedRequest = userRequests?.find(req => req.id === selectedRequestId);
  
  // Filter conversations for the selected request with debugging
  const requestConversations = useMemo(() => {
    if (!conversations || !selectedRequestId) {
      console.log('No conversations or selectedRequestId:', { conversations: !!conversations, selectedRequestId });
      return [];
    }
    
    const filtered = conversations.filter(conv => conv.request_id === selectedRequestId);
    console.log('Filtering conversations:', {
      totalConversations: conversations.length,
      selectedRequestId,
      filteredCount: filtered.length
    });
    
    return filtered;
  }, [conversations, selectedRequestId]);
  
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
    // Note: refetchConversations not available in optimized hook
    // Real-time subscription will handle updates automatically
    
    toast({
      title: "Retrying...",
      description: `Real-time updates will refresh conversations automatically`,
    });
  };

  // Removed location calculation logic - now handled by global context

  // State for conversations with distance calculations
  const [conversationsWithDistance, setConversationsWithDistance] = useState<any[]>([]);
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);

  // Calculate distances for conversations when location is enabled
  // Using a more efficient approach to prevent infinite loops
  useEffect(() => {
    let isMounted = true;

    const calculateDistances = async () => {
      if (!requestConversations?.length || !userLocation || !isLocationEnabled) {
        if (isMounted) {
          setConversationsWithDistance([]);
        }
        return;
      }

      // Check if we have provider details for all conversations
      const hasAllProviderDetails = requestConversations.every(conv => 
        enhancedProviderDetails[conv.provider_id]
      );
      
      if (!hasAllProviderDetails) {
        // Provider details not loaded yet, skip distance calculation
        return;
      }

      if (isMounted) {
        setIsCalculatingDistances(true);
      }

      try {
        // Prepare businesses data for distance calculation
        const businessesForDistanceCalc = requestConversations.map(conversation => {
          const providerDetails = enhancedProviderDetails[conversation.provider_id];
          return {
            id: conversation.provider_id,
            name: conversation.service_providers?.name || 'Unknown Provider',
            postal_code: providerDetails?.postal_code,
            latitude: undefined, // We don't have exact coordinates for providers
            longitude: undefined,
            map_link: undefined
          };
        }).filter(business => business.postal_code); // Only include businesses with postal codes

        // Use cached distance calculation
        const distanceResults = await calculateDistancesForBusinesses(userLocation, businessesForDistanceCalc);
        
        // Create a map of provider_id to distance
        const distanceMap = new Map();
        distanceResults.forEach(result => {
          if (result.distance !== null) {
            distanceMap.set(result.business.id, result.distance);
          }
        });

        // Apply distances to conversations
        const conversationsWithDistanceData = requestConversations.map(conversation => ({
          ...conversation,
          calculatedDistance: distanceMap.get(conversation.provider_id) || null
        }));

        if (isMounted) {
          setConversationsWithDistance(conversationsWithDistanceData);
        }
      } catch (error) {
        console.error('Error calculating distances for conversations:', error);
        if (isMounted) {
          setConversationsWithDistance([]);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingDistances(false);
        }
      }
    };

    // Only calculate distances if we have all the required data
    if (requestConversations?.length && userLocation && isLocationEnabled && Object.keys(enhancedProviderDetails).length > 0) {
      calculateDistances();
    }

    return () => {
      isMounted = false;
    };
  }, [
    requestConversations?.length,
    userLocation?.lat,
    userLocation?.lng,
    isLocationEnabled,
    Object.keys(enhancedProviderDetails).join(',') // Convert to string to avoid object reference issues
  ]);

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

  // Apply filters and sort conversations
  const filteredAndSortedConversations = useMemo(() => {
    // Use conversations with distance if location is enabled and distances are calculated
    const conversationsToFilter = isLocationEnabled && conversationsWithDistance.length > 0
      ? conversationsWithDistance 
      : requestConversations || [];

    // Apply filters
    let filtered = conversationsToFilter.filter(conversation => {
      const providerDetails = enhancedProviderDetails[conversation.provider_id];
      
      // Apply rating filter
      if (inboxFilters.minRating[0] > 0) {
        const overallScore = providerDetails?.overallScore || 0;
        if (overallScore === 0 || overallScore < inboxFilters.minRating[0]) {
          return false;
        }
      }
      
      // Apply city filter
      if (inboxFilters.city.trim() !== '') {
        const providerCity = providerDetails?.city || '';
        if (!providerCity.toLowerCase().includes(inboxFilters.city.toLowerCase())) {
          return false;
        }
      }
      
      // Apply postal code filter
      if (inboxFilters.postalCode.trim() !== '') {
        const providerPostalCode = providerDetails?.postal_code || '';
        if (!providerPostalCode.includes(inboxFilters.postalCode)) {
          return false;
        }
      }
      
      // Apply price type filter
      if (inboxFilters.priceType !== 'all') {
        const pricingType = providerDetails?.latestPricing?.pricing_type;
        if (pricingType !== inboxFilters.priceType) {
          return false;
        }
      }
      
      // TODO: Apply language filter when provider language data is available
      // if (inboxFilters.languages.length > 0) {
      //   // Check if provider speaks any of the selected languages
      // }
      
      return true;
    });

    // Sort the filtered conversations
    const sorted = [...filtered].sort((a, b) => {
      switch (inboxFilters.sortBy) {
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
          const aRating = enhancedProviderDetails[a.provider_id]?.overallScore || 0;
          const bRating = enhancedProviderDetails[b.provider_id]?.overallScore || 0;
          return bRating - aRating;
        case 'price':
          const aPrice = enhancedProviderDetails[a.provider_id]?.latestPricing?.quotation_price || 0;
          const bPrice = enhancedProviderDetails[b.provider_id]?.latestPricing?.quotation_price || 0;
          return aPrice - bPrice; // Lowest price first
        case 'latest':
        default:
          return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime();
      }
    });

    return sorted;
  }, [requestConversations, conversationsWithDistance, isLocationEnabled, inboxFilters, enhancedProviderDetails]);
  
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

  // Handle call functionality for provider call button - updated to trigger device call interface
  const handleCall = (phone: string, providerName: string) => {
    if (phone) {
      // Use window.location.href to properly trigger device's native call interface
      window.location.href = `tel:${phone}`;
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

  // Handle wishlist toggle for provider cards
  const handleProviderWishlistToggle = (conversation: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const providerDetails = enhancedProviderDetails[conversation.provider_id];
    
    const businessWishlistItem: BusinessWishlistItem = {
      id: conversation.provider_id,
      name: conversation.service_providers?.name || 'Unknown Provider',
      category: 'Service Provider', // Default category for service providers
      area: providerDetails?.area,
      city: providerDetails?.city,
      images: providerDetails?.images,
      contact_phone: providerDetails?.contact_phone,
      type: 'business'
    };
    
    toggleWishlist(businessWishlistItem);
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
                          <div className="absolute top-2 right-8">
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                              {requestUnreadCounts[request.id]}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              disabled={isDeleting}
                              title="Delete request"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{request.title}"? This action cannot be undone and will also delete all associated conversations and messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDeleteRequest(request.id, request.title, e)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <div className="flex justify-between items-start mb-1 pr-10">
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
                <div className="flex flex-col items-center justify-center h-full text-center p-4 relative">
                  {/* Animated arrow pointing to sidebar */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ArrowRight className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                  
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
                  
                  {/* Location is managed globally via the header toggle */}
                  
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
                      {/* Filter and Sort Controls */}
                      <div className="mb-4">
                        <InboxFilters
                          minRating={inboxFilters.minRating}
                          setMinRating={inboxSetters.setMinRating}
                          languages={inboxFilters.languages}
                          setLanguages={inboxSetters.setLanguages}
                          city={inboxFilters.city}
                          setCity={inboxSetters.setCity}
                          postalCode={inboxFilters.postalCode}
                          setPostalCode={inboxSetters.setPostalCode}
                          priceType={inboxFilters.priceType}
                          setPriceType={inboxSetters.setPriceType}
                          sortBy={inboxFilters.sortBy}
                          setSortBy={inboxSetters.setSortBy}
                          isLocationEnabled={isLocationEnabled}
                        />
                      </div>

                      <div className="space-y-4">
                        {isLoadingConversations ? (
                          <div className="flex justify-center py-8">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Loading messages...</span>
                            </div>
                          </div>
                        ) : filteredAndSortedConversations.length === 0 ? (
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
                          filteredAndSortedConversations.map((conversation) => {
                            const unreadCount = conversationUnreadCounts[conversation.id] || 0;
                            const providerDetails = enhancedProviderDetails[conversation.provider_id];
                            const isProviderOnline = isUserOnline(conversation.service_providers?.user_id);
                            const isProviderInWishlist = isInWishlist(conversation.provider_id, 'business');
                            
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
                                    <div className="flex flex-col">
                                      <span>{conversation.service_providers.name || "Service Provider"}</span>
                                      <OnlineIndicator 
                                        isOnline={isProviderOnline} 
                                        size="sm" 
                                        showText={true}
                                        className="mt-1"
                                      />
                                    </div>
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
                                    {/* Shop Images Carousel with Wishlist Heart */}
                                    {providerDetails && (
                                      <div className="relative">
                                        <ProviderImageCarousel 
                                          images={providerDetails.images || []}
                                          providerName={conversation.service_providers.name || "Service Provider"}
                                          className="mb-3"
                                        />
                                        {/* Wishlist Heart Icon Overlay */}
                                        <button
                                          onClick={(e) => handleProviderWishlistToggle(conversation, e)}
                                          className="absolute top-2 left-2 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white transition-all shadow-sm"
                                          aria-label={isProviderInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                                        >
                                          <Heart
                                            className={cn(
                                              "h-5 w-5 transition-colors",
                                              isProviderInWishlist
                                                ? "fill-red-500 text-red-500"
                                                : "text-gray-600 hover:text-red-500"
                                            )}
                                          />
                                        </button>
                                      </div>
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
                                    
                                    {/* Languages Spoken */}
                                    <ProviderLanguages providerId={conversation.provider_id} />
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
                                      onClick={() => handleChatOpen(conversation.id)}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      {unreadCount > 0 ? 'New Messages' : 'View Chat'}
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
                      {selectedRequestId && (
                        <MatchingProvidersContent requestId={selectedRequestId} />
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </SidebarProvider>
        
        {/* Chat Dialog */}
        <ChatDialog
          conversationId={selectedConversationId}
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Inbox;
