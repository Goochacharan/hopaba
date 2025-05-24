import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { calculateOverallRating, getRatingColor } from '@/utils/ratingUtils';

interface RatingProgressBarsProps {
  criteriaRatings: {
    [criterionId: string]: number;
  };
  locationId: string;
}

const getFallbackName = (criterionId: string): string => {
  const id = criterionId.toLowerCase();
  if (id.includes('amb')) return 'Ambience';
  if (id.includes('tast') || id.includes('food')) return 'Taste';
  if (id.includes('price') || id.includes('val')) return 'Price';
  if (id.includes('hyg') || id.includes('clean')) return 'Hygiene';
  if (id.includes('serv')) return 'Service';
  return criterionId.replace(/_/g, ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getRatingLabel = (rating: number): string => {
  if (rating <= 2) return 'Worst';
  if (rating <= 5) return 'Bad';
  if (rating <= 8) return 'Good';
  return 'Excellent';
};

const RatingProgressBars: React.FC<RatingProgressBarsProps> = ({ criteriaRatings, locationId }) => {
  const [criterionNames, setCriterionNames] = useState<{[key: string]: string}>({});

  // Fetch criterion names on component mount
  useEffect(() => {
    const fetchCriterionNames = async () => {
      try {
        const criterionIds = Object.keys(criteriaRatings);
        if (criterionIds.length > 0) {
          const { data, error } = await supabase
            .from('review_criteria')
            .select('id, name')
            .in('id', criterionIds);
          
          if (error) {
            throw error;
          }
          
          // Create a map of criterion ID to name
          const namesMap: {[key: string]: string} = {};
          data?.forEach(criterion => {
            namesMap[criterion.id] = criterion.name;
          });
          
          // For any criteria without names in the database, use fallback names
          criterionIds.forEach(id => {
            if (!namesMap[id]) {
              namesMap[id] = getFallbackName(id);
            }
          });
          
          setCriterionNames(namesMap);
        }
      } catch (err) {
        console.error('Error fetching criterion names:', err);
        
        // If fetching fails, set fallback names for all criteria
        const fallbackNames: {[key: string]: string} = {};
        Object.keys(criteriaRatings).forEach(id => {
          fallbackNames[id] = getFallbackName(id);
        });
        setCriterionNames(fallbackNames);
      }
    };
    
    fetchCriterionNames();
  }, [criteriaRatings]);

  // Calculate overall rating using our utility function
  const overallRating100 = calculateOverallRating(criteriaRatings);
  const overallColor = getRatingColor(overallRating100);

  if (Object.keys(criteriaRatings).length === 0) return null;

  const getCenterPosition = () => {
    const barHeight = 16;
    const gapSize = 1;
    const totalBars = Object.keys(criteriaRatings).length;
    
    if (totalBars === 1) return 8;
    
    const totalHeight = (barHeight * totalBars) + (gapSize * (totalBars - 1));
    return totalHeight / 2;
  };

  return (
    <div className="w-full space-y-1 mt-2 mb-4 flex flex-col gap-1">
      <div className="flex relative">
        <div 
          className="absolute right-0"
          style={{
            top: `${getCenterPosition()}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div
            title="Overall rating"
            className="flex items-center justify-center border-4 font-bold"
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              color: overallColor,
              borderColor: overallColor,
              fontSize: 32,
              background: '#fff',
              boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
            }}
          >
            {overallRating100}
          </div>
        </div>

        <div className="w-full pr-[90px]">
          {Object.entries(criteriaRatings).map(([criterionId, rating]) => {
            const normalizedRating = (rating / 10) * 100;
            const ratingColor = getRatingColor(normalizedRating);
            const ratingLabel = getRatingLabel(rating);
            
            // Always display a name, either from database or fallback
            const displayName = criterionNames[criterionId] || getFallbackName(criterionId);

            return (
              <div key={criterionId} className="flex items-center gap-1 mb-1 relative">
                <div className="w-20 text-sm text-muted-foreground text-left pr-1 truncate">
                  {displayName}
                </div>
                <div className="flex-1 relative">
                  <Progress
                    value={normalizedRating}
                    className="h-4"
                    style={{ '--progress-color': ratingColor } as React.CSSProperties}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-xs font-medium text-white text-shadow" style={{ textShadow: '0px 0px 2px rgba(0,0,0,0.7)' }}>
                      {ratingLabel}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingProgressBars;
