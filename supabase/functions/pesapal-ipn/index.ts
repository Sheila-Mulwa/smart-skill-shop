import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PesaPalIpnPayload {
  OrderTrackingId: string;
  OrderMerchantReference: string;
  OrderNotificationType: string;
}

// Get PesaPal OAuth token
async function getPesaPalToken(): Promise<string> {
  const consumerKey = Deno.env.get('PESAPAL_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('PESAPAL_CONSUMER_SECRET')!;
  
  const tokenUrl = 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken';
  
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
    throw new Error(`Failed to get PesaPal token: ${response.status}`);
  }
  
  const data = await response.json();
  return data.token;
}

// Get transaction status from PesaPal
async function getTransactionStatus(token: string, orderTrackingId: string): Promise<any> {
  const statusUrl = `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
  
  const response = await fetch(statusUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  console.log('Transaction status:', JSON.stringify(data, null, 2));
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PesaPal IPN received');
    
    // Parse the IPN payload
    const body: PesaPalIpnPayload = await req.json();
    console.log('IPN Payload:', JSON.stringify(body, null, 2));

    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = body;

    if (!OrderTrackingId) {
      console.error('Missing OrderTrackingId in IPN');
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing OrderTrackingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get PesaPal token
    const token = await getPesaPalToken();

    // Get transaction status to verify payment
    const transactionStatus = await getTransactionStatus(token, OrderTrackingId);

    // Check if payment was successful
    // PesaPal status codes: 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed
    const paymentStatus = transactionStatus.payment_status_description;
    const statusCode = transactionStatus.status_code;

    console.log(`Payment status: ${paymentStatus}, Status code: ${statusCode}`);

    // Look up the pending order
    const { data: pendingOrder, error: lookupError } = await supabaseAdmin
      .from('pending_orders')
      .select('*')
      .eq('order_tracking_id', OrderTrackingId)
      .single();

    if (lookupError || !pendingOrder) {
      // Try with merchant reference
      const { data: pendingOrderByRef } = await supabaseAdmin
        .from('pending_orders')
        .select('*')
        .eq('merchant_reference', OrderMerchantReference)
        .single();
      
      if (!pendingOrderByRef) {
        console.error('Pending order not found:', OrderTrackingId, OrderMerchantReference);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use the order found by reference
      Object.assign(pendingOrder || {}, pendingOrderByRef);
    }

    if (statusCode === 1 || paymentStatus === 'Completed') {
      console.log('Payment completed successfully for order:', OrderMerchantReference);

      // Check if purchases already created (avoid duplicates)
      const { data: existingPurchases } = await supabaseAdmin
        .from('purchases')
        .select('id')
        .eq('transaction_id', OrderTrackingId)
        .limit(1);

      if (existingPurchases && existingPurchases.length > 0) {
        console.log('Purchases already created for this transaction');
        return new Response(
          JSON.stringify({ status: 'success', message: 'Already processed' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create purchase records for each product
      const productIds = pendingOrder.product_ids as string[];
      const productAmounts = pendingOrder.product_amounts as number[];
      
      const purchases = productIds.map((productId, index) => ({
        user_id: pendingOrder.user_id,
        product_id: productId,
        amount: productAmounts[index] || 0,
        payment_method: transactionStatus.payment_method || 'pesapal',
        transaction_id: OrderTrackingId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('purchases')
        .insert(purchases);

      if (insertError) {
        console.error('Failed to create purchase records:', insertError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to create purchases' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update pending order status
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', pendingOrder.id);

      console.log('Purchases created successfully:', purchases.length);

      return new Response(
        JSON.stringify({ 
          status: 'success',
          orderTrackingId: OrderTrackingId,
          orderMerchantReference: OrderMerchantReference,
          orderNotificationType: OrderNotificationType,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (statusCode === 2 || paymentStatus === 'Failed') {
      // Update pending order as failed
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('order_tracking_id', OrderTrackingId);

      console.log('Payment failed for order:', OrderMerchantReference);
      return new Response(
        JSON.stringify({ 
          status: 'failed',
          payment_status: paymentStatus,
          orderTrackingId: OrderTrackingId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Payment pending:', paymentStatus);
      return new Response(
        JSON.stringify({ 
          status: 'pending',
          payment_status: paymentStatus,
          orderTrackingId: OrderTrackingId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('IPN processing error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'IPN processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
