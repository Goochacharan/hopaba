
import { useState, useEffect, useCallback } from 'react';
import { unifiedDistanceService, type Location, type BusinessLocationData, type DistanceResult } from '@/lib/unifiedDistanceService';

export const useUnifiedDistance = () => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Get user location on hook initialization
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await unifiedDistanceService.getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Failed to get user location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getUserLocation();
  }, []);

  // Calculate distance for a single business
  const calculateDistance = useCallback(async (business: BusinessLocationData): Promise<DistanceResult | null> => {
    if (!userLocation) return null;
    
    return await unifiedDistanceService.calculateBusinessDistance(userLocation, business);
  }, [userLocation]);

  // Calculate distances for multiple businesses
  const calculateDistances = useCallback(async (businesses: BusinessLocationData[]): Promise<Map<string, DistanceResult>> => {
    const results = new Map<string, DistanceResult>();
    
    if (!userLocation) return results;

    await Promise.all(
      businesses.map(async (business) => {
        if (business.id) {
          const result = await unifiedDistanceService.calculateBusinessDistance(userLocation, business);
          if (result) {
            results.set(business.id, result);
          }
        }
      })
    );

    return results;
  }, [userLocation]);

  return {
    userLocation,
    isLoadingLocation,
    calculateDistance,
    calculateDistances
  };
};
