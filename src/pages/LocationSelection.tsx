
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'
];

const LocationSelection = () => {
  const navigate = useNavigate();
  const { enableLocation, isCalculatingLocation, setSelectedCity, hasLocationPreference } = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingCity, setIsLoadingCity] = useState(false);

  // Filter cities based on search term
  const filteredCities = CITIES.filter(city => 
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCurrentLocation = async () => {
    try {
      await enableLocation();
      toast({
        title: "Location detected",
        description: "Using your current location for nearby results"
      });
      // Navigate back to shop or previous page
      navigate(hasLocationPreference ? -1 : '/');
    } catch (error) {
      toast({
        title: "Location access failed",
        description: "Please select a city manually or check location permissions",
        variant: "destructive"
      });
    }
  };

  const handleCitySelection = async (city: string) => {
    setIsLoadingCity(true);
    // Simulate saving city preference
    setTimeout(() => {
      setSelectedCity(city);
      toast({
        title: "Location set",
        description: `Using ${city} for your search`
      });
      // Navigate back to shop or previous page
      navigate(hasLocationPreference ? -1 : '/');
      setIsLoadingCity(false);
    }, 1000);
  };

  const handleBack = () => {
    if (hasLocationPreference) {
      navigate(-1); // Go back to previous page
    } else {
      // If no location is set, can't go back to shop
      navigate('/welcome');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button 
          onClick={handleBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Select Location</h1>
      </div>

      <div className="px-4 py-6">
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for area, street name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base border-gray-300 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        {/* Current Location Option */}
        <Card className="mb-4 border-amber-200">
          <CardContent className="p-0">
            <Button
              onClick={handleCurrentLocation}
              disabled={isCalculatingLocation}
              variant="ghost"
              className="w-full h-auto p-4 justify-start text-left hover:bg-amber-50"
            >
              <div className="flex items-center w-full">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  {isCalculatingLocation ? (
                    <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                  ) : (
                    <Navigation className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-700">
                    {isCalculatingLocation ? 'Getting Location...' : 'Use your current location'}
                  </p>
                  <p className="text-sm text-amber-600">
                    Enable location to find nearby services
                  </p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* City List */}
        <div className="space-y-1">
          {filteredCities.map((city) => (
            <Card key={city} className="border-gray-200">
              <CardContent className="p-0">
                <Button
                  onClick={() => handleCitySelection(city)}
                  disabled={isLoadingCity}
                  variant="ghost"
                  className="w-full h-auto p-4 justify-start text-left hover:bg-gray-50"
                >
                  <div className="flex items-center w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{city}</p>
                    </div>
                    {isLoadingCity && (
                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results message */}
        {searchTerm && filteredCities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No cities found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelection;
