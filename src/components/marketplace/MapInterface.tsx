
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapInterfaceProps {
  sellerName: string;
  location?: string;
  mapLink?: string | null;
  latitude?: number;
  longitude?: number;
}

const MapInterface: React.FC<MapInterfaceProps> = ({
  sellerName,
  location,
  mapLink,
  latitude,
  longitude
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !window.google) return;

    const coordinates = latitude && longitude ? 
      { lat: latitude, lng: longitude } : 
      { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore

    const map = new window.google.maps.Map(mapContainer.current, {
      center: coordinates,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    new window.google.maps.Marker({
      position: coordinates,
      map: map,
      title: sellerName,
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        // Cleanup if needed
      }
    };
  }, [latitude, longitude, sellerName]);

  const handleDirections = () => {
    if (mapLink) {
      window.open(mapLink, '_blank');
    } else if (latitude && longitude) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(directionsUrl, '_blank');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shop Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapContainer} 
          className="w-full h-64 rounded-lg bg-muted flex items-center justify-center"
        >
          {!window.google && (
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>Map loading...</p>
            </div>
          )}
        </div>
        {location && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{location}</p>
            <button
              onClick={handleDirections}
              className="text-sm text-primary hover:underline"
            >
              Get Directions
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapInterface;
