
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'
];

const LocationSelection = () => {
  const navigate = useNavigate();
  const { enableLocation, isCalculatingLocation, setSelectedCity } = useLocation();
  const { toast } = useToast();
  const [selectedCityOption, setSelectedCityOption] = useState<string>('');
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  const handleCurrentLocation = async () => {
    try {
      await enableLocation();
      toast({
        title: "Location detected",
        description: "Using your current location for nearby results"
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Location access failed",
        description: "Please select a city manually or check location permissions",
        variant: "destructive"
      });
    }
  };

  const handleCitySelection = async () => {
    if (!selectedCityOption) return;
    
    setIsLoadingCity(true);
    // Simulate saving city preference
    setTimeout(() => {
      setSelectedCity(selectedCityOption);
      toast({
        title: "Location set",
        description: `Using ${selectedCityOption} for your search`
      });
      navigate('/');
      setIsLoadingCity(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Choose Your Location</h1>
          <p className="text-amber-700">Help us find the best services near you</p>
        </div>

        {/* Location Options */}
        <Card className="shadow-lg border-amber-200">
          <CardHeader>
            <CardTitle className="text-center text-amber-900">Location Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Location */}
            <Button 
              onClick={handleCurrentLocation} 
              disabled={isCalculatingLocation}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg flex items-center justify-center gap-2"
            >
              {isCalculatingLocation ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              {isCalculatingLocation ? 'Getting Location...' : 'Use Current Location'}
            </Button>

            <div className="text-center text-gray-500 text-sm">or</div>

            {/* City Selection */}
            <div className="space-y-3">
              <Select value={selectedCityOption} onValueChange={setSelectedCityOption}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleCitySelection}
                disabled={!selectedCityOption || isLoadingCity}
                variant="outline" 
                className="w-full border-amber-600 text-amber-600 hover:bg-amber-50 py-3 text-lg"
              >
                {isLoadingCity ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                {isLoadingCity ? 'Setting Location...' : 'Continue with Selected City'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationSelection;
