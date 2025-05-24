
import { calculateDistance, extractCoordinatesFromMapLink } from '@/lib/locationUtils';
import { Recommendation } from '@/lib/mockData';

export const addDistanceToRecommendations = (recs: Recommendation[], userCoordinates: {lat: number, lng: number} | null) => {
  if (!userCoordinates) return recs;
  
  return recs.map(rec => {
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    // Try to extract coordinates from map_link if available
    if (rec.map_link) {
      const coordinates = extractCoordinatesFromMapLink(rec.map_link);
      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lng;
      }
    }
    
    // Fallback to generated coordinates if extraction fails
    if (latitude === null || longitude === null) {
      latitude = parseFloat(rec.id) % 0.1 + 12.9716;
      longitude = parseFloat(rec.id) % 0.1 + 77.5946;
    }
    
    const distanceValue = calculateDistance(
      userCoordinates.lat,
      userCoordinates.lng,
      latitude,
      longitude,
      'K'
    );
    
    return {
      ...rec,
      calculatedDistance: distanceValue,
      distance: `${distanceValue.toFixed(1)} km away`
    };
  });
};

export const sortRecommendations = (recommendations: Recommendation[], sortBy: string) => {
  return [...recommendations].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        if (a.calculatedDistance !== undefined && b.calculatedDistance !== undefined) {
          return a.calculatedDistance - b.calculatedDistance;
        }
        const distanceA = parseFloat(a.distance?.split(' ')[0] || '0');
        const distanceB = parseFloat(b.distance?.split(' ')[0] || '0');
        return distanceA - distanceB;
      case 'reviewCount':
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      case 'newest':
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      default:
        return 0;
    }
  });
};

export const enhanceRecommendations = (recommendations: Recommendation[]) => {
  return recommendations.map(rec => {
    console.log("SearchResults - Processing recommendation:", rec.id, {
      instagram: rec.instagram || '',
      availability_days: rec.availability_days || [],
      availability_start_time: rec.availability_start_time || '',
      availability_end_time: rec.availability_end_time || '',
      isHiddenGem: rec.isHiddenGem,
      isMustVisit: rec.isMustVisit,
      map_link: rec.map_link || ''
    });
    
    return {
      ...rec,
      hours: rec.hours || rec.availability,
      price_range_min: rec.price_range_min,
      price_range_max: rec.price_range_max,
      price_unit: rec.price_unit,
      availability: rec.availability,
      availability_days: rec.availability_days || [],
      availability_start_time: rec.availability_start_time || '',
      availability_end_time: rec.availability_end_time || '',
      instagram: rec.instagram || '',
      map_link: rec.map_link,
      isHiddenGem: rec.isHiddenGem,
      isMustVisit: rec.isMustVisit
    };
  });
};
