
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import GoogleMapsLoader from './GoogleMapsLoader';
import AddressAutocomplete from './AddressAutocomplete';

interface MapLocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  height = "500px"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!window.google?.maps) {
          console.error('Google Maps API not loaded');
          toast({
            title: "Error",
            description: "Google Maps API not available. Please check your API key.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const defaultLocation = initialLocation || { lat: 12.9716, lng: 77.5946 };

        if (mapRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          geocoderRef.current = new window.google.maps.Geocoder();

          markerRef.current = new window.google.maps.Marker({
            position: defaultLocation,
            map: mapInstanceRef.current,
            draggable: true,
            title: "Drag to set your business location"
          });

          markerRef.current.addListener('dragend', async () => {
            if (markerRef.current) {
              const position = markerRef.current.getPosition();
              if (position) {
                const lat = position.lat();
                const lng = position.lng();
                await updateLocationFromCoordinates({ lat, lng });
              }
            }
          });

          mapInstanceRef.current.addListener('click', async (event: any) => {
            if (event.latLng) {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();
              
              if (markerRef.current) {
                markerRef.current.setPosition({ lat, lng });
              }
              
              await updateLocationFromCoordinates({ lat, lng });
            }
          });

          if (initialLocation) {
            await updateLocationFromCoordinates(initialLocation);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          title: "Error",
          description: "Failed to initialize map. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

  const updateLocationFromCoordinates = async (location: { lat: number; lng: number }) => {
    try {
      if (!geocoderRef.current) return;

      const response = await new Promise<any>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location },
          (results: any, status: any) => {
            if (status === window.google.maps.GeocoderStatus.OK) {
              resolve({ results: results || [] });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      const address = response.results?.[0]?.formatted_address || `${location.lat}, ${location.lng}`;
      
      setSelectedLocation(location);
      onLocationSelect({
        lat: location.lat,
        lng: location.lng,
        address
      });

      console.log('Location selected:', { ...location, address });
    } catch (error) {
      console.error('Error geocoding location:', error);
      setSelectedLocation(location);
      onLocationSelect({
        lat: location.lat,
        lng: location.lng,
        address: `${location.lat}, ${location.lng}`
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter(location);
          markerRef.current.setPosition(location);
        }

        await updateLocationFromCoordinates(location);
        setIsLoading(false);

        toast({
          title: "Location found",
          description: "Map updated to your current location.",
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        toast({
          title: "Error",
          description: "Unable to get your current location. Please select manually on the map.",
          variant: "destructive"
        });
        setIsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchPlaceSelect = (place: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    area?: string;
    postalCode?: string;
  }) => {
    const location = { lat: place.lat, lng: place.lng };
    
    // Update map center and marker
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(location);
      mapInstanceRef.current.setZoom(16);
      markerRef.current.setPosition(location);
    }

    // Update location state and notify parent
    setSelectedLocation(location);
    onLocationSelect({
      lat: place.lat,
      lng: place.lng,
      address: place.address
    });

    setSearchValue(place.address);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Select Business Location</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Search for your address below, click on the map, or drag the marker to set your exact business location.
      </p>

      {/* Integrated Search Bar */}
      <div className="space-y-3">
        <GoogleMapsLoader>
          <AddressAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            onPlaceSelect={handleSearchPlaceSelect}
            placeholder="Search for your business address..."
            className="w-full"
          />
        </GoogleMapsLoader>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Use Current Location
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="border rounded-lg shadow-sm"
      />

      {/* Selected Coordinates Display */}
      {selectedLocation && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Selected Coordinates:</p>
          <p className="text-xs text-muted-foreground">
            Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
