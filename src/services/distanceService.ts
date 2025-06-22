
// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

export interface Location {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distance: string;
  duration: string;
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

class DistanceService {
  private cache = new Map<string, { result: DistanceResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user's current location using browser geolocation API
   */
  async getUserLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Geolocation timeout - taking too long to get location'));
      }, 15000); // 15 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMessage = 'Geolocation error: ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out';
              break;
            default:
              errorMessage += 'Unknown geolocation error';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache position for 1 minute
        }
      );
    });
  }

  /**
   * Get coordinates from postal code using Google Geocoding API
   */
  async getCoordinatesFromPostalCode(postalCode: string): Promise<Location> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('API Key Error: Google Maps API key is not configured');
    }

    const url = `${GOOGLE_MAPS_BASE_URL}/geocode/json?address=${encodeURIComponent(postalCode)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API Key Error: Google Maps API access forbidden - check API key permissions');
        }
        throw new Error(`Geocoding API error: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('API Key Error: Google Maps API request denied - check API key and restrictions');
      }
      
      if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
        throw new Error(`Unable to geocode postal code: ${postalCode}`);
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key Error')) {
        throw error; // Re-throw API key errors as-is
      }
      throw new Error(`Geocoding failed for ${postalCode}: ${error}`);
    }
  }

  /**
   * Fallback geocoding using OpenStreetMap Nominatim API (free alternative)
   */
  async getCoordinatesFromPostalCodeFallback(postalCode: string): Promise<Location> {
    console.log('🌐 Using fallback geocoding (OpenStreetMap) for:', postalCode);
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postalCode)}&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LocalBusinessApp/1.0' // Required by Nominatim
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error(`Unable to geocode postal code using fallback: ${postalCode}`);
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } catch (error) {
      throw new Error(`Fallback geocoding failed for ${postalCode}: ${error}`);
    }
  }

  /**
   * Calculate straight-line distance between two points using Haversine formula
   */
  calculateStraightLineDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Calculate distance between two locations and return formatted result
   */
  async calculateDistance(userLocation: Location, businessLocation: Location): Promise<DistanceResult> {
    try {
      // Try Google Distance Matrix API first if available
      if (GOOGLE_MAPS_API_KEY) {
        const result = await this.calculateDistanceWithGoogle(userLocation, businessLocation);
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Google Distance Matrix API failed, using straight-line distance:', error);
    }

    // Fallback to straight-line distance calculation
    return this.calculateStraightLineDistanceWithEstimate(userLocation, businessLocation);
  }

  /**
   * Calculate straight-line distance with estimated travel time and format it properly
   */
  private calculateStraightLineDistanceWithEstimate(userLocation: Location, businessLocation: Location): DistanceResult {
    const distance = this.calculateStraightLineDistance(userLocation, businessLocation);
    
    // Estimate driving time (assuming average speed of 40 km/h in urban areas)
    const estimatedDurationMinutes = Math.round((distance / 40) * 60);
    const durationText = estimatedDurationMinutes < 60 
      ? `${estimatedDurationMinutes} mins`
      : `${Math.round(estimatedDurationMinutes / 60)} hour${Math.round(estimatedDurationMinutes / 60) > 1 ? 's' : ''}`;

    return {
      distance: `${distance.toFixed(1)} km`,
      duration: durationText,
      distanceValue: Math.round(distance * 1000), // Convert to meters
      durationValue: estimatedDurationMinutes * 60 // Convert to seconds
    };
  }

  /**
   * Calculate distance using Google Distance Matrix API with fallback
   */
  async calculateDistanceToPostalCode(businessPostalCode: string): Promise<DistanceResult> {
    const cacheKey = `distance_${businessPostalCode}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 Using cached distance result');
      return cached.result;
    }

    try {
      // Step 1: Get user location
      console.log('📍 Getting user location...');
      const userLocation = await this.getUserLocation();
      console.log('✅ User location obtained:', userLocation);

      // Step 2: Try Google APIs first
      if (GOOGLE_MAPS_API_KEY) {
        try {
          console.log('🔍 Attempting Google Geocoding API...');
          const businessLocation = await this.getCoordinatesFromPostalCode(businessPostalCode);
          console.log('✅ Business location obtained:', businessLocation);

          // Try Distance Matrix API
          console.log('🚗 Attempting Google Distance Matrix API...');
          const result = await this.calculateDistanceWithGoogle(userLocation, businessLocation);
          
          // Cache the result
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
          console.log('✅ Google Distance Matrix API successful');
          return result;
        } catch (googleError) {
          console.warn('⚠️ Google APIs failed, falling back to alternative methods:', googleError);
        }
      } else {
        console.log('⚠️ No Google Maps API key, using fallback methods');
      }

      // Step 3: Fallback to OpenStreetMap geocoding + straight-line distance
      console.log('🌐 Using fallback methods...');
      const businessLocation = await this.getCoordinatesFromPostalCodeFallback(businessPostalCode);
      console.log('✅ Fallback geocoding successful:', businessLocation);
      
      const result = this.calculateStraightLineDistanceWithEstimate(userLocation, businessLocation);
      
      // Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      console.log('✅ Fallback distance calculation successful');
      return result;

    } catch (error) {
      console.error('❌ All distance calculation methods failed:', error);
      throw error;
    }
  }

  /**
   * Calculate distance using Google Distance Matrix API
   */
  private async calculateDistanceWithGoogle(userLocation: Location, businessLocation: Location): Promise<DistanceResult> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is required');
    }

    const origins = `${userLocation.lat},${userLocation.lng}`;
    const destinations = `${businessLocation.lat},${businessLocation.lng}`;
    const url = `${GOOGLE_MAPS_BASE_URL}/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('API Key Error: Distance Matrix API access forbidden');
        }
        throw new Error(`Distance Matrix API error: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('API Key Error: Distance Matrix API request denied');
      }

      if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
        throw new Error('Distance Matrix API returned no results');
      }

      const element = data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }

      return {
        distance: element.distance.text,
        duration: element.duration.text,
        distanceValue: element.distance.value,
        durationValue: element.duration.value
      };
    } catch (error) {
      throw new Error(`Google Distance Matrix API failed: ${error}`);
    }
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear the cache (useful for testing or when location changes significantly)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Distance cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; oldestEntry: Date | null } {
    const entries = this.cache.size;
    let oldestTimestamp = Infinity;
    
    for (const [, value] of this.cache) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
      }
    }
    
    return {
      entries,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp)
    };
  }
}

// Export singleton instance
export const distanceService = new DistanceService();
