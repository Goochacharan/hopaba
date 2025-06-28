import React, { useState } from 'react';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Trash2, ListCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchingProvidersDialog } from './MatchingProvidersDialog';

const UserRequestsList: React.FC = () => {
  const { userRequests, isLoadingUserRequests, deleteRequest, isDeleting, refetchUserRequests } = useServiceRequests();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  const handleDeleteClick = (requestId: string) => {
    setRequestToDelete(requestId);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (requestToDelete) {
      deleteRequest(requestToDelete);
      setDeleteDialogOpen(false);
    }
  };

  const handleViewProviders = (requestId: string) => {
    setSelectedRequestId(requestId);
  };

  const openRequests = userRequests?.filter(req => req.status === 'open') || [];
  const closedRequests = userRequests?.filter(req => req.status === 'closed') || [];

  const renderRequestCard = (request: ServiceRequest) => {
    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium">{request.title}</CardTitle>
            <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Posted on {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <p className="text-sm line-clamp-2 mb-2">{request.description}</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <div><span className="font-medium">Category:</span> {request.category}</div>
            {request.subcategory && (
              <div><span className="font-medium">Subcategory:</span> {request.subcategory}</div>
            )}
            <div><span className="font-medium">Location:</span> {request.area}, {request.city}</div>
            {request.budget && (
              <div><span className="font-medium">Budget:</span> ₹{request.budget}</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between">
          {request.status === 'open' && (
            <MatchingProvidersDialog
              requestId={request.id}
              trigger={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <Users className="h-4 w-4 mr-1" /> View Providers
                </Button>
              }
            />
          )}
          <div className="ml-auto">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => handleDeleteClick(request.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-4">
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
      ))}
    </>
  );

  if (isLoadingUserRequests) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Your Service Requests</h2>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (!userRequests?.length) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="text-center py-8 border rounded-md">
          <ListCheck className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <h3 className="text-lg font-medium">No service requests yet</h3>
          <p className="text-muted-foreground">Your service requests will appear here once you create them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Your Service Requests</h2>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({userRequests.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openRequests.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedRequests.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {userRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(renderRequestCard)}
        </TabsContent>
        
        <TabsContent value="open" className="mt-0">
          {openRequests.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No open requests</p>
          ) : (
            openRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(renderRequestCard)
          )}
        </TabsContent>
        
        <TabsContent value="closed" className="mt-0">
          {closedRequests.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No closed requests</p>
          ) : (
            closedRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(renderRequestCard)
          )}
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserRequestsList;
