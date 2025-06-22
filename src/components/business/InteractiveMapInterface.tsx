
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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Get coordinates from props or geocode address
  useEffect(() => {
    console.log('🗺️ InteractiveMapInterface - Initial data:', {
      businessName,
      address,
      area,
      city,
      latitude,
      longitude
    });

    if (latitude && longitude) {
      console.log('✅ Using provided coordinates:', { lat: latitude, lng: longitude });
      setCoordinates({ lat: latitude, lng: longitude });
    } else if ((window as any).google?.maps) {
      console.log('🔍 Starting geocoding process...');
      setIsGeocoding(true);
      setGeocodingError(null);
      
      const geocoder = new (window as any).google.maps.Geocoder();
      
      // Try multiple address combinations for better geocoding success
      const addressesToTry = [
        address ? `${businessName}, ${address}` : null,
        address ? address : null,
        area && city ? `${area}, ${city}` : null,
        city ? city : null
      ].filter(Boolean);

      console.log('📍 Address combinations to try:', addressesToTry);

      const tryGeocode = async (addressList: string[], index = 0): Promise<void> => {
        if (index >= addressList.length) {
          console.error('❌ All geocoding attempts failed');
          setGeocodingError('Unable to find location. Please check the address.');
          setIsGeocoding(false);
          return;
        }

        const currentAddress = addressList[index];
        console.log(`🔍 Trying geocoding with: "${currentAddress}" (attempt ${index + 1})`);

        geocoder.geocode({ address: currentAddress }, (results: any, status: string) => {
          console.log(`📍 Geocoding result for "${currentAddress}":`, { status, results });
          
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            console.log('✅ Geocoding successful:', coords);
            setCoordinates(coords);
            setIsGeocoding(false);
          } else {
            console.log(`⚠️ Geocoding failed for "${currentAddress}", trying next...`);
            tryGeocode(addressList, index + 1);
          }
        });
      };

      if (addressesToTry.length > 0) {
        tryGeocode(addressesToTry);
      } else {
        console.error('❌ No valid addresses to geocode');
        setGeocodingError('No location information available.');
        setIsGeocoding(false);
      }
    }
  }, [businessName, address, area, city, latitude, longitude]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !coordinates || !(window as any).google?.maps) {
      console.log('⏳ Waiting for map requirements:', {
        hasMapRef: !!mapRef.current,
        hasCoordinates: !!coordinates,
        hasGoogleMaps: !!(window as any).google?.maps
      });
      return;
    }

    console.log('🗺️ Initializing Google Map with coordinates:', coordinates);

    const newMap = new (window as any).google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const newMarker = new (window as any).google.maps.Marker({
      position: coordinates,
      map: newMap,
      title: businessName,
    });

    console.log('✅ Google Map and marker created successfully');
    setMap(newMap);
    setMarker(newMarker);

    return () => {
      if (newMarker) {
        newMarker.setMap(null);
      }
    };
  }, [coordinates, businessName]);

  const MapContent = () => {
    if (isGeocoding) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Finding location...</span>
        </div>
      );
    }

    if (geocodingError) {
      return (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            {geocodingError}
          </AlertDescription>
        </Alert>
      );
    }

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
