
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Recommendation } from '@/lib/mockData';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { Event } from '@/hooks/types/recommendationTypes';
import { Business } from '@/hooks/useBusinesses';
import { useToast } from '@/hooks/use-toast';

export type WishlistItem = 
  | (Recommendation & { type: 'location' })
  | (MarketplaceListing & { type: 'marketplace' })
  | (Event & { type: 'event' })
  | (Business & { type: 'business' });

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (itemId: string, itemType: 'location' | 'marketplace' | 'event' | 'business') => void;
  isInWishlist: (itemId: string, itemType?: 'location' | 'marketplace' | 'event' | 'business') => boolean;
  toggleWishlist: (item: WishlistItem) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const { toast } = useToast();

  // Load wishlist from localStorage on component mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        console.log('Loaded wishlist:', parsedWishlist);
        setWishlist(parsedWishlist);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      // Reset wishlist on parse error
      localStorage.removeItem('wishlist');
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      console.log('Saved wishlist:', wishlist);
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }, [wishlist]);

  const addToWishlist = (item: WishlistItem) => {
    try {
      console.log('Adding to wishlist:', item);
      setWishlist(prev => {
        // Check if item already exists in wishlist
        const exists = prev.some(i => i.id === item.id && i.type === item.type);
        if (exists) {
          console.log('Item already in wishlist');
          return prev;
        }

        // Show toast notification
        toast({
          title: "Added to wishlist",
          description: getItemTitle(item) + " has been added to your wishlist.",
          duration: 3000,
        });

        // Add item to wishlist
        return [...prev, item];
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to add item to wishlist.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const removeFromWishlist = (itemId: string, itemType: 'location' | 'marketplace' | 'event' | 'business') => {
    try {
      console.log('Removing from wishlist:', itemId, itemType);
      setWishlist(prev => {
        const filteredList = prev.filter(item => !(item.id === itemId && item.type === itemType));
        
        // Show toast notification if an item was removed
        if (filteredList.length < prev.length) {
          const removedItem = prev.find(item => item.id === itemId && item.type === itemType);
          if (removedItem) {
            toast({
              title: "Removed from wishlist",
              description: getItemTitle(removedItem) + " has been removed from your wishlist.",
              duration: 3000,
            });
          }
        }
        
        return filteredList;
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const toggleWishlist = (item: WishlistItem) => {
    try {
      console.log('Toggling wishlist for:', item);
      const itemExists = isInWishlist(item.id, item.type);
      if (itemExists) {
        removeFromWishlist(item.id, item.type);
      } else {
        addToWishlist(item);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const isInWishlist = (itemId: string, itemType?: 'location' | 'marketplace' | 'event' | 'business') => {
    try {
      if (itemType) {
        return wishlist.some(item => item.id === itemId && item.type === itemType);
      }
      return wishlist.some(item => item.id === itemId);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      return false;
    }
  };

  // Helper function to get the title/name from different item types
  const getItemTitle = (item: WishlistItem): string => {
    try {
      if (item.type === 'location') {
        return (item as Recommendation & { type: 'location' }).name;
      } else if (item.type === 'business') {
        return (item as Business & { type: 'business' }).name;
      } else {
        return (item as (MarketplaceListing | Event) & { type: 'marketplace' | 'event' }).title;
      }
    } catch (error) {
      console.error('Error getting item title:', error);
      return 'Unknown Item';
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
