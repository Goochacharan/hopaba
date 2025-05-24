
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface RatingCriteriaSliderProps {
  criterionName: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingCriteriaSlider: React.FC<RatingCriteriaSliderProps> = ({
  criterionName,
  value,
  onChange
}) => {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex justify-between">
        <label className="text-sm font-medium">{criterionName}</label>
        <span className="font-medium text-sm">{value}/10</span>
      </div>
      <Slider 
        min={1} 
        max={10} 
        step={1} 
        value={[value]} 
        onValueChange={values => onChange(values[0])}
        className="pt-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
};

export default RatingCriteriaSlider;
