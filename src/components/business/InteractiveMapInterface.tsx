
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import GoogleMapsLoader from '@/components/map/GoogleMapsLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';

interface InteractiveMapInterfaceProps {
  businessName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

const InteractiveMapInterface: React.FC<InteractiveMapInterfaceProps> = ({ 
  businessName, 
  address, 
  latitude, 
  longitude 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);

  // Get coordinates from props or geocode address
  useEffect(() => {
    if (latitude && longitude) {
      setCoordinates({ lat: latitude, lng: longitude });
    } else if (address && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: `${businessName}, ${address}` }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCoordinates({ lat: location.lat(), lng: location.lng() });
        }
      });
    }
  }, [businessName, address, latitude, longitude]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !coordinates || !window.google?.maps) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const newMarker = new window.google.maps.Marker({
      position: coordinates,
      map: newMap,
      title: businessName,
    });

    setMap(newMap);
    setMarker(newMarker);

    return () => {
      if (newMarker) {
        newMarker.setMap(null);
      }
    };
  }, [coordinates, businessName]);

  const MapContent = () => {
    if (!coordinates) {
      return (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Unable to load map for this location. Please check the address.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border"
        style={{ minHeight: '256px' }}
      />
    );
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {businessName} Location
          </h3>
          {address && (
            <p className="text-sm text-muted-foreground mt-1">{address}</p>
          )}
        </div>
        <GoogleMapsLoader>
          <MapContent />
        </GoogleMapsLoader>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapInterface;
