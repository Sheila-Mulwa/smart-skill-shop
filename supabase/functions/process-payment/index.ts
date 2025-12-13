import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  payment_method: 'mpesa' | 'bank';
  items: Array<{
    product_id: string;
    amount: number;
    quantity: number;
  }>;
  payment_details: {
    phone?: string;
    accountName?: string;
    referenceNumber?: string;
  };
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

    // Payment processing
    let paymentVerified = false;
    let transactionId = '';

    switch (body.payment_method) {
      case 'mpesa':
        // TODO: Integrate with Safaricom Daraja API
        // For now, log that this is pending integration
        console.log('M-Pesa payment requested. API integration pending.');
        console.log('Phone:', body.payment_details.phone);
        
        // Check if M-Pesa API credentials are configured
        const mpesaConsumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
        const mpesaConsumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
        
        if (!mpesaConsumerKey || !mpesaConsumerSecret) {
          console.log('M-Pesa credentials not configured');
          return new Response(
            JSON.stringify({ 
              success: false, 
              status: 'pending_integration',
              message: 'M-Pesa integration pending setup. Please contact support at pointresearchlimited@gmail.com to complete your purchase.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // TODO: When credentials are ready, implement STK push here
        // 1. Get OAuth token from Daraja API
        // 2. Send STK push request
        // 3. Handle callback or poll for status
        break;

      case 'bank':
        // Bank transfer - manual verification required
        console.log('Bank transfer payment requested.');
        console.log('Account Name:', body.payment_details.accountName);
        console.log('Reference Number:', body.payment_details.referenceNumber);
        
        // For bank transfers, we log the details and mark as pending verification
        // Admin will manually verify the transfer and update the purchase
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'pending_verification',
            message: 'Thank you! Your bank transfer details have been received. We will verify your payment and send you a download link within 24 hours. For faster processing, contact us at pointresearchlimited@gmail.com with your reference number.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported payment method' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // This code would run after payment verification (when M-Pesa API is integrated)
    if (paymentVerified) {
      const userId = user!.id;
      // Create purchase records using service role
      const purchases = body.items.map(item => ({
        user_id: userId,
        product_id: item.product_id,
        amount: item.amount,
        payment_method: body.payment_method,
        transaction_id: transactionId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('purchases')
        .insert(purchases);

      if (insertError) {
        console.error('Failed to create purchase records:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to record purchase' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Purchase records created successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction_id: transactionId,
          message: 'Payment successful! Your products are ready for download.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default fallback - should not normally reach here
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: 'pending_integration',
        message: 'Payment processing in progress. Please contact support.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Payment processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
