
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';

export const useServiceRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's service requests
  const getUserRequests = async () => {
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceRequest[];
  };

  // Create a new service request
  const createRequest = async (request: Omit<ServiceRequest, 'id' | 'user_id' | 'created_at' | 'status'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        ...request,
        user_id: user.id,
      })
      .select();

    if (error) throw error;
    return data[0] as ServiceRequest;
  };

  // Update an existing service request
  const updateRequest = async ({ id, ...request }: Partial<ServiceRequest> & { id: string }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('service_requests')
      .update(request)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    return data[0] as ServiceRequest;
  };

  // Delete a service request using Supabase transaction and better error handling
  const deleteRequest = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Verify the request exists and belongs to the user before attempting deletion
      const { data: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (requestError || !requestData) {
        console.error('Request verification failed:', requestError);
        throw new Error(`Could not verify request ownership: ${requestError?.message || 'Request not found'}`);
      }
      
      // Step 1: Find all conversations associated with this service request
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', id);
      
      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw new Error(`Failed to fetch conversations: ${conversationsError.message}`);
      }
      
      // If there are conversations, delete them with verification
      if (conversations && conversations.length > 0) {
        console.log(`Found ${conversations.length} conversations to delete for request ${id}`);
        
        // Use a transaction for deleting all related data to ensure atomicity
        const { error: txError } = await supabase.rpc('delete_service_request_cascade', {
          request_id_param: id, 
          user_id_param: user.id
        });
        
        if (txError) {
          console.error('Transaction failed:', txError);
          throw new Error(`Transaction failed: ${txError.message}`);
        }
        
        // Verify conversations were actually deleted
        for (const conversation of conversations) {
          const { data: checkData, error: checkError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversation.id)
            .single();
            
          if (checkData) {
            console.error(`Conversation ${conversation.id} still exists after deletion attempt`);
            throw new Error(`Failed to delete conversation: ${conversation.id}`);
          }
        }
        
        return id;
      } else {
        // If there are no conversations, just delete the service request directly
        const { error } = await supabase
          .from('service_requests')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting service request:', error);
          throw error;
        }
        
        return id;
      }
    } catch (error: any) {
      console.error('Error in cascade delete operation:', error);
      // Enhanced error message with more details
      throw new Error(`Failed to delete request: ${error.message || 'Unknown error'}`);
    }
  };

  // Get requests for a specific category and subcategory (for providers)
  const getRequestsByCategoryAndSubcategory = async (category: string, subcategory?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    let query = supabase
      .from('service_requests')
      .select('*')
      .eq('category', category)
      .eq('status', 'open');
    
    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceRequest[];
  };

  // Get a single service request by id
  const getRequestById = async (id: string) => {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ServiceRequest;
  };

  // Use queries and mutations
  const {
    data: userRequests,
    isLoading: isLoadingUserRequests,
    error: userRequestsError,
    refetch: refetchUserRequests
  } = useQuery({
    queryKey: ['serviceRequests', user?.id],
    queryFn: getUserRequests,
    enabled: !!user
  });

  const createRequestMutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      // Invalidate user's service requests
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      
      // Also invalidate matching requests for service providers
      // This ensures that when a new request is created, service providers see it
      queryClient.invalidateQueries({ queryKey: ['matching-requests'] });
      
      toast({
        title: 'Request Created',
        description: 'Your service request has been created successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create request: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: updateRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      // Also invalidate matching requests for service providers
      queryClient.invalidateQueries({ queryKey: ['matching-requests'] });
      
      toast({
        title: 'Request Updated',
        description: 'Your service request has been updated successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update request: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
      // Also invalidate matching requests as the deleted request should no longer appear
      queryClient.invalidateQueries({ queryKey: ['matching-requests'] });
      // Also invalidate conversations as they're deleted with the request
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      toast({
        title: 'Request Deleted',
        description: 'Your service request has been deleted successfully!',
      });
    },
    onError: (error) => {
      // More detailed error toast
      toast({
        title: 'Error Deleting Request',
        description: `${error.message}`,
        variant: 'destructive',
      });
      console.error('Delete request error details:', error);
    }
  });

  return {
    userRequests,
    isLoadingUserRequests,
    userRequestsError,
    refetchUserRequests,
    createRequest: createRequestMutation.mutate,
    updateRequest: updateRequestMutation.mutate,
    deleteRequest: deleteRequestMutation.mutate,
    isCreating: createRequestMutation.isPending,
    isUpdating: updateRequestMutation.isPending,
    isDeleting: deleteRequestMutation.isPending,
    getRequestById,
    getRequestsByCategoryAndSubcategory
  };
};
