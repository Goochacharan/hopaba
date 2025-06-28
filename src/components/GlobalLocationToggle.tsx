
import React from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2, MapPin } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { Badge } from '@/components/ui/badge';

const GlobalLocationToggle: React.FC = () => {
  const { 
    isLocationEnabled, 
    isCalculatingLocation, 
    enableLocation, 
    disableLocation,
    userLocation,
    locationDisplayName,
    hasLocationPreference
  } = useLocation();

  const handleToggle = () => {
    if (isLocationEnabled) {
      disableLocation();
    } else {
      enableLocation();
    }
  };

  // Get the display text for the location
  const getLocationDisplayText = () => {
    if (isCalculatingLocation) {
      return 'Getting Location...';
    }
    
    if (locationDisplayName) {
      return `Searching in ${locationDisplayName}`;
    }
    
    if (hasLocationPreference) {
      return 'Location enabled';
    }
    
    return 'Location not set';
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={hasLocationPreference ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isCalculatingLocation}
        className="flex items-center gap-2"
      >
        {isCalculatingLocation ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasLocationPreference ? (
          <Navigation className="h-4 w-4" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {getLocationDisplayText()}
        </span>
      </Button>
      
      {isLocationEnabled && userLocation && (
        <Badge variant="secondary" className="hidden md:flex text-xs">
          📍 {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
        </Badge>
      )}
    </div>
  );
};

export default GlobalLocationToggle;
