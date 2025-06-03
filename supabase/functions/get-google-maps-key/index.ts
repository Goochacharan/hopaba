
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('🔑 get-google-maps-key function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Fetching Google Maps API key from Deno environment');
    
    // Get the Google Maps API key from environment/secrets
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    console.log('Environment check:', {
      hasKey: !!googleMapsApiKey,
      keyLength: googleMapsApiKey?.length || 0,
      keyPrefix: googleMapsApiKey?.substring(0, 10) || 'none'
    });
    
    if (!googleMapsApiKey) {
      console.error('❌ Google Maps API key not found in environment variables');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()));
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to Supabase secrets.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Successfully retrieved Google Maps API key from environment');
    
    const response = {
      apiKey: googleMapsApiKey,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending response with API key');
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('💥 Error in get-google-maps-key function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve Google Maps API key',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
