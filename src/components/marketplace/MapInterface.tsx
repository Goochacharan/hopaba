
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapInterfaceProps {
  sellerName: string;
  location?: string;
  mapLink?: string | null;
}

const MapInterface: React.FC<MapInterfaceProps> = ({
  sellerName,
  location,
  mapLink
}) => {
  const handleDirections = () => {
    if (mapLink) {
      window.open(mapLink, '_blank');
    } else if (location) {
      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(directionsUrl, '_blank');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shop Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">{sellerName}</p>
            {location && <p className="text-sm">{location}</p>}
            <p className="text-xs mt-2 opacity-75">Click "Get Directions" to view on map</p>
          </div>
        </div>
        {location && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{location}</p>
            <button
              onClick={handleDirections}
              className="text-sm text-primary hover:underline font-medium px-3 py-1 rounded-md hover:bg-primary/10 transition-colors"
            >
              Get Directions
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapInterface;
