interface Location {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance: string;
  duration: string;
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

class DistanceService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get user's current location using browser geolocation API
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
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Convert postal code to coordinates using Google Geocoding API
   */
  async getCoordinatesFromPostalCode(postalCode: string): Promise<Location> {
    const url = `${this.baseUrl}/geocode/json?address=${encodeURIComponent(postalCode)}&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`API Key Error: ${data.error_message || 'Geocoding API access denied. Please check API key permissions and billing.'}`);
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('API quota exceeded. Please try again later or upgrade your API plan.');
      }

      if (data.status !== 'OK' || !data.results.length) {
        throw new Error(`Failed to geocode postal code: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key Error')) {
        throw error;
      }
      throw new Error(`Geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Alternative method: Try to get coordinates using a free geocoding service as fallback
   */
  async getCoordinatesFromPostalCodeFallback(postalCode: string): Promise<Location> {
    try {
      // Try Nominatim (OpenStreetMap) as a free alternative
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postalCode)}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'DistanceCalculator/1.0'
        }
      });
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No results found for this postal code');
      }
      
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } catch (error) {
      throw new Error(`Fallback geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate distance between two locations using Google Distance Matrix API
   */
  async calculateDistance(origin: Location, destination: Location): Promise<DistanceResult> {
    const url = `${this.baseUrl}/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&units=metric&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error(`API Key Error: ${data.error_message || 'Distance Matrix API access denied. Please check API key permissions and billing.'}`);
      }

      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('API quota exceeded. Please try again later or upgrade your API plan.');
      }

      if (data.status !== 'OK') {
        throw new Error(`Distance Matrix API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
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
      if (error instanceof Error && error.message.includes('API Key Error')) {
        throw error;
      }
      throw new Error(`Distance calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate straight-line distance and provide estimated driving time
   */
  calculateStraightLineDistanceWithEstimate(origin: Location, destination: Location): DistanceResult {
    const distance = this.calculateStraightLineDistance(origin, destination);
    const distanceInMeters = Math.round(distance * 1000);
    
    // Rough estimate: assume average speed of 50 km/h for driving
    const estimatedDurationSeconds = Math.round((distance / 50) * 3600);
    
    return {
      distance: `${distance.toFixed(1)} km (straight-line)`,
      duration: `${Math.round(estimatedDurationSeconds / 60)} mins (estimated)`,
      distanceValue: distanceInMeters,
      durationValue: estimatedDurationSeconds
    };
  }

  /**
   * Main function to calculate distance from user location to business postal code
   * Now includes fallback methods when APIs are restricted
   */
  async calculateDistanceToPostalCode(businessPostalCode: string): Promise<DistanceResult> {
    try {
      console.log('🔍 Getting user location...');
      const userLocation = await this.getUserLocation();
      console.log('📍 User location:', userLocation);

      console.log('🔍 Converting postal code to coordinates...');
      let businessLocation: Location;
      
      try {
        // Try Google Geocoding API first
        businessLocation = await this.getCoordinatesFromPostalCode(businessPostalCode);
        console.log('🏢 Business location (Google):', businessLocation);
      } catch (error) {
        console.warn('⚠️ Google Geocoding failed, trying fallback method...');
        console.warn('Error:', error);
        
        try {
          // Try fallback geocoding service
          businessLocation = await this.getCoordinatesFromPostalCodeFallback(businessPostalCode);
          console.log('🏢 Business location (Fallback):', businessLocation);
        } catch (fallbackError) {
          console.error('❌ Both geocoding methods failed');
          throw new Error(`Unable to geocode postal code: ${businessPostalCode}. Please check if it's valid.`);
        }
      }

      console.log('📏 Calculating distance...');
      let distanceResult: DistanceResult;
      
      try {
        // Try Google Distance Matrix API
        distanceResult = await this.calculateDistance(userLocation, businessLocation);
        console.log('✅ Distance calculation complete (Google):');
      } catch (error) {
        console.warn('⚠️ Google Distance Matrix failed, using straight-line calculation...');
        console.warn('Error:', error);
        
        // Use straight-line distance as fallback
        distanceResult = this.calculateStraightLineDistanceWithEstimate(userLocation, businessLocation);
        console.log('✅ Distance calculation complete (Straight-line estimate):');
      }
      
      console.log(`📍 Distance: ${distanceResult.distance}`);
      console.log(`⏱️ Duration: ${distanceResult.duration}`);
      console.log(`📊 Distance (meters): ${distanceResult.distanceValue}`);
      console.log(`📊 Duration (seconds): ${distanceResult.durationValue}`);

      return distanceResult;
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      throw error;
    }
  }

  /**
   * Calculate straight-line distance (as the crow flies) between two coordinates
   */
  calculateStraightLineDistance(origin: Location, destination: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(destination.lat - origin.lat);
    const dLng = this.toRadians(destination.lng - origin.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(origin.lat)) * Math.cos(this.toRadians(destination.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Create and export a singleton instance with the provided API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDNcOs1gMb2kevWEZXWdfSykt1NBXIEqjE';
export const distanceService = new DistanceService(GOOGLE_MAPS_API_KEY);

export default DistanceService;
export type { Location, DistanceResult }; 