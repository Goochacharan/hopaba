
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @param unit 'K' for kilometers, 'M' for miles, 'N' for nautical miles
 * @returns Distance in specified unit
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  unit: 'K' | 'M' | 'N' = 'K'
): number {
  if ((lat1 === lat2) && (lon1 === lon2)) {
    return 0;
  }
  
  const radlat1 = Math.PI * lat1 / 180;
  const radlat2 = Math.PI * lat2 / 180;
  const theta = lon1 - lon2;
  const radtheta = Math.PI * theta / 180;
  
  let dist = Math.sin(radlat1) * Math.sin(radlat2) + 
             Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  
  if (dist > 1) {
    dist = 1;
  }
  
  dist = Math.acos(dist);
  dist = dist * 180 / Math.PI;
  dist = dist * 60 * 1.1515; // Distance in miles
  
  if (unit === 'K') { 
    dist = dist * 1.609344; // Convert to kilometers
  } else if (unit === 'N') { 
    dist = dist * 0.8684; // Convert to nautical miles
  }
  
  return Math.round(dist * 10) / 10; // Round to 1 decimal place
}

/**
 * Geocode an address to get coordinates
 * @param address Address string to geocode
 * @returns Promise with lat/lng or null if geocoding failed
 */
export async function geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
  try {
    // This is a placeholder. You would need to implement a real geocoding service.
    // For example, using Mapbox's geocoding API or Google Maps Geocoding API
    console.log('Geocoding address:', address);
    
    // For demo purposes, return some dummy coordinates based on the address string
    // In a real implementation, you would call an actual geocoding service
    if (address === 'Current Location') {
      return null; // Current location is handled separately via browser geolocation
    }
    
    if (address.toLowerCase().includes('bengaluru') || address.toLowerCase().includes('bangalore')) {
      return { lat: 12.9716, lng: 77.5946 };
    }
    
    // Fallback to dummy coordinates
    return { lat: 12.9716, lng: 77.5946 };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Format distance for display
 * @param distance Distance value
 * @param unit Unit of distance ('km' or 'mi')
 * @returns Formatted distance string
 */
export function formatDistance(distance: number, unit: 'km' | 'mi' = 'km'): string {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(1)} ${unit}`;
}

/**
 * Extract coordinates from Google Maps link
 * @param mapLink Google Maps URL
 * @returns Object with lat and lng or null if not found
 */
export function extractCoordinatesFromMapLink(mapLink: string | null): { lat: number, lng: number } | null {
  if (!mapLink) return null;
  
  try {
    // Match patterns like @12.9716,77.5946 or ?q=12.9716,77.5946
    const coordinatesRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)|q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = mapLink.match(coordinatesRegex);
    
    if (match) {
      // Check which pattern matched (@lat,lng or q=lat,lng)
      const lat = parseFloat(match[1] || match[3]);
      const lng = parseFloat(match[2] || match[4]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    console.log('Could not extract coordinates from map link:', mapLink);
    return null;
  } catch (error) {
    console.error('Error extracting coordinates from map link:', error);
    return null;
  }
}

/**
 * Get user's current location using browser's geolocation API
 * @returns Promise with user's coordinates or null if unavailable/denied
 */
export function getUserLocation(): Promise<{ lat: number, lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting user location:', error);
        resolve(null);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Calculate precise distance between user location and business
 * Uses exact coordinates when available, falls back to postal code estimation
 * @param userLocation User's current coordinates
 * @param business Business object with location data
 * @returns Distance in kilometers or null if calculation fails
 */
export function calculatePreciseBusinessDistance(
  userLocation: { lat: number, lng: number },
  business: {
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    map_link?: string;
  }
): number | null {
  try {
    // First priority: Use exact coordinates if available
    if (business.latitude && business.longitude) {
      console.log('Using exact coordinates for distance calculation:', {
        business: { lat: business.latitude, lng: business.longitude },
        user: userLocation
      });
      
      return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        business.latitude,
        business.longitude,
        'K'
      );
    }

    // Second priority: Extract coordinates from Google Maps link
    if (business.map_link) {
      const coords = extractCoordinatesFromMapLink(business.map_link);
      if (coords) {
        console.log('Using coordinates extracted from map link:', coords);
        return calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng,
          'K'
        );
      }
    }

    // Fallback: Use postal code (approximate)
    if (business.postal_code) {
      console.log('Falling back to postal code approximation for:', business.postal_code);
      // This would need a postal code to coordinates database
      // For now, return null to indicate we can't calculate precise distance
      return null;
    }

    console.log('No location data available for distance calculation');
    return null;
  } catch (error) {
    console.error('Error calculating precise business distance:', error);
    return null;
  }
}

/**
 * Get business coordinates from various sources
 * @param business Business object with location data
 * @returns Coordinates or null if not available
 */
export function getBusinessCoordinates(business: {
  latitude?: number;
  longitude?: number;
  map_link?: string;
}): { lat: number, lng: number } | null {
  // First check if we have exact coordinates
  if (business.latitude && business.longitude) {
    return {
      lat: business.latitude,
      lng: business.longitude
    };
  }

  // Try to extract from map link
  if (business.map_link) {
    return extractCoordinatesFromMapLink(business.map_link);
  }

  return null;
}

/**
 * Format distance with precision indicator
 * @param distance Distance in kilometers
 * @param isPrecise Whether the distance was calculated using exact coordinates
 * @returns Formatted distance string with precision indicator
 */
export function formatPreciseDistance(distance: number, isPrecise: boolean): string {
  const formattedDistance = formatDistance(distance);
  return isPrecise ? formattedDistance : `~${formattedDistance}`;
}
