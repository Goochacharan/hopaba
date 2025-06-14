
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'

// These secrets should be configured in your Supabase project settings
const GUPSHUP_API_KEY = Deno.env.get('GUPSHUP_API_KEY')
const GUPSHUP_APP_NAME = Deno.env.get('GUPSHUP_APP_NAME')

// Create an admin client to securely access provider data
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { requestId } = await req.json()
    if (!requestId) {
      throw new Error('requestId is required')
    }

    console.log(`Processing notifications for request ID: ${requestId}`)

    // 1. Fetch the service request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !request) {
      throw new Error(`Service request not found: ${requestError?.message}`)
    }

    // 2. Find providers matching the request's category, subcategory, and city
    const { data: providers, error: rpcError } = await supabaseAdmin.rpc(
      'get_matching_providers_for_request',
      { request_id: requestId }
    )

    if (rpcError) {
      throw new Error(`Could not find matching providers: ${rpcError.message}`)
    }
    
    if (!providers || providers.length === 0) {
      console.log(`No matching providers found for request ${requestId}.`)
      return new Response(JSON.stringify({ message: 'No matching providers to notify.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log(`Found ${providers.length} matching provider(s).`)

    // 3. Get contact details for the matched providers
    const providerIds = providers.map(p => p.provider_id)
    const { data: providerDetails, error: providerError } = await supabaseAdmin
      .from('service_providers')
      .select('id, whatsapp')
      .in('id', providerIds)
      .not('whatsapp', 'is', null)

    if (providerError) {
      throw new Error(`Failed to fetch provider details: ${providerError.message}`)
    }

    // 4. Construct and send the WhatsApp message via Gupshup
    const messageText = `🔔 *New Service Request on Chowkashi!*

A new customer is looking for your services.

📋 *Title:* ${request.title}
🏷️ *Category:* ${request.category}${request.subcategory ? ` > ${request.subcategory}` : ''}
📍 *Location:* ${request.area}, ${request.city}
💰 *Budget:* ${request.budget ? `₹${request.budget}` : 'Not specified'}

📝 *Description:*
${request.description.substring(0, 200)}${request.description.length > 200 ? '...' : ''}

Please check your dashboard to respond.`;
    
    const messagePayload = JSON.stringify({ type: 'text', text: messageText });

    const notificationPromises = providerDetails.map(provider => {
      if (provider.whatsapp) {
        console.log(`Sending notification to WhatsApp number: ${provider.whatsapp}`);
        const gupshupUrl = `https://api.gupshup.io/sm/api/v1/msg`;
        const payload = new URLSearchParams();
        payload.append('channel', 'whatsapp');
        payload.append('source', GUPSHUP_APP_NAME || 'ChowkashiApp');
        payload.append('destination', provider.whatsapp);
        payload.append('message', messagePayload);
        payload.append('src.name', GUPSHUP_APP_NAME || 'ChowkashiApp');

        return fetch(gupshupUrl, {
          method: 'POST',
          headers: {
            'apikey': GUPSHUP_API_KEY || '',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: payload
        });
      }
      return Promise.resolve();
    });

    await Promise.allSettled(notificationPromises);
    console.log(`Finished sending notifications for request ${requestId}.`);

    return new Response(JSON.stringify({ message: 'Notifications sent successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in notify-providers function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
