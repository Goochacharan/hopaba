
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      console.error('DeepSeek API key is not configured');
      // Instead of throwing an error, just return the original query
      const { query } = await req.json();
      return new Response(
        JSON.stringify({ 
          original: query,
          enhanced: query, // Return the same query
          error: "DeepSeek API key is not configured"
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const { query, context, nearMe } = await req.json();
    
    console.log('Enhancing search query:', query);
    console.log('With context:', context ? 'Provided' : 'None');
    console.log('Near me search:', nearMe ? 'Yes' : 'No');

    // DeepSeek API endpoint
    const url = 'https://api.deepseek.com/v1/chat/completions';

    // Prepare context for in-context learning
    const systemPrompt = `You are an AI assistant that enhances search queries for a local business and events discovery platform.
Your task is to improve the search query by:
1. Identifying intent (looking for restaurants, services, events, specific locations)
2. Expanding on abbreviated or incomplete queries
3. Normalizing location references
4. Adding relevant context that might be missing
5. Consider both business locations and local events in your enhancements
6. Adding search category tags to help categorization (e.g., #yoga, #restaurant, #education)
${nearMe ? '7. Include terms related to proximity and location since the user wants nearby results' : ''}
8. Return ONLY the enhanced search query with appropriate category tags. Do not add any explanation or additional text.

For specialized searches like "yoga classes", ensure the enhanced query contains terms that would match specifically with yoga studios or fitness centers, not general businesses.`;

    // Create messages with context if provided
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Original search query: "${query}"${context ? `\nContext: ${context}` : ''}${nearMe ? '\nThe user is looking for results near their current location.' : ''}` }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",  // Using DeepSeek's chat model
          messages: messages,
          temperature: 0.3,  // Lower temperature for more focused results
          max_tokens: 300
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('DeepSeek API error:', error);
        
        // Return the original query without enhancement if the API fails
        return new Response(
          JSON.stringify({ 
            original: query,
            enhanced: query, // Return the same query when API fails
            error: `DeepSeek API error: ${JSON.stringify(error)}`
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      const data = await response.json();
      console.log('DeepSeek response:', data);
      
      // Extract the enhanced query from the response
      const enhancedQuery = data.choices[0].message.content.trim();
      
      return new Response(
        JSON.stringify({ 
          original: query,
          enhanced: enhancedQuery,
          nearMe: !!nearMe
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      // Return the original query if fetch fails
      return new Response(
        JSON.stringify({ 
          original: query,
          enhanced: query,
          error: `Fetch error: ${fetchError.message}`
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Error in enhance-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
