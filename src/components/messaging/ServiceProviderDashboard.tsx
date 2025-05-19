import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Loader2, ArrowUpDown, Search, MessageSquare } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';

// Update the interface for service requests with conversations
interface ServiceRequestWithConversation extends ServiceRequest {
  conversation_id?: string;
}

// For the requests that come with conversations
interface ServiceRequestWithConversations {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budget?: number;
  date_range_start?: string;
  date_range_end?: string;
  city: string;
  area: string;
  postal_code: string;
  contact_phone: string;
  images: string[];
  created_at: string;
  status: string;
  conversation_id: string;
}

// Add props interface for the component
interface ServiceProviderDashboardProps {
  providerId?: string;
  category?: string;
  subcategory?: string;
}

// Get service requests that match a provider's category and subcategory
// FIXED: Removed inner join with conversations to show all matching requests, not just those with conversations
const getMatchingRequests = async (providerId: string) => {
  // First get the provider's details to know their category and subcategory
  const { data: provider, error: providerError } = await supabase
    .from('service_providers')
    .select('category, subcategory')
    .eq('id', providerId)
    .single();
    
  if (providerError) throw providerError;
  
  // Then find all matching open requests without requiring conversations
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('category', provider.category)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Filter by subcategory if the provider has one
  const filteredRequests = provider.subcategory 
    ? data.filter(req => req.subcategory === provider.subcategory || !req.subcategory)
    : data;
    
  return filteredRequests as ServiceRequestWithConversation[];
};

// Get service requests that a provider has already responded to
const getRespondedRequests = async (providerId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      service_requests(*)
    `)
    .eq('provider_id', providerId);
    
  if (error) throw error;
  
  // Extract the actual request data and add the conversation ID
  return data.map(item => ({
    ...item.service_requests,
    conversation_id: item.id
  })) as ServiceRequestWithConversation[];
};

// Update the component declaration with props
const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({ providerId, category, subcategory }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'responded'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  
  // Get the provider ID for the current user if not provided as prop
  const { data: providerData, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['provider', user?.id, providerId],
    queryFn: async () => {
      // If providerId is passed as a prop, use it directly
      if (providerId) {
        return { id: providerId };
      }
      
      // Otherwise, fetch the provider ID for the current user
      const { data, error } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user || !!providerId
  });
  
  // Get matching requests based on provider's category
  const { data: matchingRequests, isLoading: isLoadingMatching } = useQuery({
    queryKey: ['matching-requests', providerData?.id],
    queryFn: () => getMatchingRequests(providerData!.id),
    enabled: !!providerData?.id
  });
  
  // Get requests the provider has already responded to
  const { data: respondedRequests, isLoading: isLoadingResponded } = useQuery({
    queryKey: ['responded-requests', providerData?.id],
    queryFn: () => getRespondedRequests(providerData!.id),
    enabled: !!providerData?.id
  });
  
  // Process and filter the requests based on current filter and search
  const getFilteredRequests = () => {
    if (!matchingRequests || !respondedRequests) return [] as ServiceRequestWithConversation[];
    
    // Get the responded request IDs for easy lookup
    const respondedIds = new Set(respondedRequests.map(r => r.id));
    
    let filteredRequests: ServiceRequestWithConversation[] = [];
    
    if (filter === 'all' || filter === 'new') {
      // For 'all' or 'new', include matching requests that haven't been responded to
      const newRequests = matchingRequests
        .filter(req => filter === 'all' || !respondedIds.has(req.id))
        .map(req => ({ ...req }));
      
      filteredRequests = [...filteredRequests, ...newRequests];
    }
    
    if (filter === 'all' || filter === 'responded') {
      // For 'all' or 'responded', include requests that have been responded to
      filteredRequests = [...filteredRequests, ...respondedRequests];
    }
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(req => 
        req.title.toLowerCase().includes(term) || 
        req.description.toLowerCase().includes(term) ||
        req.area.toLowerCase().includes(term) ||
        req.city.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    return filteredRequests.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };
  
  // Check if a request has been responded to
  const hasResponded = (requestId: string) => {
    if (!respondedRequests) return false;
    return respondedRequests.some(r => r.id === requestId);
  };
  
  // Get the conversation ID for a request that has been responded to
  const getConversationId = (requestId: string) => {
    if (!respondedRequests) return undefined;
    const request = respondedRequests.find(r => r.id === requestId);
    return request?.conversation_id;
  };
  
  // Create a new conversation for a request
  const handleCreateConversation = async (request: ServiceRequestWithConversation) => {
    if (!providerData || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          request_id: request.id,
          provider_id: providerData.id,
          user_id: request.user_id,
        })
        .select();
      
      if (error) throw error;
      
      // Navigate to the new conversation
      navigate(`/messages/${data[0].id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  const isLoading = isLoadingProvider || isLoadingMatching || isLoadingResponded;
  const filteredRequests = getFilteredRequests();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!providerData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Provider Profile Not Found</h3>
        <p className="text-muted-foreground mb-6">
          You need to create a service provider profile to view matching requests.
        </p>
        <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Service Requests Dashboard</h2>
        <p className="text-muted-foreground">Find and respond to service requests matching your expertise</p>
      </div>
      
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(val) => setFilter(val as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="new">New Requests</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sort === 'newest' ? 'Newest' : 'Oldest'}
          </Button>
        </div>
      </div>
      
      {/* Requests list */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const responded = hasResponded(request.id);
            const conversationId = getConversationId(request.id);
            
            return (
              <Card key={request.id} className="overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{request.title}</h3>
                        {responded ? (
                          <Badge variant="success">Responded</Badge>
                        ) : (
                          <Badge>New Request</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.category}
                        {request.subcategory && ` / ${request.subcategory}`}
                        {request.budget && ` • Budget: ₹${request.budget}`}
                      </p>
                      <p className="text-sm mb-3">{request.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {request.date_range_start ? (
                              <>
                                {format(parseISO(request.date_range_start), 'dd MMM yyyy')}
                                {request.date_range_end && (
                                  <> - {format(parseISO(request.date_range_end), 'dd MMM yyyy')}</>
                                )}
                              </>
                            ) : (
                              'No date specified'
                            )}
                          </span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span>Location: {request.area}, {request.city}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Posted {formatDistanceToNow(parseISO(request.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="p-4 bg-accent/5 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    View Full Request
                  </Button>
                  
                  {responded && conversationId ? (
                    <Button onClick={() => navigate(`/messages/${conversationId}`)} className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Continue Conversation
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCreateConversation(request)}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Respond with Quote
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-accent/5 rounded-lg">
          <h3 className="text-lg font-medium mb-1">No matching requests found</h3>
          <p className="text-muted-foreground">
            {filter === 'new' ? 
              "There are no new service requests matching your category" : 
              filter === 'responded' ? 
              "You haven't responded to any service requests yet" : 
              "No service requests match your search criteria"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderDashboard;
