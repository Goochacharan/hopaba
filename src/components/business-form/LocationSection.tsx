import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MapPin, Link2 } from 'lucide-react';
import { BusinessFormValues } from '../AddBusinessForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GoogleMapsLoader from '@/components/map/GoogleMapsLoader';
import MapLocationPicker from '@/components/map/MapLocationPicker';
import AddressAutocomplete from '@/components/map/AddressAutocomplete';
import MapDebugInfo from '@/components/map/MapDebugInfo';

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", 
  "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", 
  "Nagpur", "Indore", "Bhopal", "Visakhapatnam", "Patna", "Gwalior"
];

const LocationSection = () => {
  const form = useFormContext<BusinessFormValues>();
  const [showDebug] = useState(process.env.NODE_ENV === 'development');
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
  
  const handleLocationChange = (value: string, onChange: (value: string) => void) => {
    console.log('📍 Location change:', value);
    onChange(value);
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    console.log('🗺️ Map location selected:', location);
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lng);
    
    if (!form.getValues('address') || form.getValues('address').trim() === '') {
      form.setValue('address', location.address);
    }

    console.log('✅ Form updated with map location');
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
    
    // Update map location to trigger map update
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
  
  return (
    <>
      <div className="space-y-6 md:col-span-2">
        <h3 className="text-lg font-medium flex items-center gap-2 mt-4">
          <MapPin className="h-5 w-5 text-primary" />
          Location Information
        </h3>
      </div>

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Address*</FormLabel>
            <FormControl>
              <GoogleMapsLoader>
                <AddressAutocomplete
                  value={field.value}
                  onChange={(value) => handleLocationChange(value, field.onChange)}
                  onPlaceSelect={handleAddressPlaceSelect}
                  placeholder="Enter your business address"
                />
              </GoogleMapsLoader>
            </FormControl>
            <FormDescription>
              Start typing your address and select from suggestions. The map will automatically update to show your selected location.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Enhanced Map Section */}
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
            <FormLabel>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Google Maps Link (Optional)
              </div>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Paste your Google Maps link here" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              You can also paste a Google Maps link as an alternative to using the map above
            </FormDescription>
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
