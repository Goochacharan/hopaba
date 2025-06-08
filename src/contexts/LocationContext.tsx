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
  enableLocation: () => Promise<void>;
  disableLocation: () => void;
  calculateDistance: (targetLocation: Location) => number | null;

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
  const { toast } = useToast();

  // Load location state from localStorage on mount
  useEffect(() => {
    try {
      const savedLocationEnabled = localStorage.getItem('locationEnabled');
      const savedUserLocation = localStorage.getItem('userLocation');
      
      if (savedLocationEnabled === 'true') {
        console.log('📍 Location was previously enabled, restoring state');
        
        if (savedUserLocation) {
          const location = JSON.parse(savedUserLocation);
          // Set both location and enabled state in a single batch
          setUserLocation(location);
          setIsLocationEnabled(true);
          console.log('✅ Restored user location from storage:', location);
        } else {
          // Only set enabled state if no location data
          setIsLocationEnabled(true);
        }
      }
    } catch (error) {
      console.error('❌ Failed to restore location state from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
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
            maximumAge: 5 * 60 * 1000 // Cache for 5 minutes
          }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setUserLocation(location);
      setIsLocationEnabled(true);
      
      // Save to localStorage
      localStorage.setItem('locationEnabled', 'true');
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      console.log('✅ Location enabled and saved:', location);
    } catch (error) {
      console.error('❌ Failed to get user location:', error);
      setIsLocationEnabled(false);
      
      // Clear localStorage on error
      localStorage.removeItem('locationEnabled');
      localStorage.removeItem('userLocation');
    } finally {
      setIsCalculatingLocation(false);
    }
  };

  const disableLocation = () => {
    setUserLocation(null);
    setIsLocationEnabled(false);
    
    // Remove from localStorage
    localStorage.removeItem('locationEnabled');
    localStorage.removeItem('userLocation');
    
    console.log('🔒 Location disabled and cleared from storage');
  };

  const calculateDistance = (targetLocation: Location): number | null => {
    if (!userLocation) return null;
    return distanceService.calculateStraightLineDistance(userLocation, targetLocation);
  };



  const value: LocationContextType = {
    userLocation,
    isLocationEnabled,
    isCalculatingLocation,
    enableLocation,
    disableLocation,
    calculateDistance
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 