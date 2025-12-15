import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('PesaPal callback received');
    
    // Get URL parameters
    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const orderMerchantReference = url.searchParams.get('OrderMerchantReference');

    console.log('Callback params:', { orderTrackingId, orderMerchantReference });

    // Get the app URL - use the actual Lovable app URL
    const appUrl = Deno.env.get('APP_URL') || 'https://wpczgwxsriezaubncuom.lovable.app';

    // Redirect back to the app with payment status
    // The app will handle checking the payment status
    const redirectUrl = `${appUrl}/checkout?payment=success&order=${orderTrackingId}`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    
    const appUrl = Deno.env.get('APP_URL') || 'https://wpczgwxsriezaubncuom.lovable.app';
    const redirectUrl = `${appUrl}/checkout?payment=error`;

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });
  }
});
