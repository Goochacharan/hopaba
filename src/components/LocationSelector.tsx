
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [locationInput, setLocationInput] = useState(selectedLocation);

  useEffect(() => {
    setLocationInput(selectedLocation);
  }, [selectedLocation]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Finding your location",
        description: "Please wait while we access your location...",
        duration: 3000
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get coordinates
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // For display purposes we'll use "Current Location" label
          const location = "Current Location";
          
          // Pass both the location name and coordinates
          onLocationChange(location, { lat, lng });
          setIsEditing(false);
          
          toast({
            title: "Location updated",
            description: "Using your current location",
            duration: 3000
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location error",
            description: "Unable to access your location. Please check your browser permissions.",
            variant: "destructive",
            duration: 5000
          });
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      onLocationChange(locationInput);
      setIsEditing(false);
    }
  };

  const clearLocationInput = () => {
    setLocationInput('');
  };

  return (
    <div className="bg-white rounded-xl border border-border p-3 mb-4 animate-fade-in">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="relative flex-1">
            <Input 
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter location..."
              className="flex-1 h-9 pr-8"
              autoFocus
            />
            {locationInput && (
              <button
                type="button"
                onClick={clearLocationInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="flex-shrink-0">Apply</Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleUseCurrentLocation}
            className="flex-shrink-0 p-2"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-medium truncate">{selectedLocation}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Change Location
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
