import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, PlusCircle, Calendar, DollarSign, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useConversations } from '@/hooks/useConversations';
import { ServiceRequest } from '@/types/serviceRequestTypes';

const RequestCard: React.FC<{ 
  request: ServiceRequest;
  conversationCount: number;
  onViewDetails: () => void;
}> = ({ request, conversationCount, onViewDetails }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{request.title}</CardTitle>
          <Badge variant={request.status === 'open' ? 'default' : 'outline'}>
            {request.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-4 w-4" /> 
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
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Category:</span>{' '}
            <span className="text-sm">{request.category}</span>
            {request.subcategory && (
              <span className="text-sm text-muted-foreground"> / {request.subcategory}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">
              {request.budget ? `₹${request.budget}` : 'Budget not specified'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{request.area}, {request.city}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end">
        <div className="flex items-center gap-2">
          {conversationCount > 0 && (
            <Badge variant="secondary">{conversationCount} {conversationCount === 1 ? 'response' : 'responses'}</Badge>
          )}
          <Button size="sm" onClick={onViewDetails}>View Details</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const { 
    userRequests, 
    isLoadingUserRequests,
    userRequestsError 
  } = useServiceRequests();
  
  const {
    conversations,
    isLoadingConversations
  } = useConversations();
  
  const getConversationCountForRequest = (requestId: string) => {
    if (!conversations) return 0;
    return conversations.filter(conv => conv.request_id === requestId).length;
  };
  
  const filteredRequests = React.useMemo(() => {
    if (!userRequests) return [];
    
    if (activeTab === 'open') {
      return userRequests.filter(request => request.status === 'open');
    } else if (activeTab === 'closed') {
      return userRequests.filter(request => request.status === 'closed');
    }
    
    return userRequests;
  }, [userRequests, activeTab]);
  
  const isLoading = isLoadingUserRequests || isLoadingConversations;
  
  const handleNewRequest = () => {
    navigate('/post-request');
  };
  
  const handleViewDetails = (requestId: string) => {
    navigate(`/request/${requestId}`);
  };
  
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Service Requests</h1>
            <p className="text-muted-foreground">
              Manage your service requests and view responses from providers
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={handleNewRequest}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userRequestsError ? (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading requests. Please try again later.</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all' ? 
                    "You haven't created any service requests yet." : 
                    `You don't have any ${activeTab} requests.`}
                </p>
                <Button onClick={handleNewRequest}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create a Request
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequests.map(request => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    conversationCount={getConversationCountForRequest(request.id)}
                    onViewDetails={() => handleViewDetails(request.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Requests;
