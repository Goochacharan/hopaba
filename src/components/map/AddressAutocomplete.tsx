
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { 
    address: string; 
    lat: number; 
    lng: number;
    city?: string;
    area?: string;
    postalCode?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter your business address",
  className
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = () => {
      try {
        if (!window.google?.maps?.places || !inputRef.current) {
          console.log('Google Places API not yet available');
          return;
        }

        // Initialize autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'IN' }, // Restrict to India
          fields: ['formatted_address', 'geometry', 'address_components', 'name']
        });

        // Handle place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place && place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const address = place.formatted_address || '';
            
            // Extract city, area, and postal code from address components
            let city = '';
            let area = '';
            let postalCode = '';
            
            if (place.address_components) {
              for (const component of place.address_components) {
                const types = component.types;
                
                if (types.includes('locality')) {
                  city = component.long_name;
                } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                  area = component.long_name;
                } else if (types.includes('postal_code')) {
                  postalCode = component.long_name;
                }
              }
            }

            onChange(address);
            
            if (onPlaceSelect) {
              onPlaceSelect({
                address,
                lat,
                lng,
                city,
                area,
                postalCode
              });
            }

            console.log('Place selected:', { address, lat, lng, city, area, postalCode });
          }
        });

        setIsLoaded(true);
        console.log('Address autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing address autocomplete:', error);
      }
    };

    // Check if Google Maps API is loaded
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Wait for the API to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          initializeAutocomplete();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
};

export default AddressAutocomplete;
