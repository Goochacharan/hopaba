
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

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isCalculatingLocation, setIsCalculatingLocation] = useState(false);
  const [selectedCity, setSelectedCityState] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user has any location preference (GPS or city)
  const hasLocationPreference = isLocationEnabled || selectedCity !== null;

  // Load location state from localStorage on mount
  useEffect(() => {
    try {
      const savedLocationEnabled = localStorage.getItem('locationEnabled');
      const savedUserLocation = localStorage.getItem('userLocation');
      const savedSelectedCity = localStorage.getItem('selectedCity');
      
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
    } catch (error) {
      console.error('❌ Failed to restore location state from localStorage:', error);
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
      localStorage.removeItem('selectedCity');
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
      
      console.log('✅ Location enabled and saved:', location);
    } catch (error) {
      console.error('❌ Failed to get user location:', error);
      setIsLocationEnabled(false);
      
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
    } finally {
      setIsCalculatingLocation(false);
    }
  };

  const disableLocation = () => {
    setUserLocation(null);
    setIsLocationEnabled(false);
    
    localStorage.removeItem('locationEnabled');
    localStorage.removeItem('userLocation');
    
    console.log('🔒 Location disabled and cleared from storage');
  };

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem('selectedCity', city);
    
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
