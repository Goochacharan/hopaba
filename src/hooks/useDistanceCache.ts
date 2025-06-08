import { useState, useCallback, useRef } from 'react';
import { distanceService, type Location } from '@/services/distanceService';
import { extractCoordinatesFromMapLink } from '@/lib/locationUtils';

interface CachedDistance {
  distance: number;
  timestamp: number;
  isPrecise: boolean;
}

interface DistanceCalculationResult {
  distance: number;
  distanceText: string;
  isPrecise: boolean;
}

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

// Global cache to persist across component re-renders
const globalDistanceCache = new Map<string, CachedDistance>();
const globalGeocodingCache = new Map<string, Location>();

export const useDistanceCache = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const calculationPromises = useRef(new Map<string, Promise<DistanceCalculationResult | null>>());

  // Generate cache key for distance calculations
  const generateDistanceCacheKey = useCallback((
    userLocation: Location,
    business: {
      id?: string;
      latitude?: number;
      longitude?: number;
      postal_code?: string;
      map_link?: string;
    }
  ): string => {
    const userKey = `${userLocation.lat.toFixed(6)},${userLocation.lng.toFixed(6)}`;
    const businessKey = business.latitude && business.longitude
      ? `coords:${business.latitude.toFixed(6)},${business.longitude.toFixed(6)}`
      : business.postal_code
      ? `postal:${business.postal_code}`
      : business.map_link
      ? `map:${business.map_link}`
      : `id:${business.id}`;
    
    return `${userKey}->${businessKey}`;
  }, []);

  // Check if cached distance is still valid
  const isCacheValid = useCallback((cached: CachedDistance): boolean => {
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, []);

  // Get cached distance if available and valid
  const getCachedDistance = useCallback((cacheKey: string): CachedDistance | null => {
    const cached = globalDistanceCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      return cached;
    }
    // Remove expired cache entry
    if (cached) {
      globalDistanceCache.delete(cacheKey);
    }
    return null;
  }, [isCacheValid]);

  // Cache distance calculation result
  const cacheDistance = useCallback((cacheKey: string, distance: number, isPrecise: boolean) => {
    globalDistanceCache.set(cacheKey, {
      distance,
      timestamp: Date.now(),
      isPrecise
    });
  }, []);

  // Get business location with caching
  const getBusinessLocation = useCallback(async (business: {
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    map_link?: string;
  }): Promise<{ location: Location; isPrecise: boolean } | null> => {
    // Priority 1: Use exact coordinates if available
    if (business.latitude && business.longitude) {
      return {
        location: { lat: business.latitude, lng: business.longitude },
        isPrecise: true
      };
    }

    // Priority 2: Extract from Google Maps link
    if (business.map_link) {
      try {
        const coords = extractCoordinatesFromMapLink(business.map_link);
        if (coords) {
          return {
            location: coords,
            isPrecise: true
          };
        }
      } catch (error) {
        console.warn('Failed to extract coordinates from map link:', error);
      }
    }

    // Priority 3: Geocode postal code with caching
    if (business.postal_code) {
      // Check geocoding cache first
      const cachedLocation = globalGeocodingCache.get(business.postal_code);
      if (cachedLocation) {
        return {
          location: cachedLocation,
          isPrecise: false
        };
      }

      try {
        const location = await distanceService.getCoordinatesFromPostalCodeFallback(business.postal_code);
        // Cache the geocoding result
        globalGeocodingCache.set(business.postal_code, location);
        return {
          location,
          isPrecise: false
        };
      } catch (error) {
        console.warn('Failed to geocode postal code:', business.postal_code, error);
      }
    }

    return null;
  }, []);

  // Calculate distance with caching
  const calculateDistance = useCallback(async (
    userLocation: Location,
    business: {
      id?: string;
      name?: string;
      latitude?: number;
      longitude?: number;
      postal_code?: string;
      map_link?: string;
    }
  ): Promise<DistanceCalculationResult | null> => {
    const cacheKey = generateDistanceCacheKey(userLocation, business);
    const businessName = business.name || business.id || 'Unknown Business';

    // Check cache first
    const cached = getCachedDistance(cacheKey);
    if (cached) {
      // Only log cache hits occasionally to reduce spam
      if (Math.random() < 0.1) { // Log 10% of cache hits
        console.log(`📦 Cache hit for ${businessName}: ${cached.distance.toFixed(1)}km`);
      }
      return {
        distance: cached.distance,
        distanceText: cached.isPrecise ? `${cached.distance.toFixed(1)} km` : `~${cached.distance.toFixed(1)} km`,
        isPrecise: cached.isPrecise
      };
    }

    // Check if calculation is already in progress
    if (calculationPromises.current.has(cacheKey)) {
      return calculationPromises.current.get(cacheKey)!;
    }

    // Start new calculation
    const calculationPromise = (async (): Promise<DistanceCalculationResult | null> => {
      try {
        setIsCalculating(true);

        const businessLocationResult = await getBusinessLocation(business);
        if (!businessLocationResult) {
          console.warn(`❌ ${businessName}: No location data available`);
          return null;
        }

        const { location: businessLocation, isPrecise } = businessLocationResult;
        const distance = distanceService.calculateStraightLineDistance(userLocation, businessLocation);

        // Cache the result
        cacheDistance(cacheKey, distance, isPrecise);

        // Only log new calculations, not cache hits
        console.log(`✅ ${businessName}: ${distance.toFixed(1)}km calculated and cached`);

        return {
          distance,
          distanceText: isPrecise ? `${distance.toFixed(1)} km` : `~${distance.toFixed(1)} km`,
          isPrecise
        };
      } catch (error) {
        console.error(`❌ ${businessName}: Distance calculation failed:`, error);
        return null;
      } finally {
        setIsCalculating(false);
        // Remove from ongoing calculations
        calculationPromises.current.delete(cacheKey);
      }
    })();

    // Store the promise to avoid duplicate calculations
    calculationPromises.current.set(cacheKey, calculationPromise);

    return calculationPromise;
  }, [generateDistanceCacheKey, getCachedDistance, cacheDistance, getBusinessLocation]);

  // Calculate distances for multiple businesses efficiently
  const calculateDistancesForBusinesses = useCallback(async (
    userLocation: Location,
    businesses: Array<{
      id?: string;
      name?: string;
      latitude?: number;
      longitude?: number;
      postal_code?: string;
      map_link?: string;
    }>
  ): Promise<Array<{ business: any; distance: number | null; distanceText: string; isPrecise: boolean }>> => {
    // Only log if we're processing a significant number of businesses
    if (businesses.length > 5) {
      console.log(`🔄 Processing distances for ${businesses.length} businesses...`);
    }
    
    const results = await Promise.all(
      businesses.map(async (business) => {
        const result = await calculateDistance(userLocation, business);
        return {
          business,
          distance: result?.distance || null,
          distanceText: result?.distanceText || '',
          isPrecise: result?.isPrecise || false
        };
      })
    );

    const successCount = results.filter(r => r.distance !== null).length;
    const cacheHits = results.length - successCount; // Approximate cache hits
    
    // Only log summary for larger batches
    if (businesses.length > 5) {
      console.log(`✅ Distance processing complete: ${successCount} calculated, ~${cacheHits} from cache`);
    }

    return results;
  }, [calculateDistance]);

  // Clear cache (useful for testing or when user location changes significantly)
  const clearCache = useCallback(() => {
    globalDistanceCache.clear();
    globalGeocodingCache.clear();
    calculationPromises.current.clear();
    console.log('🗑️ Distance cache cleared');
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const validEntries = Array.from(globalDistanceCache.values()).filter(isCacheValid);
    return {
      totalDistanceEntries: globalDistanceCache.size,
      validDistanceEntries: validEntries.length,
      geocodingEntries: globalGeocodingCache.size,
      ongoingCalculations: calculationPromises.current.size
    };
  }, [isCacheValid]);

  return {
    calculateDistance,
    calculateDistancesForBusinesses,
    isCalculating,
    clearCache,
    getCacheStats
  };
}; 