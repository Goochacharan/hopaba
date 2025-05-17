
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ClipboardCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { usePendingListings } from '@/hooks/usePendingListings';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export const AdminSection = () => {
  const { pendingListings, loading, error, refetch } = usePendingListings();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Function to handle manual refresh with error handling
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    } catch (err) {
      console.error("Failed to refresh pending listings:", err);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh pending listings. Please try again.",
        variant: "destructive"
      });
      setIsRefreshing(false);
    }
  };
  
  // Calculate total pendingListings safely
  const getTotalPending = () => {
    if (loading || !pendingListings) return 0;
    
    // Safely access properties with fallbacks
    const marketplace = pendingListings.marketplace?.length || 0;
    const services = pendingListings.services?.length || 0;
    const events = pendingListings.events?.length || 0;
    
    return marketplace + services + events;
  };
  
  const totalPending = getTotalPending();

  if (error) {
    return (
      <Card className="border-destructive/50 mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            Admin Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
            Admin Portal
          </CardTitle>
          {!loading && totalPending > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalPending} Pending
            </Badge>
          )}
        </div>
        <CardDescription>
          Manage content approvals across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-background rounded-md p-3 border">
              <div className="font-medium mb-1">Marketplace</div>
              <div className="text-xl font-bold text-primary">
                {pendingListings.marketplace?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">pending approval</div>
            </div>
            <div className="bg-background rounded-md p-3 border">
              <div className="font-medium mb-1">Services</div>
              <div className="text-xl font-bold text-primary">
                {pendingListings.services?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">pending approval</div>
            </div>
            <div className="bg-background rounded-md p-3 border">
              <div className="font-medium mb-1">Events</div>
              <div className="text-xl font-bold text-primary">
                {pendingListings.events?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">pending approval</div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to="/admin">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Manage Content Approvals
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminSection;
