import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  payment_method: 'mpesa' | 'card';
  items: Array<{
    product_id: string;
    amount: number;
    quantity: number;
  }>;
  payment_details: {
    phone?: string;
    cardNumber?: string;
    cardName?: string;
    expiryDate?: string;
    cvc?: string;
  };
}

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface MpesaStkResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

// Get M-Pesa OAuth token
async function getMpesaToken(): Promise<string> {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
  
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  // Use sandbox URL for testing
  const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  
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
  
  const data: MpesaAuthResponse = await response.json();
  console.log('M-Pesa token obtained successfully');
  return data.access_token;
}

// Format phone number for M-Pesa (must be 254XXXXXXXXX)
function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Generate timestamp in format YYYYMMDDHHmmss
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Initiate M-Pesa STK Push
async function initiateStkPush(
  token: string,
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<MpesaStkResponse> {
  const shortcode = Deno.env.get('MPESA_SHORTCODE')!;
  const passkey = Deno.env.get('MPESA_PASSKEY')!;
  
  const timestamp = generateTimestamp();
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  
  // Use sandbox URL for testing
  const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  
  // For sandbox testing, use a callback URL that just acknowledges
  // In production, this would be your actual callback endpoint
  const callbackUrl = 'https://webhook.site/test'; // Placeholder for sandbox
  
  const requestBody = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount), // M-Pesa requires integer amounts
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };
  
  console.log('Initiating STK Push:', JSON.stringify({
    ...requestBody,
    Password: '[REDACTED]',
  }, null, 2));
  
  const response = await fetch(stkUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const responseData = await response.json();
  console.log('STK Push response:', JSON.stringify(responseData, null, 2));
  
  if (!response.ok) {
    throw new Error(`STK Push failed: ${JSON.stringify(responseData)}`);
  }
  
  return responseData as MpesaStkResponse;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's JWT for auth checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user auth to verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Client with service role to insert purchases
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing payment for user:', user.id);

    // Parse the request body
    const body: PaymentRequest = await req.json();
    console.log('Payment request:', JSON.stringify(body, null, 2));

    // Validate the request
    if (!body.payment_method || !body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate items - ensure product IDs exist and amounts are positive
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

    if (productError || !products) {
      console.error('Failed to fetch products:', productError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify all products exist
    if (products.length !== productIds.length) {
      return new Response(
        JSON.stringify({ error: 'One or more products not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a price map for validation
    const priceMap = new Map(products.map(p => [p.id, p.price]));

    // Verify amounts match actual prices
    for (const item of body.items) {
      const actualPrice = priceMap.get(item.product_id);
      const expectedAmount = (actualPrice || 0) * item.quantity;
      if (Math.abs(item.amount - expectedAmount) > 0.01) {
        console.error(`Price mismatch for product ${item.product_id}: expected ${expectedAmount}, got ${item.amount}`);
        return new Response(
          JSON.stringify({ error: 'Price verification failed. Please refresh and try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate total amount
    const totalAmount = body.items.reduce((sum, item) => sum + item.amount, 0);

    // Payment processing
    switch (body.payment_method) {
      case 'mpesa': {
        // Validate phone number
        if (!body.payment_details.phone) {
          return new Response(
            JSON.stringify({ error: 'Phone number is required for M-Pesa payment' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if M-Pesa API credentials are configured
        const mpesaConsumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
        const mpesaConsumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
        const mpesaShortcode = Deno.env.get('MPESA_SHORTCODE');
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
          // Format phone number
          const formattedPhone = formatPhoneNumber(body.payment_details.phone);
          console.log('Formatted phone number:', formattedPhone);

          // Get OAuth token
          const token = await getMpesaToken();

          // Create account reference from product titles
          const productTitles = products.map(p => p.title).join(', ');
          const accountReference = productTitles.substring(0, 12) || 'SmartLifeHub';
          const transactionDesc = `Payment for ${products.length} product(s)`;

          // Initiate STK Push
          const stkResponse = await initiateStkPush(
            token,
            formattedPhone,
            totalAmount,
            accountReference,
            transactionDesc
          );

          // Check STK Push response
          if (stkResponse.ResponseCode === '0') {
            // STK Push initiated successfully
            // In sandbox, we'll simulate success for testing
            // In production, you would wait for the callback or poll for status
            
            console.log('STK Push initiated successfully:', stkResponse.CheckoutRequestID);

            // For sandbox testing, we'll create the purchase record immediately
            // In production, this should happen only after callback confirmation
            const transactionId = stkResponse.CheckoutRequestID;
            
            // Create purchase records using service role
            const purchases = body.items.map(item => ({
              user_id: user.id,
              product_id: item.product_id,
              amount: item.amount,
              payment_method: 'mpesa',
              transaction_id: transactionId,
            }));

            const { error: insertError } = await supabaseAdmin
              .from('purchases')
              .insert(purchases);

            if (insertError) {
              console.error('Failed to create purchase records:', insertError);
              return new Response(
                JSON.stringify({ error: 'Payment recorded but failed to save purchase. Please contact support.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            console.log('Purchase records created successfully');

            return new Response(
              JSON.stringify({ 
                success: true, 
                transaction_id: transactionId,
                checkout_request_id: stkResponse.CheckoutRequestID,
                message: stkResponse.CustomerMessage || 'Please check your phone and enter your M-Pesa PIN to complete payment.'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            // STK Push failed
            console.error('STK Push failed with response code:', stkResponse.ResponseCode);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: stkResponse.ResponseDescription || 'Failed to initiate M-Pesa payment'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (mpesaError) {
          console.error('M-Pesa processing error:', mpesaError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: mpesaError instanceof Error ? mpesaError.message : 'M-Pesa payment failed'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'card':
        // Card payment processing
        console.log('Card payment requested.');
        console.log('Card Name:', body.payment_details.cardName);
        // Note: In production, never log full card numbers
        console.log('Card ending:', body.payment_details.cardNumber?.slice(-4));
        
        // TODO: Integrate with a payment gateway (e.g., Flutterwave, Paystack)
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'pending_integration',
            message: 'Card payment integration is being set up. Please use M-Pesa to complete your purchase.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported payment method' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
