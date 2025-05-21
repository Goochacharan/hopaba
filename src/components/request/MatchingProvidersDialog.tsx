
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, MessageSquare, MapPin, Building } from 'lucide-react';
import { ServiceProvider } from '@/types/serviceRequestTypes';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface MatchingProvidersDialogProps {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MatchingProviderResult {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  provider_subcategory: string;
  user_id: string;
}

export function MatchingProvidersDialog({ requestId, open, onOpenChange }: MatchingProvidersDialogProps) {
  const { user } = useAuth();
  const { conversations, createConversation, isCreatingConversation } = useConversations();
  const [contactedProviders, setContactedProviders] = useState<Set<string>>(new Set());

  // Function to check if the provider already has a conversation for this request
  const hasExistingConversation = (providerId: string) => {
    if (!conversations) return false;
    return conversations.some(c => c.request_id === requestId && c.provider_id === providerId);
  };

  // Fetch matching providers using the database function
  const { data: matchingProviders, isLoading, error, refetch } = useQuery({
    queryKey: ['matchingProviders', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .rpc('get_matching_providers_for_request', { request_id: requestId });
        
      if (error) {
        console.error("Error fetching matching providers:", error);
        throw error;
      }
      
      console.log("Matching providers found:", data);
      return data as MatchingProviderResult[];
    },
    enabled: !!requestId && open,
    staleTime: 60000, // 1 minute cache
  });

  const handleContactProvider = (provider: MatchingProviderResult) => {
    if (!user || !requestId) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to contact a service provider.",
        variant: "destructive"
      });
      return;
    }
    
    // Call the createConversation function
    createConversation(requestId, provider.provider_id, user.id);
    
    // Add to local state to show as contacted
    setContactedProviders(prev => new Set([...prev, provider.provider_id]));
    
    toast({
      title: "Provider contacted",
      description: `You've initiated a conversation with ${provider.provider_name}.`,
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Matching Service Providers</DialogTitle>
          <DialogDescription>
            These providers match your service request category and can help you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-4 flex flex-col items-center gap-2">
              <p>Error loading matching providers.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : !matchingProviders || matchingProviders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No matching service providers found for your request.
            </div>
          ) : (
            matchingProviders.map((provider) => {
              const isContacted = hasExistingConversation(provider.provider_id) || 
                                  contactedProviders.has(provider.provider_id);
                                  
              return (
                <Card key={provider.provider_id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      {provider.provider_name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary">{provider.provider_category}</Badge>
                      {provider.provider_subcategory && (
                        <Badge variant="outline">{provider.provider_subcategory}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 text-sm text-muted-foreground">
                    <p>This service provider specializes in {provider.provider_category.toLowerCase()}
                    {provider.provider_subcategory ? ` with focus on ${provider.provider_subcategory.toLowerCase()}` : ''}.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-2 gap-2">
                    <Button
                      size="sm"
                      variant={isContacted ? "outline" : "default"}
                      onClick={() => handleContactProvider(provider)}
                      disabled={isCreatingConversation || isContacted}
                      className="flex items-center gap-1"
                    >
                      {isCreatingConversation && contactedProviders.has(provider.provider_id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {isContacted ? "Contacted" : "Contact Provider"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
