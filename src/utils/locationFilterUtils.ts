import { distanceService, type Location } from '@/services/distanceService';
import type { LocationFilterData } from '@/components/search/LocationFilter';
import type { ServiceRequest } from '@/types/serviceRequestTypes';

export interface BusinessWithDistance {
  id: string;
  name: string;
  postal_code?: string;
  city?: string;
  area?: string;
  map_link?: string;
  latitude?: number;
  longitude?: number;
  calculatedDistance?: number;
  distanceText?: string;
  [key: string]: any; // Allow other business properties
}

export interface ProviderWithDistance {
  provider_id: string;
  provider_name: string;
  user_id: string;
  city?: string;
  area?: string;
  postal_code?: string;
  map_link?: string;
  latitude?: number;
  longitude?: number;
  calculatedDistance?: number;
  distanceText?: string;
  [key: string]: any; // Allow other provider properties
}

export interface ServiceRequestWithDistance extends ServiceRequest {
  calculatedDistance?: number | null;
  distanceText?: string | null;
}

/**
 * Extract coordinates from Google Maps link
 */
export function extractCoordinatesFromMapLink(mapLink?: string): Location | null {
  if (!mapLink) return null;
  
  try {
    // Try to extract coordinates from various Google Maps URL formats
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/, // @lat,lng format
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // q=lat,lng format
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/, // ll=lat,lng format
    ];
    
    for (const pattern of patterns) {
      const match = mapLink.match(pattern);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to extract coordinates from map link:', mapLink, error);
    return null;
  }
}

/**
 * Get location coordinates for a business/provider
 */
export async function getItemLocation(item: BusinessWithDistance | ProviderWithDistance): Promise<Location | null> {
  // First try to use existing coordinates
  if (item.latitude && item.longitude) {
    return {
      lat: item.latitude,
      lng: item.longitude
    };
  }
  
  // Try to extract from map link
  if (item.map_link) {
    const coords = extractCoordinatesFromMapLink(item.map_link);
    if (coords) return coords;
  }
  
  // Try to geocode postal code
  if (item.postal_code) {
    try {
      return await distanceService.getCoordinatesFromPostalCode(item.postal_code);
    } catch (error) {
      console.warn('Google geocoding failed, trying fallback for:', item.postal_code);
      try {
        return await distanceService.getCoordinatesFromPostalCodeFallback(item.postal_code);
      } catch (fallbackError) {
        console.warn('Fallback geocoding also failed for:', item.postal_code);
      }
    }
  }
  
  return null;
}

/**
 * Calculate distance between user location and an item (business/provider)
 */
export async function calculateItemDistance(
  userLocation: Location,
  item: BusinessWithDistance | ProviderWithDistance
): Promise<{ distance: number; distanceText: string } | null> {
  try {
    const itemLocation = await getItemLocation(item);
    if (!itemLocation) return null;
    
    // Calculate straight-line distance
    const distance = distanceService.calculateStraightLineDistance(userLocation, itemLocation);
    
    return {
      distance,
      distanceText: `${distance.toFixed(1)} km away`
    };
  } catch (error) {
    console.warn('Failed to calculate distance for item:', item, error);
    return null;
  }
}

/**
 * Filter and sort businesses by distance
 */
export async function filterBusinessesByLocation(
  businesses: BusinessWithDistance[],
  locationFilter: LocationFilterData
): Promise<BusinessWithDistance[]> {
  if (!locationFilter.userLocation || businesses.length === 0) {
    return businesses;
  }
  
  console.log('🔍 Filtering businesses by location:', {
    userLocation: locationFilter.userLocation,
    maxDistance: locationFilter.maxDistance,
    businessCount: businesses.length
  });
  
  // Calculate distances for all businesses
  const businessesWithDistance = await Promise.all(
    businesses.map(async (business) => {
      const distanceData = await calculateItemDistance(locationFilter.userLocation!, business);
      
      return {
        ...business,
        calculatedDistance: distanceData?.distance || null,
        distanceText: distanceData?.distanceText || null
      };
    })
  );
  
  // Filter by maximum distance
  const filteredBusinesses = businessesWithDistance.filter(business => {
    if (business.calculatedDistance === null) {
      // Include businesses without location data at the end
      return true;
    }
    return business.calculatedDistance <= locationFilter.maxDistance;
  });
  
  // Sort by distance (closest first, then businesses without distance data)
  filteredBusinesses.sort((a, b) => {
    if (a.calculatedDistance === null && b.calculatedDistance === null) return 0;
    if (a.calculatedDistance === null) return 1;
    if (b.calculatedDistance === null) return -1;
    return a.calculatedDistance - b.calculatedDistance;
  });
  
  console.log('✅ Filtered businesses:', {
    originalCount: businesses.length,
    filteredCount: filteredBusinesses.length,
    withinDistance: filteredBusinesses.filter(b => b.calculatedDistance !== null && b.calculatedDistance <= locationFilter.maxDistance).length
  });
  
  return filteredBusinesses;
}

/**
 * Filter and sort providers by distance
 */
export async function filterProvidersByLocation(
  providers: ProviderWithDistance[],
  locationFilter: LocationFilterData
): Promise<ProviderWithDistance[]> {
  if (!locationFilter.userLocation || providers.length === 0) {
    return providers;
  }
  
  console.log('🔍 Filtering providers by location:', {
    userLocation: locationFilter.userLocation,
    maxDistance: locationFilter.maxDistance,
    providerCount: providers.length
  });
  
  // Calculate distances for all providers
  const providersWithDistance = await Promise.all(
    providers.map(async (provider) => {
      const distanceData = await calculateItemDistance(locationFilter.userLocation!, provider);
      
      return {
        ...provider,
        calculatedDistance: distanceData?.distance || null,
        distanceText: distanceData?.distanceText || null
      };
    })
  );
  
  // Filter by maximum distance
  const filteredProviders = providersWithDistance.filter(provider => {
    if (provider.calculatedDistance === null) {
      // Include providers without location data at the end
      return true;
    }
    return provider.calculatedDistance <= locationFilter.maxDistance;
  });
  
  // Sort by distance (closest first, then providers without distance data)
  filteredProviders.sort((a, b) => {
    if (a.calculatedDistance === null && b.calculatedDistance === null) return 0;
    if (a.calculatedDistance === null) return 1;
    if (b.calculatedDistance === null) return -1;
    return a.calculatedDistance - b.calculatedDistance;
  });
  
  console.log('✅ Filtered providers:', {
    originalCount: providers.length,
    filteredCount: filteredProviders.length,
    withinDistance: filteredProviders.filter(p => p.calculatedDistance !== null && p.calculatedDistance <= locationFilter.maxDistance).length
  });
  
  return filteredProviders;
}

/**
 * Filter businesses by postal code (exact match)
 */
export function filterBusinessesByPostalCode(
  businesses: BusinessWithDistance[],
  postalCode: string
): BusinessWithDistance[] {
  if (!postalCode.trim()) return businesses;
  
  return businesses.filter(business => 
    business.postal_code === postalCode.trim()
  );
}

/**
 * Filter providers by postal code (exact match)
 */
export function filterProvidersByPostalCode(
  providers: ProviderWithDistance[],
  postalCode: string
): ProviderWithDistance[] {
  if (!postalCode.trim()) return providers;
  
  return providers.filter(provider => 
    provider.postal_code === postalCode.trim()
  );
}

/**
 * Get distance text for display in UI components
 */
export function getDistanceDisplayText(item: BusinessWithDistance | ProviderWithDistance): string {
  if (item.distanceText) {
    return item.distanceText;
  }
  
  if (item.calculatedDistance !== null && item.calculatedDistance !== undefined) {
    return `${item.calculatedDistance.toFixed(1)} km away`;
  }
  
  return '';
}

/**
 * Check if an item has location data
 */
export function hasLocationData(item: BusinessWithDistance | ProviderWithDistance): boolean {
  return !!(
    (item.latitude && item.longitude) ||
    item.map_link ||
    item.postal_code
  );
}
