
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MapDebugInfoProps {
  showDebug?: boolean;
}

const MapDebugInfo: React.FC<MapDebugInfoProps> = ({ showDebug = false }) => {
  if (!showDebug) return null;

  const googleMapsStatus = {
    scriptLoaded: !!document.querySelector('script[src*="maps.googleapis.com"]'),
    apiAvailable: !!window.google?.maps,
    placesAvailable: !!window.google?.maps?.places,
    geometryAvailable: !!(window.google?.maps && (window.google.maps as any).geometry),
  };

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">🐛 Google Maps Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant={googleMapsStatus.scriptLoaded ? "default" : "destructive"}>
            Script: {googleMapsStatus.scriptLoaded ? "Loaded" : "Not Loaded"}
          </Badge>
          <Badge variant={googleMapsStatus.apiAvailable ? "default" : "destructive"}>
            API: {googleMapsStatus.apiAvailable ? "Available" : "Not Available"}
          </Badge>
          <Badge variant={googleMapsStatus.placesAvailable ? "default" : "destructive"}>
            Places: {googleMapsStatus.placesAvailable ? "Available" : "Not Available"}
          </Badge>
          <Badge variant={googleMapsStatus.geometryAvailable ? "default" : "destructive"}>
            Geometry: {googleMapsStatus.geometryAvailable ? "Available" : "Not Available"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
          <div>Window Google: {typeof window.google}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapDebugInfo;
