
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/hooks/useBusinesses';
import { useState } from 'react';

export interface BusinessReview {
  id: string;
  name: string;
  date: string;
  rating: number;
  text?: string;
  isMustVisit?: boolean;
  isHiddenGem?: boolean;
  userId?: string | null;
  criteriaRatings?: Record<string, number>;
}

export interface BusinessNote {
  id: string;
  title: string;
  content: {
    text: string;
    videoUrl?: string;
  };
  user_id: string;
  user_avatar_url: string | null;
  user_display_name: string;
  created_at: string;
  thumbs_up: number;
  thumbs_up_users: string[];
}

export const useBusinessDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['business', id],
    queryFn: async (): Promise<Business | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .eq('approval_status', 'approved')
        .single();
      
      if (error) {
        console.error('Error fetching business:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!id
  });
};

export const useBusinessReviews = (businessId: string | undefined) => {
  // Start with empty reviews array instead of dummy data
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  
  // Function to add a review
  const addReview = (review: Omit<BusinessReview, 'id' | 'date' | 'name'> & { name: string }) => {
    const newReview = {
      ...review,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    setReviews([newReview, ...reviews]);
    return Promise.resolve();
  };
  
  return {
    reviews,
    addReview
  };
};

export const useBusinessNotes = (businessId: string | undefined) => {
  // Start with empty notes array instead of dummy data
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  
  // Function to add a note
  const addNote = (note: { title: string; content: { text: string; videoUrl?: string } }) => {
    const newNote = {
      id: Date.now().toString(),
      ...note,
      user_id: 'current-user',
      user_avatar_url: null,
      user_display_name: 'Current User',
      created_at: new Date().toISOString(),
      thumbs_up: 0,
      thumbs_up_users: []
    };
    
    setNotes([newNote, ...notes]);
    return Promise.resolve();
  };
  
  return {
    notes,
    addNote
  };
};
