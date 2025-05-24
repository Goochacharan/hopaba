
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import SortFilter from './filters/SortFilter';
import RatingFilter from './filters/RatingFilter';
import PriceFilter from './filters/PriceFilter';
import YearFilter from './filters/YearFilter';
import ConditionFilter from './filters/ConditionFilter';

interface MarketplaceFiltersProps {
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  yearRange: [number, number];
  setYearRange: (range: [number, number]) => void;
  ratingFilter: number;
  setRatingFilter: (rating: number) => void;
  conditionFilter: string;
  setConditionFilter: (condition: string) => void;
  activeFilter: string | null;
  setActiveFilter: (filter: string | null) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  priceRange,
  setPriceRange,
  yearRange,
  setYearRange,
  ratingFilter,
  setRatingFilter,
  conditionFilter,
  setConditionFilter,
  activeFilter,
  setActiveFilter,
  sortOption,
  onSortChange
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-3 mb-4 overflow-x-auto py-1 px-1">
        <SortFilter 
          sortOption={sortOption} 
          onSortChange={onSortChange} 
        />
        
        <RatingFilter 
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <PriceFilter 
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <YearFilter 
          yearRange={yearRange}
          setYearRange={setYearRange}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <ConditionFilter 
          conditionFilter={conditionFilter}
          setConditionFilter={setConditionFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {user && (
          <Button
            onClick={() => navigate('/profile')}
            variant="outline"
            size="sm"
            className="rounded-full border border-border/60 flex items-center justify-center bg-orange-500 text-white hover:bg-orange-600 whitespace-nowrap px-4"
          >
            Sell your item
          </Button>
        )}
      </div>
    </ScrollArea>
  );
};

export default MarketplaceFilters;
