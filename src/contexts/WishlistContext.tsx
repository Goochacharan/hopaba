
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Recommendation } from '@/lib/mockData';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import { Event } from '@/hooks/types/recommendationTypes';
import { useToast } from '@/hooks/use-toast';

export type BusinessWishlistItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  area?: string;
  city?: string;
  images?: string[];
  contact_phone?: string;
  type: 'business';
};

export type WishlistItem = 
  | (Recommendation & { type: 'location' })
  | (MarketplaceListing & { type: 'marketplace' })
  | (Event & { type: 'event' })
  | BusinessWishlistItem;

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
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        setWishlist(parsedWishlist);
      } catch (error) {
        console.error('Error parsing wishlist from localStorage:', error);
        // Reset wishlist on parse error
        localStorage.removeItem('wishlist');
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlist(prev => {
      // Check if item already exists in wishlist
      const exists = prev.some(i => i.id === item.id && i.type === item.type);
      if (exists) {
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
  };

  const removeFromWishlist = (itemId: string, itemType: 'location' | 'marketplace' | 'event' | 'business') => {
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
  };

  const toggleWishlist = (item: WishlistItem) => {
    const itemExists = isInWishlist(item.id, item.type);
    if (itemExists) {
      removeFromWishlist(item.id, item.type);
    } else {
      addToWishlist(item);
    }
  };

  const isInWishlist = (itemId: string, itemType?: 'location' | 'marketplace' | 'event' | 'business') => {
    if (itemType) {
      return wishlist.some(item => item.id === itemId && item.type === itemType);
    }
    return wishlist.some(item => item.id === itemId);
  };

  // Helper function to get the title/name from different item types
  const getItemTitle = (item: WishlistItem): string => {
    if (item.type === 'location') {
      return (item as Recommendation & { type: 'location' }).name;
    } else if (item.type === 'business') {
      return (item as BusinessWishlistItem).name;
    } else {
      return (item as (MarketplaceListing | Event) & { type: 'marketplace' | 'event' }).title;
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
