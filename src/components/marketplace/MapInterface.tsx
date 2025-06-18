
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapInterfaceProps {
  location?: string;
  mapLink?: string | null;
  businessName?: string;
}

const MapInterface: React.FC<MapInterfaceProps> = ({ 
  location, 
  mapLink, 
  businessName 
}) => {
  const handleOpenMap = () => {
    if (mapLink) {
      window.open(mapLink, '_blank');
    } else if (location) {
      const searchQuery = encodeURIComponent(`${businessName || ''} ${location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
    }
  };

  if (!location && !mapLink) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Shop Location</h3>
              <p className="text-sm text-muted-foreground">{location}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenMap}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            View on Map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapInterface;
