
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { BusinessFormValues } from '../AddBusinessForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GoogleMapsLoader from '@/components/map/GoogleMapsLoader';
import MapLocationPicker from '@/components/map/MapLocationPicker';
import MapDebugInfo from '@/components/map/MapDebugInfo';

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", 
  "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"
];

const LocationSection = () => {
  const form = useFormContext<BusinessFormValues>();
  const [showDebug] = useState(process.env.NODE_ENV === 'development');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | undefined>(
    form.getValues('latitude') && form.getValues('longitude')
      ? { lat: form.getValues('latitude'), lng: form.getValues('longitude') }
      : undefined
  );
  
  console.log('🏪 LocationSection rendering - form values:', {
    address: form.getValues('address'),
    latitude: form.getValues('latitude'),
    longitude: form.getValues('longitude'),
    city: form.getValues('city'),
    area: form.getValues('area')
  });

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    console.log('🗺️ Map location selected:', location);
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lng);
    
    if (!form.getValues('address') || form.getValues('address').trim() === '') {
      form.setValue('address', location.address);
    }

    console.log('✅ Form updated with map location');
  };

  const handleAddressChange = (value: string) => {
    console.log('📍 Address change:', value);
    form.setValue('address', value);
  };

  const handleAddressPlaceSelect = (place: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    area?: string;
    postalCode?: string;
  }) => {
    console.log('🏠 Address place selected:', place);
    form.setValue('address', place.address);
    form.setValue('latitude', place.lat);
    form.setValue('longitude', place.lng);
    
    // Update map location immediately to trigger map update
    setMapLocation({ lat: place.lat, lng: place.lng });
    
    if (place.city && INDIAN_CITIES.includes(place.city)) {
      form.setValue('city', place.city);
    }
    
    if (place.area) {
      form.setValue('area', place.area);
    }
    
    if (place.postalCode) {
      form.setValue('postal_code', place.postalCode);
    }

    console.log('✅ Form updated with address place data');
  };

  const handleSearchLocation = async () => {
    const currentAddress = form.getValues('address');
    if (!currentAddress || currentAddress.trim() === '') {
      return;
    }

    setIsSearching(true);
    
    try {
      if (!window.google?.maps) {
        throw new Error('Google Maps API not loaded');
      }

      const geocoder = new window.google.maps.Geocoder();
      
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode(
          { 
            address: currentAddress
          },
          (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      const location = result.geometry.location;
      const lat = location.lat();
      const lng = location.lng();
      
      // Update form coordinates
      form.setValue('latitude', lat);
      form.setValue('longitude', lng);
      
      // Update map location to trigger map update
      setMapLocation({ lat, lng });

      // Extract location details from geocoding result
      if (result.address_components) {
        for (const component of result.address_components) {
          const types = component.types;
          
          if (types.includes('locality')) {
            const city = component.long_name;
            if (INDIAN_CITIES.includes(city)) {
              form.setValue('city', city);
            }
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            form.setValue('area', component.long_name);
          } else if (types.includes('postal_code')) {
            form.setValue('postal_code', component.long_name);
          }
        }
      }

      console.log('🔍 Location searched and found:', { lat, lng, address: currentAddress });
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <>
      <div className="space-y-6 md:col-span-2">
        <h3 className="text-lg font-medium flex items-center gap-2 mt-4">
          <MapPin className="h-5 w-5 text-primary" />
          Location Information
        </h3>
      </div>

      {/* Enhanced Map Section with integrated address input */}
      <div className="md:col-span-2 space-y-4">
        <GoogleMapsLoader>
          <MapLocationPicker
            initialLocation={
              form.getValues('latitude') && form.getValues('longitude')
                ? { lat: form.getValues('latitude'), lng: form.getValues('longitude') }
                : undefined
            }
            selectedLocation={mapLocation}
            onLocationSelect={handleMapLocationSelect}
            addressValue={form.getValues('address') || ''}
            onAddressChange={handleAddressChange}
            onAddressPlaceSelect={handleAddressPlaceSelect}
            onSearchLocation={handleSearchLocation}
            isSearching={isSearching}
            height="450px"
          />
        </GoogleMapsLoader>
        
        {/* Debug info for development */}
        <MapDebugInfo showDebug={showDebug} />
      </div>

      <FormField
        control={form.control}
        name="map_link"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Google Maps Link (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Paste your Google Maps link here" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City*</FormLabel>
            <FormControl>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="area"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Area/Neighborhood*</FormLabel>
            <FormControl>
              <Input placeholder="Enter neighborhood or area" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Hidden coordinate fields for form submission */}
      <FormField
        control={form.control}
        name="latitude"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="longitude"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input type="hidden" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};

export default LocationSection;
