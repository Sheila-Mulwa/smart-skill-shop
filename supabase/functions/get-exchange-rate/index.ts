import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache the exchange rate for 1 hour to avoid too many API calls
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if we have a valid cached rate
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION_MS) {
      console.log('Returning cached exchange rate:', cachedRate.rate);
      return new Response(
        JSON.stringify({ rate: cachedRate.rate, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current exchange rate from a free API
    console.log('Fetching fresh exchange rate...');
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/KES'
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const usdRate = data.rates?.USD;

    if (!usdRate) {
      throw new Error('USD rate not found in response');
    }

    // Cache the rate
    cachedRate = { rate: usdRate, timestamp: Date.now() };
    console.log('Fresh exchange rate:', usdRate);

    return new Response(
      JSON.stringify({ rate: usdRate, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Return a fallback rate if API fails (approximate rate)
    const fallbackRate = 0.0077; // ~1 USD = 130 KES
    return new Response(
      JSON.stringify({ rate: fallbackRate, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
