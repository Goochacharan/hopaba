
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN') || '';
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || '';
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') || '';
const GUPSHUP_API_KEY = Deno.env.get('GUPSHUP_API_KEY') || '';
const GUPSHUP_APP_NAME = Deno.env.get('GUPSHUP_APP_NAME') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// User context store to remember conversation context
type UserContext = {
  lastQuery?: string;
  lastRecommendations?: any[];
  preferences?: Record<string, string>;
  lastInteraction: Date;
};

const userContexts: Record<string, UserContext> = {};

// Function to send a WhatsApp message via direct WhatsApp API
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Function to send a message via GUpshup
async function sendGupshupMessage(phoneNumber: string, message: string) {
  try {
    if (!GUPSHUP_API_KEY || !GUPSHUP_APP_NAME) {
      console.error('GUpshup credentials not configured, falling back to direct WhatsApp API');
      return sendWhatsAppMessage(phoneNumber, message);
    }

    // Remove the "+" prefix if present in phoneNumber
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    const response = await fetch(
      `https://api.gupshup.io/sm/api/v1/msg`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': GUPSHUP_API_KEY,
        },
        body: new URLSearchParams({
          'channel': 'whatsapp',
          'source': GUPSHUP_APP_NAME,
          'destination': formattedPhone,
          'message': JSON.stringify({
            'type': 'text',
            'text': message
          }),
          'src.name': GUPSHUP_APP_NAME
        }).toString()
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GUpshup API error:', errorData);
      // Fall back to direct WhatsApp API if GUpshup fails
      return sendWhatsAppMessage(phoneNumber, message);
    }

    return true;
  } catch (error) {
    console.error('Error sending GUpshup message:', error);
    // Fall back to direct WhatsApp API if GUpshup fails
    return sendWhatsAppMessage(phoneNumber, message);
  }
}

// Save user context to maintain conversation history
async function saveUserContext(phoneNumber: string, context: Partial<UserContext>) {
  userContexts[phoneNumber] = {
    ...userContexts[phoneNumber] || { lastInteraction: new Date() },
    ...context,
    lastInteraction: new Date()
  };
  
  // To make context persistent across function invocations, 
  // we could store it in Supabase, but for simplicity we're using in-memory for now
}

// Get user context if available
function getUserContext(phoneNumber: string): UserContext | null {
  const context = userContexts[phoneNumber];
  
  // Check if context exists and is not older than 30 minutes
  if (context && (new Date().getTime() - context.lastInteraction.getTime() < 30 * 60 * 1000)) {
    return context;
  }
  
  return null;
}

// Parse message intent to handle different types of queries
async function parseMessageIntent(message: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
            You are an assistant that categorizes user messages into intents.
            Return a JSON object with the following structure:
            {
              "intent": "one of: recommendation, question, feedback, greeting, help, other",
              "category": "if recommendation, one of: restaurants, cafes, salons, services, health, shopping, education, fitness, or all if none specified",
              "queryRefinement": "a refined search query based on the user's message",
              "userPreferences": {"key": "value"} - any preferences mentioned like veg/non-veg, budget, etc.
            }
            `
          },
          { role: 'user', content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error parsing message intent:', error);
    return {
      intent: "recommendation",
      category: "all",
      queryRefinement: message,
      userPreferences: {}
    };
  }
}

// Function to query recommendations from the database
async function getRecommendations(query: string, category: string = 'all', userContext: UserContext | null = null) {
  try {
    // First, use OpenAI to extract key search terms and categories
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
            You are a search query optimizer. Extract search terms and categories from the user's query.
            Return a JSON object with the following structure:
            {
              "searchTerm": "extracted main search term",
              "category": "one of: restaurants, cafes, salons, services, health, shopping, education, fitness, or all if none specified",
              "attributes": ["any specific attributes mentioned like veg, non-veg, cheap, expensive, etc"]
            }
            ${userContext?.preferences ? `Consider these user preferences: ${JSON.stringify(userContext.preferences)}` : ''}
            `
          },
          { role: 'user', content: query }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });
    
    const extractionData = await extractionResponse.json();
    const extraction = JSON.parse(extractionData.choices[0].message.content);
    
    console.log('Extracted search parameters:', extraction);
    
    // Override extracted category if specified in the parameters
    if (category !== 'all') {
      extraction.category = category;
    }
    
    // Search recommendations based on extracted terms
    const { data: recommendationsData, error } = await supabase.rpc(
      'search_recommendations', 
      { 
        search_query: extraction.searchTerm,
        category_filter: extraction.category === 'all' ? 'all' : extraction.category
      }
    );
    
    if (error) {
      console.error('Supabase search error:', error);
      return 'Sorry, I encountered an error when searching for recommendations. Please try again later.';
    }
    
    // If no results, search more broadly
    if (!recommendationsData || recommendationsData.length === 0) {
      const { data: broadResults } = await supabase
        .from('recommendations')
        .select('*')
        .order('rating', { ascending: false })
        .limit(3);
        
      if (broadResults && broadResults.length > 0) {
        return formatRecommendations(broadResults, query, userContext);
      }
      
      return 'I couldn\'t find any places matching your request. Maybe try a different search term?';
    }
    
    return formatRecommendations(recommendationsData, query, userContext);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return 'Sorry, I encountered an error when searching for recommendations. Please try again later.';
  }
}

// Function to handle general questions
async function handleGeneralQuestion(question: string, userContext: UserContext | null = null) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
            You are a helpful local assistant that answers questions about your city services. 
            Keep answers brief but informative. If you don't know the answer, suggest where 
            they might find that information. Never make up information.
            ${userContext?.lastQuery ? `User's previous query was: "${userContext.lastQuery}"` : ''}
            `
          },
          { role: 'user', content: question }
        ],
        temperature: 0.5,
        max_tokens: 500
      }),
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error handling general question:', error);
    return "I'm sorry, I couldn't process your question right now. Please try asking in a different way.";
  }
}

// Function to format recommendations into a natural language response
async function formatRecommendations(recommendations: any[], originalQuery: string, userContext: UserContext | null = null) {
  try {
    // Take top 3 recommendations
    const topRecs = recommendations.slice(0, 3);
    
    const recDetails = topRecs.map(rec => ({
      name: rec.name,
      category: rec.category,
      rating: rec.rating,
      address: rec.address,
      description: rec.description?.slice(0, 100) + '...',
      phone: rec.phone,
      link: `${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/location/${rec.id}`
    }));

    // Save these recommendations to the user's context
    if (userContext) {
      userContext.lastRecommendations = recDetails;
    }
    
    // Use OpenAI to format a natural language response
    const formatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
            You are a helpful local recommendation assistant. Format the provided recommendations into a natural, 
            conversational response that directly answers the user's query. Include the name, short description, 
            rating, and link for each recommendation. Keep the total response under 1000 characters and make it 
            sound friendly and helpful. Don't mention that you're an AI.
            ${userContext?.lastQuery ? `The user previously asked about: "${userContext.lastQuery}"` : ''}
            `
          },
          {
            role: 'user', 
            content: `User asked: "${originalQuery}"\n\nRecommendations: ${JSON.stringify(recDetails)}`
          }
        ],
        temperature: 0.7,
      }),
    });
    
    const formatData = await formatResponse.json();
    return formatData.choices[0].message.content;
  } catch (error) {
    console.error('Error formatting recommendations:', error);
    
    // Fallback to simple formatting if OpenAI fails
    const simpleResponse = recommendations.slice(0, 3).map(rec => 
      `• ${rec.name} (${rec.rating}★): ${rec.description?.slice(0, 80)}... ${Deno.env.get('APP_URL') || 'https://your-app-url.com'}/location/${rec.id}`
    ).join('\n\n');
    
    return `Here are some recommendations for "${originalQuery}":\n\n${simpleResponse}`;
  }
}

// Generate help message
function generateHelpMessage() {
  return `
*Welcome to Local Assist!* 🌟

I can help you find local recommendations and answer questions about services.

Here's what you can ask me:
• "Find Italian restaurants near me"
• "Best cafes for working"
• "Hair salons with good reviews"
• "Where can I find plumbers?"
• "Good fitness centers in the area"
• "Doctors accepting new patients"

Need something else? Just ask and I'll try to help!
`;
}

// Handle greeting message
function handleGreeting(name?: string) {
  const greetings = [
    `Hello${name ? ' ' + name : ''}! How can I help you today?`,
    `Hi there${name ? ' ' + name : ''}! Looking for recommendations or have questions?`,
    `Hey${name ? ' ' + name : ''}! What are you looking for today?`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)] + 
    "\n\nYou can ask about restaurants, cafes, services, or other local businesses. Or type 'help' to see more options.";
}

// Process incoming WhatsApp messages
async function processWhatsAppMessage(phoneNumber: string, message: string) {
  console.log(`Processing message from ${phoneNumber}: ${message}`);
  
  // Get user context if available
  const userContext = getUserContext(phoneNumber) || {
    lastInteraction: new Date()
  };
  
  // Update context with this query
  userContext.lastQuery = message;
  
  // Process simple commands
  if (message.trim().toLowerCase() === 'help') {
    const helpMessage = generateHelpMessage();
    await sendGupshupMessage(phoneNumber, helpMessage);
    saveUserContext(phoneNumber, userContext);
    return;
  }
  
  // Parse message intent to determine how to respond
  const messageIntent = await parseMessageIntent(message);
  console.log('Message intent:', messageIntent);
  
  // Update user preferences in context
  if (messageIntent.userPreferences && Object.keys(messageIntent.userPreferences).length > 0) {
    userContext.preferences = {
      ...userContext.preferences || {},
      ...messageIntent.userPreferences
    };
  }
  
  let response = '';
  
  // Handle based on intent
  switch (messageIntent.intent) {
    case 'recommendation':
      response = await getRecommendations(messageIntent.queryRefinement, messageIntent.category, userContext);
      break;
      
    case 'question':
      response = await handleGeneralQuestion(message, userContext);
      break;
      
    case 'greeting':
      // Extract name if available
      const nameParts = message.match(/(?:hi|hello|hey)(?:\s+there)?\s+(?:i['']?m\s+)?([a-z]+)/i);
      const name = nameParts && nameParts[1] ? nameParts[1] : undefined;
      response = handleGreeting(name);
      break;
      
    case 'help':
      response = generateHelpMessage();
      break;
      
    case 'feedback':
      response = "Thank you for your feedback! We're always looking to improve our recommendations.";
      break;
      
    default:
      // If we can't determine intent, try as recommendation
      response = await getRecommendations(message, 'all', userContext);
  }
  
  // Save updated context
  saveUserContext(phoneNumber, userContext);
  
  // Send the response back via WhatsApp
  await sendGupshupMessage(phoneNumber, response);
}

// Parse GUpshup webhook data to extract message information
function parseGupshupWebhook(data: any): { phoneNumber: string, message: string } | null {
  try {
    // GUpshup webhook format
    if (data.type === 'message' && data.payload && data.payload.type === 'text') {
      return {
        phoneNumber: data.payload.sender.phone || data.payload.source,
        message: data.payload.payload.text || data.payload.text
      };
    }
    
    // Alternative GUpshup format
    if (data.app === GUPSHUP_APP_NAME && data.type === 'message' && data.message && data.message.type === 'text') {
      return {
        phoneNumber: data.sender.phone || data.source,
        message: data.message.text
      };
    }
    
    console.error('Unrecognized GUpshup webhook format:', data);
    return null;
  } catch (error) {
    console.error('Error parsing GUpshup webhook:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  
  // WhatsApp webhook verification
  if (req.method === 'GET' && url.pathname === '/whatsapp-recommendations') {
    const hubMode = url.searchParams.get('hub.mode');
    const hubVerifyToken = url.searchParams.get('hub.verify_token');
    const hubChallenge = url.searchParams.get('hub.challenge');
    
    if (hubMode === 'subscribe' && hubVerifyToken === WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified');
      return new Response(hubChallenge, { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    
    return new Response('Verification failed', { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
  
  // WhatsApp message webhook processing
  if (req.method === 'POST' && url.pathname === '/whatsapp-recommendations') {
    try {
      const data = await req.json();
      console.log('Received webhook data:', JSON.stringify(data));
      
      // Check if it's GUpshup format first
      const gupshupData = parseGupshupWebhook(data);
      if (gupshupData) {
        // Process the message asynchronously
        EdgeRuntime.waitUntil(processWhatsAppMessage(gupshupData.phoneNumber, gupshupData.message));
        
        return new Response(JSON.stringify({ status: 'processing' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Standard WhatsApp API format
      if (data.object === 'whatsapp_business_account') {
        const entry = data.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        
        if (value?.messages && value.messages.length > 0) {
          const message = value.messages[0];
          
          if (message.type === 'text') {
            const phoneNumber = message.from;
            const messageText = message.text.body;
            
            // Process the message asynchronously
            EdgeRuntime.waitUntil(processWhatsAppMessage(phoneNumber, messageText));
            
            return new Response(JSON.stringify({ status: 'processing' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
      
      return new Response(JSON.stringify({ status: 'no_message_to_process' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // GUpshup specific endpoint (if needed)
  if (req.method === 'POST' && url.pathname === '/gupshup-webhook') {
    try {
      const data = await req.json();
      console.log('Received GUpshup webhook data:', JSON.stringify(data));
      
      const gupshupData = parseGupshupWebhook(data);
      if (gupshupData) {
        // Process the message asynchronously
        EdgeRuntime.waitUntil(processWhatsAppMessage(gupshupData.phoneNumber, gupshupData.message));
        
        return new Response(JSON.stringify({ status: 'processing' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ status: 'no_message_to_process' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error processing GUpshup webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Test endpoint for debugging
  if (req.method === 'POST' && url.pathname === '/test-recommendation') {
    try {
      const { query, phone, provider } = await req.json();
      
      if (!query) {
        return new Response(JSON.stringify({ error: 'Query is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const recommendations = await getRecommendations(query);
      
      // If phone is provided, send recommendations via specified provider or default
      if (phone) {
        if (provider === 'gupshup') {
          await sendGupshupMessage(phone, recommendations);
        } else {
          await sendWhatsAppMessage(phone, recommendations);
        }
      }
      
      return new Response(JSON.stringify({ recommendations }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in test endpoint:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
