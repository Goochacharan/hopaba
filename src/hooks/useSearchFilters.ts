
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

export function useSearchFilters(initialFilters?: Partial<SearchFilters>) {
  // Set more neutral default values that don't apply any filtering
  const [distance, setDistance] = useState<number[]>(initialFilters?.distance || [10]);
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
