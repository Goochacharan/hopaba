import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { BusinessFormValues } from './BusinessFormSimple';
import GoogleMapsLoader from '@/components/map/GoogleMapsLoader';
import MapLocationPicker from '@/components/map/MapLocationPicker';

interface LocationSectionSimpleProps {
  form: UseFormReturn<BusinessFormValues>;
}

export const LocationSectionSimple: React.FC<LocationSectionSimpleProps> = ({ form }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | undefined>(
    form.getValues('latitude') && form.getValues('longitude')
      ? { lat: form.getValues('latitude'), lng: form.getValues('longitude') }
      : undefined
  );
  
  // Watch form values to keep component in sync
  const watchedAddress = form.watch('address');
  const watchedLatitude = form.watch('latitude');
  const watchedLongitude = form.watch('longitude');
  
  // Update mapLocation when coordinates change
  useEffect(() => {
    if (watchedLatitude && watchedLongitude) {
      setMapLocation({ lat: watchedLatitude, lng: watchedLongitude });
    }
  }, [watchedLatitude, watchedLongitude]);
  


  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lng);
    
    // Always update the address when map pin is moved to reflect the precise location
    form.setValue('address', location.address);
    
    // Update map location state to keep everything in sync
    setMapLocation({ lat: location.lat, lng: location.lng });
    
    // Try to extract city, area, and postal code from the new address
    extractLocationDetailsFromAddress(location.address, location.lat, location.lng);
  };

  const extractLocationDetailsFromAddress = async (address: string, lat: number, lng: number) => {
    try {
      if (!window.google?.maps) {
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode(
          { 
            location: { lat, lng }
          },
          (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`));
            }
          }
        );
      });

      // Extract location details from geocoding result
      if (result.address_components) {
        for (const component of result.address_components) {
          const types = component.types;
          
          if (types.includes('locality')) {
            form.setValue('city', component.long_name);
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            form.setValue('area', component.long_name);
          } else if (types.includes('postal_code')) {
            form.setValue('postal_code', component.long_name);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting location details:', error);
    }
  };

  const handleAddressChange = (value: string) => {
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
    form.setValue('address', place.address);
    form.setValue('latitude', place.lat);
    form.setValue('longitude', place.lng);
    
    // Update map location immediately to trigger map update
    setMapLocation({ lat: place.lat, lng: place.lng });
    
    if (place.city) {
      form.setValue('city', place.city);
    }
    
    if (place.area) {
      form.setValue('area', place.area);
    }
    
    if (place.postalCode) {
      form.setValue('postal_code', place.postalCode);
    }
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
            form.setValue('city', component.long_name);
          } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
            form.setValue('area', component.long_name);
          } else if (types.includes('postal_code')) {
            form.setValue('postal_code', component.long_name);
          }
        }
      }


    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Location Information</h3>
      </div>

      {/* Enhanced Map Section with integrated address input */}
      <div className="space-y-4">
        <GoogleMapsLoader>
          <MapLocationPicker
            initialLocation={
              watchedLatitude && watchedLongitude
                ? { lat: watchedLatitude, lng: watchedLongitude }
                : undefined
            }
            selectedLocation={mapLocation}
            onLocationSelect={handleMapLocationSelect}
            addressValue={watchedAddress || ''}
            onAddressChange={handleAddressChange}
            onAddressPlaceSelect={handleAddressPlaceSelect}
            onSearchLocation={handleSearchLocation}
            isSearching={isSearching}
            height="400px"
          />
        </GoogleMapsLoader>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City*</FormLabel>
              <FormControl>
                <Input placeholder="Enter city" {...field} />
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
                <Input placeholder="Enter area or neighborhood" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="postal_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal Code*</FormLabel>
            <FormControl>
              <Input placeholder="Enter 6-digit postal code" {...field} />
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
    </div>
  );
};

export default LocationSectionSimple; 