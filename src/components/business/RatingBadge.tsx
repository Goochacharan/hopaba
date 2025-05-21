
import React from 'react';

interface RatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  size = 'md',
  className = ''
}) => {
  // Get color based on rating value
  const getColorByRating = (rating: number) => {
    if (rating <= 30) return '#ea384c'; // dark red
    if (rating <= 50) return '#F97316'; // orange
    if (rating <= 70) return '#d9a404'; // dark yellow
    if (rating <= 85) return '#68cd77'; // light green
    return '#00ee24'; // bright green
  };

  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'sm': return { width: 50, height: 50, fontSize: 20, borderWidth: 3 };
      case 'lg': return { width: 80, height: 80, fontSize: 36, borderWidth: 4 };
      default: return { width: 70, height: 70, fontSize: 32, borderWidth: 4 }; // md
    }
  };

  const { width, height, fontSize, borderWidth } = getSizeDimensions();
  const color = getColorByRating(rating);

  return (
    <div
      title={`Overall rating: ${rating}`}
      className={`flex items-center justify-center font-bold ${className}`}
      style={{
        width,
        height,
        borderRadius: '50%',
        color,
        borderColor: color,
        borderWidth,
        borderStyle: 'solid',
        fontSize,
        background: '#fff',
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.05)'
      }}
    >
      {rating}
    </div>
  );
};

export default RatingBadge;
