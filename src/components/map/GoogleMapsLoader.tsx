
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
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('🔑 Starting to fetch Google Maps API key from Supabase...');
        setIsLoadingKey(true);
        
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        
        console.log('🔑 Edge function response:', { data, error });
        
        if (error) {
          console.error('❌ Error fetching API key from edge function:', error);
          setError(`Failed to load Google Maps API key: ${error.message}`);
          setIsLoadingKey(false);
          return;
        }

        if (!data?.apiKey) {
          console.error('❌ No API key returned from function. Response data:', data);
          setError('Google Maps API key is not configured. Please check your Supabase secrets.');
          setIsLoadingKey(false);
          return;
        }

        console.log('✅ Successfully retrieved Google Maps API key');
        setApiKey(data.apiKey);
        setIsLoadingKey(false);
      } catch (err) {
        console.error('💥 Error calling get-google-maps-key function:', err);
        setError(`Failed to retrieve Google Maps API key: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoadingKey(false);
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey || isLoadingKey) {
      console.log('⏳ Waiting for API key...', { apiKey: !!apiKey, isLoadingKey });
      return;
    }

    console.log('🗺️ Starting Google Maps initialization with API key');

    // Check if already loaded
    if (window.google?.maps) {
      console.log('✅ Google Maps API already loaded');
      setIsLoaded(true);
      return;
    }

    const loadGoogleMaps = () => {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('🔄 Google Maps script already exists, waiting for load...');
        // Wait for existing script to load
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            console.log('✅ Google Maps API loaded from existing script');
            setIsLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkLoaded);
          if (!window.google?.maps) {
            console.error('❌ Timeout waiting for Google Maps API to load');
            setError('Google Maps API failed to load (timeout)');
          }
        }, 15000); // Increased timeout
        return;
      }

      console.log('📜 Creating new Google Maps script tag');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Global callback function
      (window as any).initGoogleMaps = () => {
        console.log('✅ Google Maps API loaded successfully via callback');
        setIsLoaded(true);
      };

      script.onerror = (event) => {
        console.error('❌ Failed to load Google Maps script:', event);
        setError('Failed to load Google Maps API. Please check your API key and internet connection.');
      };

      console.log('📜 Appending Google Maps script to document head');
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Cleanup callback
      delete (window as any).initGoogleMaps;
    };
  }, [apiKey, libraries, isLoadingKey]);

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <details className="mt-2 text-xs">
            <summary>Debug Info</summary>
            <div>API Key Status: {apiKey ? 'Retrieved' : 'Not retrieved'}</div>
            <div>Loading Key: {isLoadingKey ? 'Yes' : 'No'}</div>
            <div>Maps Loaded: {window.google?.maps ? 'Yes' : 'No'}</div>
          </details>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded || !apiKey || isLoadingKey) {
    console.log('⏳ Rendering loading state', { isLoaded, hasApiKey: !!apiKey, isLoadingKey });
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>
          {isLoadingKey ? 'Fetching API key...' : 'Loading Google Maps...'}
        </span>
      </div>
    );
  }

  console.log('✅ Rendering children - Google Maps is ready!');
  return <>{children}</>;
};

export default GoogleMapsLoader;
