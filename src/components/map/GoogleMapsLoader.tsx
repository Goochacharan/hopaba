
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
  apiKey?: string;
  libraries?: string[];
}

const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({
  children,
  libraries = ['places', 'geometry']
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('Fetching Google Maps API key from Supabase...');
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        if (error) {
          console.error('Error fetching API key:', error);
          setError('Failed to load Google Maps API key. Please check your configuration.');
          return;
        }

        if (!data?.apiKey) {
          console.error('No API key returned from function');
          setError('Google Maps API key is not configured. Please add it to your Supabase secrets.');
          return;
        }

        console.log('Successfully retrieved Google Maps API key');
        setApiKey(data.apiKey);
      } catch (err) {
        console.error('Error calling get-google-maps-key function:', err);
        setError('Failed to retrieve Google Maps API key. Please try again.');
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
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

  if (!isLoaded || !apiKey) {
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
