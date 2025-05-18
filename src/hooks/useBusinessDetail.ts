
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
  // Mock reviews for now - in a real app, we would fetch from Supabase
  const [reviews, setReviews] = useState<BusinessReview[]>([
    {
      id: '1',
      name: 'John Doe',
      date: '2023-05-15',
      rating: 4,
      text: 'Excellent service, very professional and friendly.',
      isMustVisit: true
    },
    {
      id: '2',
      name: 'Jane Smith',
      date: '2023-04-22',
      rating: 5,
      text: 'The best in the area! Highly recommend their services.',
      isHiddenGem: true,
      criteriaRatings: {
        'quality': 9,
        'price': 7,
        'service': 10
      }
    }
  ]);
  
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
  // Mock notes for now - in a real app, we would fetch from Supabase
  const [notes, setNotes] = useState<BusinessNote[]>([
    {
      id: '1',
      title: 'Great Experience',
      content: {
        text: 'I had a wonderful experience with this business. The staff was very helpful and knowledgeable.'
      },
      user_id: 'user1',
      user_avatar_url: null,
      user_display_name: 'Business Expert',
      created_at: '2023-05-10T10:30:00Z',
      thumbs_up: 5,
      thumbs_up_users: ['user2', 'user3']
    }
  ]);
  
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
