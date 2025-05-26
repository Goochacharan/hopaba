import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';
import { manualCascadeDelete } from '@/utils/serviceRequestUtils';

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
  const createRequest = async (request: Omit<ServiceRequest, 'id' | 'user_id' | 'created_at' | 'status' | 'contact_phone'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        ...request,
        user_id: user.id,
        contact_phone: '', // Provide default empty value for contact_phone
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

  // Delete a service request using the new database function and with fallback mechanisms
  const deleteRequest = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log(`Starting deletion process for request ${id}`);
      
      // 1. First approach: Use the database function for atomic deletion
      const { data: fnResult, error: fnError } = await supabase.rpc(
        'delete_service_request_cascade', 
        { 
          request_id_param: id, 
          user_id_param: user.id 
        }
      );
      
      if (fnError) {
        console.error('Database function error:', fnError);
        
        // 2. If function fails, verify the request exists and belongs to the user
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
        
        // 3. Try manual cascade deletion as a fallback
        console.log('Attempting manual cascade deletion as fallback');
        const success = await manualCascadeDelete(id, user.id);
        
        if (!success) {
          throw new Error('Manual cascade deletion failed');
        }
      }
      
      console.log(`Deletion completed successfully for request ${id}`);
      return id;
      
    } catch (error: any) {
      console.error('Error in delete operation:', error);
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
