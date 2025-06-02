
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
  apiKey?: string;
  libraries?: string[];
}

const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({
  children,
  apiKey,
  libraries = ['places', 'geometry']
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if API key is available (from Supabase secrets or prop)
    if (!apiKey) {
      setError('Google Maps API key is not configured. Please add it to your Supabase secrets.');
      return;
    }

    const loadGoogleMaps = () => {
      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for existing script to load
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            setIsLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.google?.maps) {
            setError('Google Maps API failed to load');
          }
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Global callback function
      (window as any).initGoogleMaps = () => {
        console.log('Google Maps API loaded successfully');
        setIsLoaded(true);
      };

      script.onerror = () => {
        setError('Failed to load Google Maps API. Please check your API key and internet connection.');
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup callback
      delete (window as any).initGoogleMaps;
    };
  }, [apiKey, libraries]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading Google Maps...</span>
      </div>
    );
  }

  return <>{children}</>;
};

export default GoogleMapsLoader;
