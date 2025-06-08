import { useDistanceCache } from '@/hooks/useDistanceCache';

// Utility functions for distance cache management
export const DistanceCacheManager = {
  // Get cache statistics for debugging
  getCacheStats: () => {
    const { getCacheStats } = useDistanceCache();
    return getCacheStats();
  },

  // Clear cache when user location changes significantly
  clearCacheOnLocationChange: (oldLocation: { lat: number; lng: number } | null, newLocation: { lat: number; lng: number } | null) => {
    if (!oldLocation || !newLocation) return false;
    
    // Calculate distance between old and new location
    const R = 6371; // Earth's radius in kilometers
    const dLat = (newLocation.lat - oldLocation.lat) * Math.PI / 180;
    const dLng = (newLocation.lng - oldLocation.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(oldLocation.lat * Math.PI / 180) * Math.cos(newLocation.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    // Clear cache if user moved more than 5km
    if (distance > 5) {
      const { clearCache } = useDistanceCache();
      clearCache();
      console.log(`🗑️ Distance cache cleared due to significant location change: ${distance.toFixed(2)}km`);
      return true;
    }
    
    return false;
  },

  // Log cache performance for debugging
  logCachePerformance: () => {
    const { getCacheStats } = useDistanceCache();
    const stats = getCacheStats();
    
    console.log('📊 Distance Cache Performance:', {
      totalDistanceEntries: stats.totalDistanceEntries,
      validDistanceEntries: stats.validDistanceEntries,
      geocodingEntries: stats.geocodingEntries,
      ongoingCalculations: stats.ongoingCalculations,
      cacheHitRate: stats.totalDistanceEntries > 0 ? 
        ((stats.validDistanceEntries / stats.totalDistanceEntries) * 100).toFixed(1) + '%' : 
        'N/A'
    });
  }
};

// Constants for cache configuration
export const DISTANCE_CACHE_CONFIG = {
  CACHE_DURATION_MS: 60 * 60 * 1000, // 1 hour
  MAX_CACHE_SIZE: 1000, // Maximum number of cached entries
  LOCATION_CHANGE_THRESHOLD_KM: 5, // Clear cache if user moves more than 5km
  BATCH_SIZE: 50 // Maximum number of businesses to calculate distances for in one batch
}; 