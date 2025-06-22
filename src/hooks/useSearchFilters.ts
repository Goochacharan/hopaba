import { useState } from 'react';
import { SortOption } from '@/components/SortButton';

export interface SearchFilters {
  distance: number[];
  minRating: number[];
  priceRange: number;
  openNowOnly: boolean;
  hiddenGemOnly: boolean;
  mustVisitOnly: boolean;
  sortBy: SortOption;
}

// Extended filters for Inbox and Service Providers
export interface InboxFilters {
  minRating: number[];
  languages: string[];
  city: string;
  postalCode: string;
  priceType: 'all' | 'negotiable' | 'fixed' | 'wholesale';
  sortBy: 'price' | 'latest' | 'rating' | 'distance';
}

export function useSearchFilters(initialFilters?: Partial<SearchFilters>) {
  // Set more neutral default values that don't apply any filtering
  const [distance, setDistance] = useState<number[]>(initialFilters?.distance || [50]);
  const [minRating, setMinRating] = useState<number[]>(initialFilters?.minRating || [0]);
  const [priceRange, setPriceRange] = useState<number>(initialFilters?.priceRange || 50000);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(initialFilters?.openNowOnly || false);
  const [hiddenGemOnly, setHiddenGemOnly] = useState<boolean>(initialFilters?.hiddenGemOnly || false);
  const [mustVisitOnly, setMustVisitOnly] = useState<boolean>(initialFilters?.mustVisitOnly || false);
  const [sortBy, setSortBy] = useState<SortOption>(initialFilters?.sortBy || 'rating');

  return {
    filters: {
      distance,
      minRating,
      priceRange,
      openNowOnly,
      hiddenGemOnly,
      mustVisitOnly,
      sortBy
    },
    setters: {
      setDistance,
      setMinRating,
      setPriceRange,
      setOpenNowOnly,
      setHiddenGemOnly,
      setMustVisitOnly,
      setSortBy
    }
  };
}

export function useInboxFilters(initialFilters?: Partial<InboxFilters>) {
  const [minRating, setMinRating] = useState<number[]>(initialFilters?.minRating || [0]);
  const [languages, setLanguages] = useState<string[]>(initialFilters?.languages || []);
  const [city, setCity] = useState<string>(initialFilters?.city || '');
  const [postalCode, setPostalCode] = useState<string>(initialFilters?.postalCode || '');
  const [priceType, setPriceType] = useState<'all' | 'negotiable' | 'fixed' | 'wholesale'>(initialFilters?.priceType || 'all');
  const [sortBy, setSortBy] = useState<'price' | 'latest' | 'rating' | 'distance'>(initialFilters?.sortBy || 'latest');

  return {
    filters: {
      minRating,
      languages,
      city,
      postalCode,
      priceType,
      sortBy
    },
    setters: {
      setMinRating,
      setLanguages,
      setCity,
      setPostalCode,
      setPriceType,
      setSortBy
    }
  };
}
