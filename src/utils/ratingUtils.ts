
/**
 * Calculates the overall rating (0-100) from criteria ratings (0-10)
 * @param criteriaRatings Object containing criteria ratings as values
 * @returns Overall rating from 0-100
 */
export const calculateOverallRating = (criteriaRatings: Record<string, number> = {}): number => {
  const ratings = Object.values(criteriaRatings).filter(val => !isNaN(Number(val)));
  
  if (ratings.length === 0) {
    return 0;
  }
  
  const averageRaw = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return Math.round((averageRaw / 10) * 100);
};

/**
 * Gets the appropriate color for a rating value
 * @param rating Rating value (0-100)
 * @returns Color hex code
 */
export const getRatingColor = (rating: number): string => {
  if (rating <= 30) return '#ea384c'; // dark red
  if (rating <= 50) return '#F97316'; // orange
  if (rating <= 70) return '#d9a404'; // dark yellow (custom, close to golden)
  if (rating <= 85) return '#68cd77'; // light green
  return '#00ee24'; // bright green
};
