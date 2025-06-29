
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/serviceRequestTypes';

interface SavedQuotation {
  id: string;
  user_id: string;
  message_id: string;
  conversation_id: string;
  provider_id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
}

interface SavedQuotationWithMessage extends SavedQuotation {
  message: Message;
  provider_name: string;
  request_title: string;
}

export const useSavedQuotations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved quotations
  const { data: savedQuotations, isLoading } = useQuery({
    queryKey: ['savedQuotations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('saved_quotations')
        .select(`
          *,
          messages!inner(
            id,
            content,
            quotation_price,
            pricing_type,
            wholesale_price,
            negotiable_price,
            delivery_available,
            quotation_images,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved quotations:', error);
        throw error;
      }

      // Enhance with provider and request details
      const enhancedData = await Promise.all(
        (data || []).map(async (item) => {
          // Get provider name
          const { data: provider } = await supabase
            .from('service_providers')
            .select('name')
            .eq('id', item.provider_id)
            .single();

          // Get request title
          const { data: request } = await supabase
            .from('service_requests')
            .select('title')
            .eq('id', item.request_id)
            .single();

          return {
            ...item,
            message: (item as any).messages,
            provider_name: provider?.name || 'Unknown Provider',
            request_title: request?.title || 'Unknown Request'
          };
        })
      );

      return enhancedData as SavedQuotationWithMessage[];
    },
    enabled: !!user?.id,
  });

  // Save quotation mutation
  const saveQuotationMutation = useMutation({
    mutationFn: async ({
      messageId,
      conversationId,
      providerId,
      requestId
    }: {
      messageId: string;
      conversationId: string;
      providerId: string;
      requestId: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_quotations')
        .insert({
          user_id: user.id,
          message_id: messageId,
          conversation_id: conversationId,
          provider_id: providerId,
          request_id: requestId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedQuotations'] });
      toast({
        title: "Quotation saved",
        description: "The quotation has been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving quotation:', error);
      if (error?.code === '23505') {
        toast({
          title: "Already saved",
          description: "This quotation is already in your saved list.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error saving quotation",
          description: "Failed to save the quotation. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Remove saved quotation mutation
  const removeSavedQuotationMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_quotations')
        .delete()
        .eq('user_id', user.id)
        .eq('message_id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedQuotations'] });
      toast({
        title: "Quotation removed",
        description: "The quotation has been removed from your saved list.",
      });
    },
    onError: (error) => {
      console.error('Error removing saved quotation:', error);
      toast({
        title: "Error removing quotation",
        description: "Failed to remove the quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if a quotation is saved
  const isQuotationSaved = (messageId: string) => {
    return savedQuotations?.some(sq => sq.message_id === messageId) || false;
  };

  return {
    savedQuotations: savedQuotations || [],
    isLoading,
    saveQuotation: saveQuotationMutation.mutate,
    removeSavedQuotation: removeSavedQuotationMutation.mutate,
    isQuotationSaved,
    isSaving: saveQuotationMutation.isPending,
    isRemoving: removeSavedQuotationMutation.isPending,
  };
};
