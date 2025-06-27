
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { distanceService } from '@/services/distanceService';
import { useToast } from '@/hooks/use-toast';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextType {
  userLocation: Location | null;
  isLocationEnabled: boolean;
  isCalculatingLocation: boolean;
  hasLocationPreference: boolean;
  selectedCity: string | null;
  locationDisplayName: string | null;
  enableLocation: () => Promise<void>;
  disableLocation: () => void;
  calculateDistance: (targetLocation: Location) => number | null;
  setSelectedCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

// Reverse geocoding function to get location name from coordinates
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=demo&limit=1&pretty=1`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const components = result.components;
      
      // Try to get city, town, or suburb name
      const locationName = components.city || 
                          components.town || 
                          components.suburb || 
                          components.county || 
                          components.state_district ||
                          'Current Location';
      
      return locationName;
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
  }
  
  return null;
};

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isCalculatingLocation, setIsCalculatingLocation] = useState(false);
  const [selectedCity, setSelectedCityState] = useState<string | null>(null);
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user has any location preference (GPS or city)
  const hasLocationPreference = isLocationEnabled || selectedCity !== null;

  // Load location state from localStorage on mount
  useEffect(() => {
    try {
      const savedLocationEnabled = localStorage.getItem('locationEnabled');
      const savedUserLocation = localStorage.getItem('userLocation');
      const savedSelectedCity = localStorage.getItem('selectedCity');
      const savedLocationDisplayName = localStorage.getItem('locationDisplayName');
      
      if (savedLocationEnabled === 'true') {
        console.log('📍 Location was previously enabled, restoring state');
        
        if (savedUserLocation) {
          const location = JSON.parse(savedUserLocation);
          setUserLocation(location);
          setIsLocationEnabled(true);
          console.log('✅ Restored user location from storage:', location);
        } else {
          setIsLocationEnabled(true);
        }
      }

      if (savedSelectedCity) {
        setSelectedCityState(savedSelectedCity);
        console.log('✅ Restored selected city from storage:', savedSelectedCity);
      }

      if (savedLocationDisplayName) {
        setLocationDisplayName(savedLocationDisplayName);
        console.log('✅ Restored location display name from storage:', savedLocationDisplayName);
      }
    } catch (error) {
      console.error('❌ Failed to restore location state from localStorage:', error);
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
      localStorage.removeItem('selectedCity');
      localStorage.removeItem('locationDisplayName');
    }
  }, []);

  const enableLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    setIsCalculatingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 5 * 60 * 1000
          }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setUserLocation(location);
      setIsLocationEnabled(true);
      
      // Clear city selection when GPS is enabled
      setSelectedCityState(null);
      localStorage.removeItem('selectedCity');
      
      localStorage.setItem('locationEnabled', 'true');
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      // Get readable location name from coordinates
      const displayName = await reverseGeocode(location.lat, location.lng);
      if (displayName) {
        setLocationDisplayName(displayName);
        localStorage.setItem('locationDisplayName', displayName);
        console.log('✅ Location display name set:', displayName);
      }
      
      console.log('✅ Location enabled and saved:', location);
    } catch (error) {
      console.error('❌ Failed to get user location:', error);
      setIsLocationEnabled(false);
      
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
      localStorage.removeItem('locationDisplayName');
    } finally {
      setIsCalculatingLocation(false);
    }
  };

  const disableLocation = () => {
    setUserLocation(null);
    setIsLocationEnabled(false);
    setLocationDisplayName(null);
    
    localStorage.removeItem('locationEnabled');
    localStorage.removeItem('userLocation');
    localStorage.removeItem('locationDisplayName');
    
    console.log('🔒 Location disabled and cleared from storage');
  };

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    setLocationDisplayName(city);
    localStorage.setItem('selectedCity', city);
    localStorage.setItem('locationDisplayName', city);
    
    // Clear GPS location when city is selected
    if (isLocationEnabled) {
      disableLocation();
    }
    
    console.log('🏙️ Selected city set:', city);
  };

  const calculateDistance = (targetLocation: Location): number | null => {
    if (!userLocation) return null;
    return distanceService.calculateStraightLineDistance(userLocation, targetLocation);
  };

  const value: LocationContextType = {
    userLocation,
    isLocationEnabled,
    isCalculatingLocation,
    hasLocationPreference,
    selectedCity,
    locationDisplayName,
    enableLocation,
    disableLocation,
    calculateDistance,
    setSelectedCity
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
