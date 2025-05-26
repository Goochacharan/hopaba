
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, IndianRupee, MapPin, MessageSquare } from 'lucide-react';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { EnhancedQuotationDialog } from './EnhancedQuotationDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RequestDetailsDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
}

export function RequestDetailsDialog({ request, open, onOpenChange, providerId }: RequestDetailsDialogProps) {
  const { user } = useAuth();
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  
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
  
  if (!open || !request) return null;

  const handleContactRequester = () => {
    if (!user || !request) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to contact a requester.",
        variant: "destructive"
      });
      return;
    }
    
    // Open the quotation dialog
    setIsQuotationDialogOpen(true);
  };
  
  // Format date range if available
  const formatDateRange = () => {
    if (!request) return 'Not specified';
    
    if (request.date_range_start && request.date_range_end) {
      return `${format(parseISO(request.date_range_start), 'dd MMM yyyy')} - ${format(parseISO(request.date_range_end), 'dd MMM yyyy')}`;
    } else if (request.date_range_start) {
      return format(parseISO(request.date_range_start), 'dd MMM yyyy');
    } else {
      return 'Not specified';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {request.title}
              <Badge variant={request.status === 'open' ? 'default' : 'outline'}>
                {request.status === 'open' ? 'Open' : 'Closed'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Posted on {format(parseISO(request.created_at), 'PPP')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-1">Category</h3>
                    <p className="text-sm">
                      {request.category}
                      {request.subcategory && <span className="text-muted-foreground"> / {request.subcategory}</span>}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Budget</h3>
                    <p className="text-sm flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {request.budget ? `₹${request.budget}` : 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Date Range</h3>
                    <p className="text-sm flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDateRange()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.area}, {request.city}, {request.postal_code}
                    </p>
                  </div>
                </div>
                
                {request.images && request.images.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Images</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {request.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image}
                          alt={`Request image ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleContactRequester}
                disabled={request.status !== 'open'}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Quotation Dialog */}
      <EnhancedQuotationDialog 
        request={request}
        open={isQuotationDialogOpen}
        onOpenChange={setIsQuotationDialogOpen}
        providerId={providerId}
        businessName={businessData?.name}
      />
    </>
  );
}
