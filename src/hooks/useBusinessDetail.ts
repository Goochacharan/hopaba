
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/hooks/useBusinesses';
import { useState, useEffect } from 'react';

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
      
      return data as Business;
    },
    enabled: !!id
  });
};

export const useBusinessReviews = (businessId: string | undefined) => {
  // Load reviews from localStorage when the hook is initialized
  const [reviews, setReviews] = useState<BusinessReview[]>(() => {
    if (!businessId) return [];
    
    try {
      const savedReviews = localStorage.getItem(`reviews_${businessId}`);
      return savedReviews ? JSON.parse(savedReviews) : [];
    } catch (error) {
      console.error('Error loading reviews from localStorage:', error);
      return [];
    }
  });
  
  // Save reviews to localStorage whenever they change
  useEffect(() => {
    if (businessId && reviews.length > 0) {
      localStorage.setItem(`reviews_${businessId}`, JSON.stringify(reviews));
    }
  }, [businessId, reviews]);
  
  // Function to add a review
  const addReview = (review: Omit<BusinessReview, 'id' | 'date' | 'name'> & { name: string }) => {
    const newReview = {
      ...review,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    
    // Save to localStorage immediately
    if (businessId) {
      localStorage.setItem(`reviews_${businessId}`, JSON.stringify(updatedReviews));
    }
    
    return Promise.resolve();
  };
  
  return {
    reviews,
    addReview
  };
};

export const useBusinessNotes = (businessId: string | undefined) => {
  // Load notes from localStorage when the hook is initialized
  const [notes, setNotes] = useState<BusinessNote[]>(() => {
    if (!businessId) return [];
    
    try {
      const savedNotes = localStorage.getItem(`notes_${businessId}`);
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch (error) {
      console.error('Error loading notes from localStorage:', error);
      return [];
    }
  });
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (businessId && notes.length > 0) {
      localStorage.setItem(`notes_${businessId}`, JSON.stringify(notes));
    }
  }, [businessId, notes]);
  
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
    
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    
    // Save to localStorage immediately
    if (businessId) {
      localStorage.setItem(`notes_${businessId}`, JSON.stringify(updatedNotes));
    }
    
    return Promise.resolve();
  };
  
  return {
    notes,
    addNote
  };
};
