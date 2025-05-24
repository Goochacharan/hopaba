import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { distanceService, type Location, type DistanceResult } from '@/services/distanceService';
import { calculateAndLogDistance } from '@/utils/distanceUtils';

interface LocationFilterProps {
  onLocationFilter: (filters: LocationFilterData) => void;
  initialPostalCode?: string;
  initialMaxDistance?: number;
  className?: string;
}

export interface LocationFilterData {
  userLocation: Location | null;
  postalCode: string;
  maxDistance: number; // in kilometers
  useCurrentLocation: boolean;
  filteredItems: any[]; // Will be populated with distance-filtered items
}

const LocationFilter: React.FC<LocationFilterProps> = ({
  onLocationFilter,
  initialPostalCode = '',
  initialMaxDistance = 25,
  className = ''
}) => {
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [maxDistance, setMaxDistance] = useState([initialMaxDistance]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    setPostalCode(initialPostalCode);
  }, [initialPostalCode]);

  useEffect(() => {
    setMaxDistance([initialMaxDistance]);
  }, [initialMaxDistance]);

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsCalculating(true);
    try {
      console.log('🔍 Getting user location for filtering...');
      const location = await distanceService.getUserLocation();
      setUserLocation(location);
      setHasLocationPermission(true);
      console.log('📍 User location obtained:', location);
      
      toast({
        title: "Location obtained",
        description: "Using your current location for distance filtering",
      });

      // Trigger filter update
      onLocationFilter({
        userLocation: location,
        postalCode: '',
        maxDistance: maxDistance[0],
        useCurrentLocation: true,
        filteredItems: []
      });

    } catch (error) {
      console.error('❌ Failed to get user location:', error);
      setHasLocationPermission(false);
      toast({
        title: "Location access denied",
        description: "Please allow location access or use postal code search",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate distance to a postal code
  const calculateDistanceToPostalCode = async (targetPostalCode: string) => {
    setIsCalculating(true);
    try {
      console.log('🚀 Calculating distance to postal code:', targetPostalCode);
      
      // Get user location first
      let currentUserLocation = userLocation;
      if (!currentUserLocation) {
        currentUserLocation = await distanceService.getUserLocation();
        setUserLocation(currentUserLocation);
        setHasLocationPermission(true);
      }

      // Get coordinates for the postal code
      let businessLocation: Location;
      try {
        businessLocation = await distanceService.getCoordinatesFromPostalCode(targetPostalCode);
      } catch (error) {
        console.warn('⚠️ Google Geocoding failed, trying fallback...');
        businessLocation = await distanceService.getCoordinatesFromPostalCodeFallback(targetPostalCode);
      }

      // Calculate distance
      const result = await distanceService.calculateDistance(currentUserLocation, businessLocation);
      
      console.log('✅ Distance calculated:', result);
      
      toast({
        title: "Distance calculated",
        description: `Distance to ${targetPostalCode}: ${result.distance}`,
      });

      // Trigger filter update
      onLocationFilter({
        userLocation: currentUserLocation,
        postalCode: targetPostalCode,
        maxDistance: maxDistance[0],
        useCurrentLocation: false,
        filteredItems: []
      });

    } catch (error) {
      console.error('❌ Failed to calculate distance:', error);
      toast({
        title: "Distance calculation failed",
        description: "Please check the postal code and try again",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePostalCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPostalCode = postalCode.trim();
    
    if (!trimmedPostalCode) {
      toast({
        title: "Please enter a postal code",
        description: "Enter a postal code to search for nearby locations",
        variant: "destructive"
      });
      return;
    }

    calculateDistanceToPostalCode(trimmedPostalCode);
  };

  const handleCurrentLocationToggle = (checked: boolean) => {
    setUseCurrentLocation(checked);
    
    if (checked) {
      getCurrentLocation();
    } else {
      setUserLocation(null);
      setHasLocationPermission(false);
      // Clear location filter
      onLocationFilter({
        userLocation: null,
        postalCode: '',
        maxDistance: maxDistance[0],
        useCurrentLocation: false,
        filteredItems: []
      });
    }
  };

  const handleMaxDistanceChange = (value: number[]) => {
    setMaxDistance(value);
    
    // If we have location data, update the filter
    if (userLocation || postalCode) {
      onLocationFilter({
        userLocation,
        postalCode,
        maxDistance: value[0],
        useCurrentLocation,
        filteredItems: []
      });
    }
  };

  const clearLocationFilter = () => {
    setPostalCode('');
    setUserLocation(null);
    setUseCurrentLocation(false);
    setHasLocationPermission(false);
    
    // Clear all location filters
    onLocationFilter({
      userLocation: null,
      postalCode: '',
      maxDistance: maxDistance[0],
      useCurrentLocation: false,
      filteredItems: []
    });

    toast({
      title: "Location filter cleared",
      description: "Showing all results",
    });
  };

  const hasActiveLocationFilter = userLocation || postalCode || useCurrentLocation;

  return (
    <div className={`bg-white rounded-xl border border-border p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Location Filter</h3>
        </div>
        {hasActiveLocationFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocationFilter}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Current Location Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="use-current-location" className="text-sm font-medium">
            Use Current Location
          </Label>
          <p className="text-xs text-muted-foreground">
            Find nearby businesses based on your location
          </p>
        </div>
        <Switch
          id="use-current-location"
          checked={useCurrentLocation}
          onCheckedChange={handleCurrentLocationToggle}
          disabled={isCalculating}
        />
      </div>

      {/* Postal Code Search */}
      {!useCurrentLocation && (
        <form onSubmit={handlePostalCodeSubmit} className="space-y-2">
          <Label htmlFor="postal-code" className="text-sm font-medium">
            Search by Postal Code
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                id="postal-code"
                type="text"
                placeholder="Enter postal code..."
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="pr-8"
                disabled={isCalculating}
              />
              {postalCode && (
                <button
                  type="button"
                  onClick={() => setPostalCode('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="icon" disabled={isCalculating}>
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Distance Range Slider */}
      {(hasLocationPermission || postalCode) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Maximum Distance</Label>
            <Badge variant="secondary">{maxDistance[0]} km</Badge>
          </div>
          <Slider
            value={maxDistance}
            onValueChange={handleMaxDistanceChange}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {hasActiveLocationFilter && (
        <div className="space-y-2">
          {userLocation && (
            <Badge variant="outline" className="w-full justify-center">
              📍 Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </Badge>
          )}
          {postalCode && (
            <Badge variant="outline" className="w-full justify-center">
              📮 Postal Code: {postalCode}
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isCalculating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">
            {useCurrentLocation ? 'Getting your location...' : 'Calculating distance...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationFilter; 