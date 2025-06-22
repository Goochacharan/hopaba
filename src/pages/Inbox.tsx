

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useConversations } from '@/hooks/useConversations';
import { usePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { OnlineIndicator } from '@/components/ui/online-indicator';
import { Loader2, MessageSquare, AlertTriangle, RefreshCw, Navigation, Phone, Star } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';
import ProviderImageCarousel from '@/components/providers/ProviderImageCarousel';
import { useServiceProviderLanguages } from '@/hooks/useBusinessLanguages';
import {
  type InboxFilters,
  useInboxFilters
} from '@/hooks/useSearchFilters';

// Define sort options for Inbox
const inboxSortOptions = [
  { label: 'Latest', value: 'latest' },
  { label: 'Price', value: 'price' },
  { label: 'Rating', value: 'rating' },
  { label: 'Distance', value: 'distance' },
];

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

// Component to display provider languages
const ProviderLanguagesDisplay: React.FC<{ providerId: string }> = ({ providerId }) => {
  const { data: languages } = useServiceProviderLanguages(providerId);
  
  if (!languages || languages.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {languages.map(lang => lang.name).join(', ')}
    </div>
  );
};

// Filter component for Inbox
interface InboxFiltersProps {
  filters: InboxFilters;
  onFilterChange: (newFilters: InboxFilters) => void;
  sortOptions: { label: string; value: string }[];
  currentSort: string;
  onSortChange: (sortBy: string) => void;
}

const InboxFiltersComponent: React.FC<InboxFiltersProps> = ({
  filters,
  onFilterChange,
  sortOptions,
  currentSort,
  onSortChange
}) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value);
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-4">
        {/* Implement filter inputs here */}
        {/* Example: */}
        {/* <Input 
          type="text" 
          placeholder="Search..." 
          value={filters.city}
          onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
        /> */}
      </div>
      
      <div>
        <select 
          value={currentSort}
          onChange={handleSortChange}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Enhanced type for conversation with full provider details
interface ConversationWithProvider {
  id: string;
  request_id: string;
  provider_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  service_requests?: {
    id: string;
    title: string;
    category: string;
    subcategory?: string;
    user_id: string;
  };
  service_providers: {
    id: string;
    name: string;
    user_id: string;
    category?: string;
    subcategory?: string[];
    city?: string;
    area?: string;
    contact_phone?: string;
    images?: string[];
    rating?: number;
    review_count?: number;
    overallScore?: number;
    calculatedDistance?: number;
    latest_pricing?: {
      pricing_type?: string;
      quotation_price?: number;
      wholesale_price?: number;
      negotiable_price?: number;
    };
  };
  latest_quotation?: number;
}

export default function Inbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    conversations, 
    isLoadingConversations,
    conversationsError,
    refetchConversations
  } = useConversations();

  // Initialize general presence tracking and get isUserOnline function
  const { isUserOnline } = usePresence('general');

  // Initialize inbox filters using the custom hook
  const { filters: inboxFilters, setters: inboxFilterSetters } = useInboxFilters();

  // Destructure the setters for easier use
  const {
    setMinRating: setInboxMinRating,
    setLanguages: setInboxLanguages,
    setCity: setInboxCity,
    setPostalCode: setInboxPostalCode,
    setPriceType: setInboxPriceType,
    setSortBy: setInboxSortBy
  } = inboxFilterSetters;

  // Function to handle filter changes
  const handleInboxFilterChange = (newFilters: InboxFilters) => {
    setInboxMinRating(newFilters.minRating);
    setInboxLanguages(newFilters.languages);
    setInboxCity(newFilters.city);
    setInboxPostalCode(newFilters.postalCode);
    setInboxPriceType(newFilters.priceType);
    setInboxSortBy(newFilters.sortBy);
  };

  // Function to handle sort change
  const handleInboxSortChange = (sortBy: string) => {
    setInboxSortBy(sortBy as 'price' | 'latest' | 'rating' | 'distance');
  };

  // Updated handleCall function to trigger device call interface
  const handleCall = (e: React.MouseEvent, phone?: string, providerName?: string) => {
    e.stopPropagation();
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

  // Filter conversations based on selected filters
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    return (conversations as ConversationWithProvider[]).filter(conversation => {
      const providerDetails = conversation.service_providers;
      if (!providerDetails) return false;

      // Apply filters
      if (inboxFilters.city && providerDetails.city && !providerDetails.city.toLowerCase().includes(inboxFilters.city.toLowerCase())) {
        return false;
      }

      // Add other filters as needed

      return true;
    }).sort((a, b) => {
      // Sort based on selected sort option
      if (inboxFilters.sortBy === 'latest') {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
      // Add other sorting options as needed

      return 0;
    });
  }, [conversations, inboxFilters]);

  const handleRefresh = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsRefreshing(true);
    try {
      await refetchConversations();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Notification Prompt */}
        <NotificationPrompt className="mb-6" />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              Manage your service requests and provider communications
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests">
            {/* Content for My Requests tab */}
            <div>
              <p>This is where the user's service requests will be displayed.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="messages">
            <div className="space-y-6">
              {/* Search and Filters */}
              <InboxFiltersComponent 
                filters={inboxFilters}
                onFilterChange={handleInboxFilterChange}
                sortOptions={inboxSortOptions}
                currentSort={inboxFilters.sortBy}
                onSortChange={handleInboxSortChange}
              />

              {isLoadingConversations ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : conversationsError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Error Loading Messages</h3>
                  <p className="text-muted-foreground mb-6">
                    There was a problem loading your messages. Please try again.
                  </p>
                  <Button onClick={refetchConversations}>Try Again</Button>
                </div>
              ) : !filteredConversations || filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    Your conversations will appear here once you start messaging.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredConversations.map((conversation) => {
                    const providerDetails = conversation.service_providers;
                    if (!providerDetails) return null;

                    return (
                      <Card key={conversation.id} className="flex flex-col h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="line-clamp-2">{providerDetails.name}</span>
                              <OnlineIndicator 
                                isOnline={isUserOnline(providerDetails.user_id)} 
                                size="sm" 
                                className="self-start"
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {providerDetails.overallScore && (
                                <div 
                                  className="flex items-center justify-center font-bold text-sm"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    color: getRatingColor(providerDetails.overallScore),
                                    borderColor: getRatingColor(providerDetails.overallScore),
                                    borderWidth: 2,
                                    borderStyle: 'solid',
                                    background: '#fff',
                                    boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
                                  }}
                                  title={`Overall rating: ${providerDetails.overallScore}`}
                                >
                                  {providerDetails.overallScore}
                                </div>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="flex-1 space-y-4">
                          {/* Shop Images Carousel */}
                          <ProviderImageCarousel 
                            images={providerDetails.images || []}
                            providerName={providerDetails.name}
                            className="mb-3"
                          />
                          
                          {/* Category and Subcategory */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">{providerDetails.category}</Badge>
                            {providerDetails.subcategory && providerDetails.subcategory.length > 0 && (
                              <Badge variant="outline">{providerDetails.subcategory[0]}</Badge>
                            )}
                          </div>
                          
                          {/* Distance from user */}
                          {providerDetails.calculatedDistance !== null && providerDetails.calculatedDistance !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-primary py-2">
                              <Navigation className="h-4 w-4" />
                              <span className="font-medium">
                                {providerDetails.calculatedDistance.toFixed(1)} km away
                              </span>
                            </div>
                          )}
                          
                          {/* Five Star Rating with Review Count + Call Button */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={cn(
                                      "h-4 w-4",
                                      star <= Math.round(providerDetails.rating || 4.5) 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : "text-gray-300"
                                    )} 
                                  />
                                ))}
                              </div>
                              <span className="text-muted-foreground">
                                ({providerDetails.review_count || 0})
                              </span>
                            </div>
                            
                            {/* Call Button */}
                            {providerDetails.contact_phone && (
                              <button
                                onClick={(e) => handleCall(e, providerDetails.contact_phone, providerDetails.name)}
                                title="Call Business"
                                aria-label="Call business"
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-all rounded shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[2px] bg-blue-600 hover:bg-blue-500"
                              >
                                <Phone className="h-4 w-4" />
                                Call
                              </button>
                            )}
                          </div>

                          {/* Pricing Display with Type Badge */}
                          {providerDetails.latest_pricing && getPricingDisplay(providerDetails.latest_pricing)}
                          
                          {/* Languages Spoken */}
                          <ProviderLanguagesDisplay providerId={providerDetails.id} />
                          
                          {/* Conversation Details */}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Badge variant="outline" className="truncate max-w-[200px]">
                                {conversation.service_requests?.title || "Request"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="truncate">
                                {conversation.service_requests?.category || ""}
                                {conversation.service_requests?.subcategory && 
                                  ` / ${conversation.service_requests.subcategory}`}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="whitespace-nowrap">
                                {formatDistanceToNow(parseISO(conversation.last_message_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex gap-2 pt-3 mt-auto">
                          <Button
                            onClick={() => navigate(`/messages/${conversation.id}`)}
                            className="flex-1"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Chat
                          </Button>
                          
                          <Button
                            onClick={() => navigate(`/business/${providerDetails.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            View Profile
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

