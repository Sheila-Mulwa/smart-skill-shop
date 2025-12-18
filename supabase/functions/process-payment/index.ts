import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  payment_method: 'mpesa';
  items: Array<{
    product_id: string;
    amount: number;
    quantity: number;
  }>;
  payment_details: {
    phone: string;
  };
}

// Format phone number for PayHero (254XXXXXXXXX format)
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Initiate PayHero STK Push
async function initiatePayHeroSTKPush(
  phoneNumber: string,
  amount: number,
  orderId: string,
  description: string
): Promise<any> {
  const payHeroAuthToken = Deno.env.get('PAYHERO_AUTH_TOKEN')!;
  const channelId = Deno.env.get('PAYHERO_CHANNEL_ID')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // PayHero docs expect: Authorization: Basic YOUR_AUTH_TOKEN
  // Some users save the value with the "Basic " prefix already, so normalize here.
  const payHeroAuthorization = payHeroAuthToken.trim().toLowerCase().startsWith('basic ')
    ? payHeroAuthToken.trim()
    : `Basic ${payHeroAuthToken.trim()}`;
  
  const callbackUrl = `${supabaseUrl}/functions/v1/payhero-callback`;

  const requestBody = {
    amount: Math.ceil(amount),
    phone_number: phoneNumber,
    channel_id: parseInt(channelId),
    provider: "m-pesa",
    external_reference: orderId,
    callback_url: callbackUrl,
    description: description.substring(0, 100),
  };

  console.log('Initiating PayHero STK Push:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
    method: 'POST',
    headers: {
      'Authorization': payHeroAuthorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log('PayHero STK Push response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'PayHero STK Push failed');
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for user:', user.id);

    const body: PaymentRequest = await req.json();
    console.log('Payment request:', JSON.stringify(body, null, 2));

    if (!body.payment_method || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.payment_details.phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required for M-Pesa payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.product_id || item.amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid item in cart' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify products exist and prices match
    const productIds = body.items.map(item => item.product_id);
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, price, title')
      .in('id', productIds);

    if (productError || !products || products.length !== productIds.length) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priceMap = new Map(products.map(p => [p.id, p.price]));

    for (const item of body.items) {
      const actualPrice = priceMap.get(item.product_id);
      const expectedAmount = (actualPrice || 0) * item.quantity;
      if (Math.abs(item.amount - expectedAmount) > 0.01) {
        return new Response(
          JSON.stringify({ error: 'Price verification failed. Please refresh and try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const totalAmount = body.items.reduce((sum, item) => sum + item.amount, 0);

    // Check PayHero credentials
    const payheroAuthToken = Deno.env.get('PAYHERO_AUTH_TOKEN');
    const payheroChannelId = Deno.env.get('PAYHERO_CHANNEL_ID');
    
    if (!payheroAuthToken || !payheroChannelId) {
      console.error('PayHero credentials not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'pending_integration',
          message: 'Payment integration pending setup. Please contact support.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const orderId = `SLH${Date.now()}`;
      const phoneNumber = formatPhoneNumber(body.payment_details.phone);
      const description = `SmartLifeHub Purchase - ${products.map(p => p.title).join(', ')}`.substring(0, 100);

      // Store pending order first
      const { error: pendingError } = await supabaseAdmin
        .from('pending_orders')
        .insert({
          user_id: user.id,
          merchant_reference: orderId,
          total_amount: totalAmount,
          product_ids: productIds,
          product_amounts: body.items.map(item => item.amount),
          status: 'pending',
        });

      if (pendingError) {
        console.error('Failed to store pending order:', pendingError);
      }

      // Initiate PayHero STK Push
      const stkResponse = await initiatePayHeroSTKPush(
        phoneNumber,
        totalAmount,
        orderId,
        description
      );

      // PayHero returns success with reference
      if (stkResponse.success || stkResponse.reference) {
        // Update pending order with PayHero reference
        await supabaseAdmin
          .from('pending_orders')
          .update({ order_tracking_id: stkResponse.reference || stkResponse.id })
          .eq('merchant_reference', orderId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'stk_sent',
            checkout_request_id: stkResponse.reference || stkResponse.id,
            message: 'Please check your phone and enter your M-Pesa PIN to complete payment.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('PayHero STK Push failed:', stkResponse);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: stkResponse.message || stkResponse.error || 'Failed to initiate payment'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (paymentError) {
      console.error('PayHero processing error:', paymentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: paymentError instanceof Error ? paymentError.message : 'Payment processing failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
