
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapInterfaceProps {
  businessName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

const MapInterface: React.FC<MapInterfaceProps> = ({ 
  businessName, 
  address, 
  latitude, 
  longitude 
}) => {
  const { toast } = useToast();

  const handleGetDirections = () => {
    let mapsUrl = '';
    
    if (latitude && longitude) {
      // Use coordinates if available
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    } else if (address) {
      // Use address if coordinates not available
      const encodedAddress = encodeURIComponent(`${businessName}, ${address}`);
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    } else {
      // Fallback to business name only
      const encodedName = encodeURIComponent(businessName);
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
    }

    window.open(mapsUrl, '_blank');
    
    toast({
      title: "Opening Directions",
      description: `Getting directions to ${businessName}...`,
      duration: 2000
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{businessName}</h3>
              {address && (
                <p className="text-sm text-muted-foreground">{address}</p>
              )}
            </div>
          </div>
          <Button onClick={handleGetDirections} className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Get Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapInterface;
