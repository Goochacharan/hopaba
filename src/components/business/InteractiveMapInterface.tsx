
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import GoogleMapsLoader from '@/components/map/GoogleMapsLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2 } from 'lucide-react';

interface InteractiveMapInterfaceProps {
  businessName: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

const InteractiveMapInterface: React.FC<InteractiveMapInterfaceProps> = ({ 
  businessName, 
  address, 
  area,
  city,
  latitude, 
  longitude 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process location data when Google Maps is ready
  useEffect(() => {
    const processLocation = async () => {
      if (!(window as any).google?.maps) {
        console.log('⏳ Google Maps not ready yet');
        return;
      }

      console.log('🗺️ Processing location data:', {
        businessName,
        hasLatLng: !!(latitude && longitude),
        hasAddress: !!address,
        hasAreaCity: !!(area || city)
      });

      setIsProcessing(true);
      setError(null);

      try {
        // Use provided coordinates if available
        if (latitude && longitude) {
          console.log('✅ Using provided coordinates:', { lat: latitude, lng: longitude });
          setCoordinates({ lat: latitude, lng: longitude });
          setIsProcessing(false);
          return;
        }

        // Fallback to geocoding
        console.log('🔍 Starting geocoding...');
        const geocoder = new (window as any).google.maps.Geocoder();
        
        // Build address string for geocoding
        const addressParts = [businessName, address, area, city].filter(Boolean);
        const geocodeAddress = addressParts.join(', ');
        
        console.log(`📍 Geocoding address: "${geocodeAddress}"`);

        geocoder.geocode({ address: geocodeAddress }, (results: any, status: string) => {
          console.log('📍 Geocoding result:', { status, resultCount: results?.length || 0 });
          
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            console.log('✅ Geocoding successful:', coords);
            setCoordinates(coords);
          } else {
            console.error('❌ Geocoding failed:', status);
            setError('Unable to find location on map');
          }
          setIsProcessing(false);
        });

      } catch (err) {
        console.error('💥 Location processing error:', err);
        setError('Failed to process location data');
        setIsProcessing(false);
      }
    };

    processLocation();
  }, [businessName, address, area, city, latitude, longitude]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !coordinates || !(window as any).google?.maps) {
      return;
    }

    console.log('🗺️ Initializing map with coordinates:', coordinates);

    try {
      // Clean up existing map and marker
      if (marker) {
        marker.setMap(null);
        setMarker(null);
      }
      if (map) {
        setMap(null);
      }

      // Create new map
      const newMap = new (window as any).google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Create marker
      const newMarker = new (window as any).google.maps.Marker({
        position: coordinates,
        map: newMap,
        title: businessName,
      });

      console.log('✅ Map and marker created successfully');
      setMap(newMap);
      setMarker(newMarker);

    } catch (err) {
      console.error('❌ Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [coordinates, businessName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  const MapContent = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Finding location...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!coordinates) {
      return (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            No location information available for this business.
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
          {(area || city) && (
            <p className="text-sm text-muted-foreground mt-1">{[area, city].filter(Boolean).join(', ')}</p>
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
