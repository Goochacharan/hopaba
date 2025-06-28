
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, ArrowLeft, Search, Loader2, Hash } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal'
];

const LocationSelection = () => {
  const navigate = useNavigate();
  const { enableLocation, isCalculatingLocation, setSelectedCity, setSelectedPostalCode, hasLocationPreference, locationDisplayName } = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [isLoadingPinCode, setIsLoadingPinCode] = useState(false);
  const [selectedCityFromDropdown, setSelectedCityFromDropdown] = useState<string>('');

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
      if (hasLocationPreference) {
        navigate(-1);
      } else {
        navigate('/');
      }
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
      if (hasLocationPreference) {
        navigate(-1);
      } else {
        navigate('/');
      }
      setIsLoadingCity(false);
    }, 1000);
  };

  const handlePinCodeSubmit = async () => {
    if (!pinCode.trim()) {
      toast({
        title: "Invalid PIN code",
        description: "Please enter a valid 6-digit PIN code",
        variant: "destructive"
      });
      return;
    }

    // Validate PIN code format (6 digits)
    if (!/^\d{6}$/.test(pinCode)) {
      toast({
        title: "Invalid PIN code",
        description: "PIN code must be exactly 6 digits",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingPinCode(true);
    // Simulate saving postal code preference
    setTimeout(() => {
      setSelectedPostalCode(pinCode);
      toast({
        title: "Location set",
        description: `Using PIN ${pinCode} for your search`
      });
      // Navigate back to shop or previous page
      if (hasLocationPreference) {
        navigate(-1);
      } else {
        navigate('/');
      }
      setIsLoadingPinCode(false);
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

  // Get the display text for current location button
  const getCurrentLocationText = () => {
    if (isCalculatingLocation) {
      return 'Getting Location...';
    }
    if (locationDisplayName) {
      return locationDisplayName;
    }
    return 'Use your current location';
  };

  const getCurrentLocationDescription = () => {
    if (isCalculatingLocation) {
      return 'Please wait...';
    }
    if (locationDisplayName) {
      return 'Current location detected';
    }
    return 'Enable location to find nearby services';
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
                    {getCurrentLocationText()}
                  </p>
                  <p className="text-sm text-amber-600">
                    {getCurrentLocationDescription()}
                  </p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* PIN Code Option */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Enter PIN Code</p>
                <p className="text-sm text-gray-600">Set location using postal code</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter 6-digit PIN code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                maxLength={6}
              />
              <Button
                onClick={handlePinCodeSubmit}
                disabled={isLoadingPinCode || pinCode.length !== 6}
                className="px-4 h-10"
              >
                {isLoadingPinCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Set'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* City Selection Dropdown */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <MapPin className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Select City</p>
                <p className="text-sm text-gray-600">Choose from popular cities</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCityFromDropdown} onValueChange={setSelectedCityFromDropdown}>
                <SelectTrigger className="flex-1 h-10 bg-white border-gray-300 focus:border-gray-500 focus:ring-gray-500">
                  <SelectValue placeholder="Choose a city" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60">
                  {CITIES.map((city) => (
                    <SelectItem 
                      key={city} 
                      value={city}
                      className="hover:bg-gray-50 focus:bg-gray-50"
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => selectedCityFromDropdown && handleCitySelection(selectedCityFromDropdown)}
                disabled={isLoadingCity || !selectedCityFromDropdown}
                className="px-4 h-10"
              >
                {isLoadingCity ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Set'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No results message for search */}
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
