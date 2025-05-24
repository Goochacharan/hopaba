
import React from 'react';
import LocationSelector from '@/components/LocationSelector';
import { geocodeAddress, getUserLocation } from '@/lib/locationUtils';
import { useToast } from '@/hooks/use-toast';

interface SearchLocationProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  setUserCoordinates: (coordinates: { lat: number; lng: number } | null) => void;
}

const SearchLocation: React.FC<SearchLocationProps> = ({
  selectedLocation,
  setSelectedLocation,
  setUserCoordinates
}) => {
  const { toast } = useToast();

  const handleLocationChange = async (location: string, coordinates?: { lat: number; lng: number }) => {
    console.log(`Location changed to: ${location}`, coordinates);
    
    if (location.toLowerCase() === 'near me' || location.toLowerCase() === 'current location') {
      const userLocation = await getUserLocation();
      if (userLocation) {
        setUserCoordinates(userLocation);
        setSelectedLocation("Near me");
        toast({
          title: "Location detected",
          description: "Using your current location for nearby results"
        });
      } else {
        toast({
          title: "Location access denied",
          description: "Please allow location access or choose a specific location",
          variant: "destructive"
        });
        setSelectedLocation(location);
      }
    } else {
      setSelectedLocation(location);
      
      if (coordinates) {
        setUserCoordinates(coordinates);
      } else {
        geocodeAddress(location).then(coords => {
          if (coords) {
            setUserCoordinates(coords);
          }
        });
      }
    }
  };

  return (
    <div className="location-selector">
      <LocationSelector 
        selectedLocation={selectedLocation} 
        onLocationChange={handleLocationChange} 
      />
    </div>
  );
};

export default SearchLocation;
