
import { calculateDistance } from './locationUtils';
import { extractCoordinatesFromMapLink } from './locationUtils';
import { distanceService } from '@/services/distanceService';

export interface Location {
  lat: number;
  lng: number;
}

export interface BusinessLocationData {
  id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  postal_code?: string;
  map_link?: string;
}

export interface DistanceResult {
  distance: number; // in kilometers
  distanceText: string;
  isPrecise: boolean;
}

class UnifiedDistanceService {
  private cache = new Map<string, { result: DistanceResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get business location using consistent priority order
   */
  private async getBusinessLocation(business: BusinessLocationData): Promise<{ location: Location; isPrecise: boolean } | null> {
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

    // Priority 3: Geocode postal code (approximate)
    if (business.postal_code) {
      try {
        const location = await distanceService.getCoordinatesFromPostalCodeFallback(business.postal_code);
        return {
          location,
          isPrecise: false
        };
      } catch (error) {
        console.warn('Failed to geocode postal code:', business.postal_code, error);
      }
    }

    return null;
  }

  /**
   * Calculate distance between user location and business with consistent formatting
   */
  async calculateBusinessDistance(userLocation: Location, business: BusinessLocationData): Promise<DistanceResult | null> {
    const cacheKey = this.generateCacheKey(userLocation, business);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      const businessLocationResult = await this.getBusinessLocation(business);
      if (!businessLocationResult) {
        return null;
      }

      const { location: businessLocation, isPrecise } = businessLocationResult;
      
      // Use the same calculation method everywhere
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        businessLocation.lat,
        businessLocation.lng,
        'K'
      );

      // Consistent formatting
      const distanceText = this.formatDistance(distance, isPrecise);
      
      const result: DistanceResult = {
        distance,
        distanceText,
        isPrecise
      };

      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Failed to calculate business distance:', error);
      return null;
    }
  }

  /**
   * Consistent distance formatting
   */
  private formatDistance(distance: number, isPrecise: boolean): string {
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      return isPrecise ? `${meters}m away` : `~${meters}m away`;
    } else {
      const km = distance.toFixed(1);
      return isPrecise ? `${km}km away` : `~${km}km away`;
    }
  }

  /**
   * Generate consistent cache key
   */
  private generateCacheKey(userLocation: Location, business: BusinessLocationData): string {
    const userKey = `${userLocation.lat.toFixed(6)},${userLocation.lng.toFixed(6)}`;
    const businessKey = business.latitude && business.longitude
      ? `coords:${business.latitude.toFixed(6)},${business.longitude.toFixed(6)}`
      : business.postal_code
      ? `postal:${business.postal_code}`
      : business.map_link
      ? `map:${business.map_link}`
      : `id:${business.id}`;
    
    return `${userKey}->${businessKey}`;
  }

  /**
   * Get user's current location
   */
  async getUserLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
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
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache position for 5 minutes
        }
      );
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const unifiedDistanceService = new UnifiedDistanceService();
