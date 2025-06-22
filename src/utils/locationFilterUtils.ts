
import { unifiedDistanceService, type Location } from '@/lib/unifiedDistanceService';
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
 * Calculate distance between user location and an item (business/provider) using unified service
 */
export async function calculateItemDistance(
  userLocation: Location,
  item: BusinessWithDistance | ProviderWithDistance
): Promise<{ distance: number; distanceText: string; isPrecise: boolean } | null> {
  try {
    const result = await unifiedDistanceService.calculateBusinessDistance(userLocation, {
      id: 'id' in item ? item.id : item.provider_id,
      name: 'name' in item ? item.name : item.provider_name,
      latitude: item.latitude,
      longitude: item.longitude,
      postal_code: item.postal_code,
      map_link: item.map_link
    });
    
    if (!result) return null;
    
    return {
      distance: result.distance,
      distanceText: result.distanceText,
      isPrecise: result.isPrecise
    };
  } catch (error) {
    console.warn('Failed to calculate distance for item:', item, error);
    return null;
  }
}

/**
 * Filter and sort businesses by distance using unified service
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
  
  // Calculate distances for all businesses using unified service
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
 * Filter and sort providers by distance using unified service
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
  
  // Calculate distances for all providers using unified service
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
