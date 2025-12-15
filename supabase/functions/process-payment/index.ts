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

interface PesaPalAuthResponse {
  token: string;
  expiryDate: string;
  error?: any;
  status: string;
  message: string;
}

interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: any;
  status: string;
}

// Get PesaPal OAuth token
async function getPesaPalToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;
  
  // Use sandbox URL for testing - change to live URL in production
  const tokenUrl = 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';
  
  console.log('Fetching PesaPal OAuth token...');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('PesaPal token error:', errorText);
    throw new Error(`Failed to get PesaPal token: ${response.status}`);
  }
  
  const data: PesaPalAuthResponse = await response.json();
  
  if (data.error) {
    console.error('PesaPal token error:', data.error);
    throw new Error(`PesaPal auth failed: ${data.message}`);
  }
  
  console.log('PesaPal token obtained successfully');
  return data.token;
}

// Format phone number for PesaPal (254XXXXXXXXX format)
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

// Register IPN URL with PesaPal (call once to set up)
async function registerIpn(token: string): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const ipnUrl = `${supabaseUrl}/functions/v1/pesapal-ipn`;
  
  const registerUrl = 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN';
  
  const response = await fetch(registerUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'POST',
    }),
  });
  
  const data = await response.json();
  console.log('IPN Registration response:', JSON.stringify(data, null, 2));
  
  if (data.error) {
    throw new Error(`IPN registration failed: ${data.message}`);
  }
  
  return data.ipn_id;
}

// Get registered IPN ID
async function getRegisteredIpnId(token: string): Promise<string> {
  const listUrl = 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/GetIpnList';
  
  const response = await fetch(listUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log('IPN List:', JSON.stringify(data, null, 2));
  
  // If no IPNs registered, register one
  if (!data || data.length === 0) {
    console.log('No IPN registered, registering new one...');
    return await registerIpn(token);
  }
  
  // Return the first active IPN ID
  const activeIpn = data.find((ipn: any) => ipn.ipn_status === 'Active');
  if (activeIpn) {
    return activeIpn.ipn_id;
  }
  
  // Register new if no active found
  return await registerIpn(token);
}

// Submit order to PesaPal
async function submitOrder(
  token: string,
  ipnId: string,
  orderId: string,
  amount: number,
  phoneNumber: string,
  description: string,
  email: string,
  firstName: string
): Promise<PesaPalOrderResponse> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const callbackUrl = `${supabaseUrl}/functions/v1/pesapal-callback`;
  
  const orderUrl = 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest';
  
  const requestBody = {
    id: orderId,
    currency: 'KES',
    amount: amount,
    description: description,
    callback_url: callbackUrl,
    notification_id: ipnId,
    billing_address: {
      email_address: email,
      phone_number: phoneNumber,
      country_code: 'KE',
      first_name: firstName,
      middle_name: '',
      last_name: '',
      line_1: '',
      line_2: '',
      city: '',
      state: '',
      postal_code: '',
      zip_code: '',
    },
  };
  
  console.log('Submitting PesaPal order:', JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(orderUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await response.json();
  console.log('PesaPal order response:', JSON.stringify(data, null, 2));
  
  if (data.error) {
    throw new Error(`Order submission failed: ${data.error.message || data.message}`);
  }
  
  return data as PesaPalOrderResponse;
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

    // Check PesaPal credentials
    const pesapalConsumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY');
    const pesapalConsumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
    
    if (!pesapalConsumerKey || !pesapalConsumerSecret) {
      console.error('PesaPal credentials not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'pending_integration',
          message: 'Payment integration pending setup. Please contact support.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment processing with PesaPal (supports both M-Pesa and cards)
    try {
      // Get OAuth token
      const token = await getPesaPalToken();
      
      // Get or register IPN
      const ipnId = await getRegisteredIpnId(token);
      console.log('Using IPN ID:', ipnId);

      // Generate unique order ID
      const orderId = `SLH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Format phone number if provided
      const phoneNumber = body.payment_details.phone 
        ? formatPhoneNumber(body.payment_details.phone) 
        : '';

      // Create description from product titles
      const productTitles = products.map(p => p.title).join(', ');
      const description = `SmartLife Hub: ${productTitles}`.substring(0, 100);

      // Get user email
      const userEmail = user.email || '';
      const firstName = userEmail.split('@')[0] || 'Customer';

      // Submit order to PesaPal
      const orderResponse = await submitOrder(
        token,
        ipnId,
        orderId,
        totalAmount,
        phoneNumber,
        description,
        userEmail,
        firstName
      );

      if (orderResponse.redirect_url) {
        console.log('PesaPal order created successfully:', orderResponse.order_tracking_id);

        // Store pending order for later verification when IPN confirms payment
        const { error: pendingError } = await supabaseAdmin
          .from('pending_orders')
          .insert({
            user_id: user.id,
            order_tracking_id: orderResponse.order_tracking_id,
            merchant_reference: orderId,
            total_amount: totalAmount,
            product_ids: productIds,
            product_amounts: body.items.map(item => item.amount),
            status: 'pending',
          });

        if (pendingError) {
          console.error('Failed to store pending order:', pendingError);
          // Don't fail the payment - just log the error
        } else {
          console.log('Pending order stored successfully');
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            redirect_url: orderResponse.redirect_url,
            order_tracking_id: orderResponse.order_tracking_id,
            merchant_reference: orderResponse.merchant_reference,
            message: 'Redirecting to payment page...'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error('No redirect URL received from PesaPal');
      }

    } catch (pesapalError) {
      console.error('PesaPal processing error:', pesapalError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: pesapalError instanceof Error ? pesapalError.message : 'Payment processing failed'
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
