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

// Cache token to reduce latency
let cachedToken: { token: string; expiresAt: number } | null = null;

// Get M-Pesa OAuth token
async function getMpesaToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
  
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  // Production URL
  const tokenUrl = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  console.log('Fetching M-Pesa OAuth token...');

  const response = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('M-Pesa token error:', errorText);
    throw new Error(`Failed to get M-Pesa token: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache for 50 minutes (token is valid for 1 hour)
  cachedToken = { 
    token: data.access_token, 
    expiresAt: Date.now() + 50 * 60 * 1000 
  };

  console.log('M-Pesa token obtained successfully');
  return data.access_token;
}

// Format phone number for M-Pesa (254XXXXXXXXX format)
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

// Generate timestamp in format YYYYMMDDHHmmss
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Initiate STK Push
async function initiateSTKPush(
  token: string,
  phoneNumber: string,
  amount: number,
  orderId: string,
  description: string
): Promise<any> {
  // Use production Paybill and Account Number for bank settlement
  const shortcode = Deno.env.get('MPESA_PAYBILL') || Deno.env.get('MPESA_SHORTCODE')!;
  const passkey = Deno.env.get('MPESA_PASSKEY')!;
  const accountNumber = Deno.env.get('MPESA_ACCOUNT_NUMBER') || orderId;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  const timestamp = getTimestamp();
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

  const requestBody = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount), // M-Pesa requires whole numbers
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountNumber, // Your bank account number
    TransactionDesc: description.substring(0, 13), // Max 13 chars
  };

  console.log('Initiating STK Push with Paybill:', shortcode, 'Account:', accountNumber);

  // Production URL
  const response = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log('STK Push response:', JSON.stringify(data, null, 2));

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

    // Check M-Pesa credentials
    const mpesaConsumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const mpesaConsumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const mpesaShortcode = Deno.env.get('MPESA_PAYBILL') || Deno.env.get('MPESA_SHORTCODE');
    const mpesaPasskey = Deno.env.get('MPESA_PASSKEY');
    
    if (!mpesaConsumerKey || !mpesaConsumerSecret || !mpesaShortcode || !mpesaPasskey) {
      console.error('M-Pesa credentials not fully configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'pending_integration',
          message: 'M-Pesa integration pending setup. Please contact support.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const token = await getMpesaToken();
      
      const orderId = `SLH${Date.now()}`;
      const phoneNumber = formatPhoneNumber(body.payment_details.phone);
      
      const description = 'SmartLifeHub';

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

      // Initiate STK Push
      const stkResponse = await initiateSTKPush(
        token,
        phoneNumber,
        totalAmount,
        orderId,
        description
      );

      if (stkResponse.ResponseCode === '0') {
        // Update pending order with checkout request ID
        await supabaseAdmin
          .from('pending_orders')
          .update({ order_tracking_id: stkResponse.CheckoutRequestID })
          .eq('merchant_reference', orderId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            status: 'stk_sent',
            checkout_request_id: stkResponse.CheckoutRequestID,
            merchant_request_id: stkResponse.MerchantRequestID,
            message: 'Please check your phone and enter your M-Pesa PIN to complete payment.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('STK Push failed:', stkResponse);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: stkResponse.errorMessage || stkResponse.ResponseDescription || 'Failed to initiate payment'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (mpesaError) {
      console.error('M-Pesa processing error:', mpesaError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: mpesaError instanceof Error ? mpesaError.message : 'Payment processing failed'
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
