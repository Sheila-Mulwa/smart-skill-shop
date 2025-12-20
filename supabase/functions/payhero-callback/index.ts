import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayHeroCallbackResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  Amount: number;
  MpesaReceiptNumber: string;
  Phone: string;
  ExternalReference: string;
  Status: string;
  ResultDesc: string;
  ServiceWalletBalance: number;
  PaymentWalletBalance: number;
  ChannelID: number;
}

interface PayHeroCallback {
  status: boolean;
  response: PayHeroCallbackResponse;
  forward_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PayHero callback received');
    
    const callback: PayHeroCallback = await req.json();
    console.log('Callback data:', JSON.stringify(callback, null, 2));

    // PayHero sends status as boolean and details in response object
    const paymentResponse = callback.response;
    if (!paymentResponse) {
      console.error('No response object in callback');
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received but no response data' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalReference = paymentResponse.ExternalReference;
    const resultCode = paymentResponse.ResultCode;
    const status = paymentResponse.Status?.toLowerCase();
    const mpesaReceiptNumber = paymentResponse.MpesaReceiptNumber || '';

    console.log('Processing payment - Reference:', externalReference, 'Status:', status, 'ResultCode:', resultCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the pending order
    const { data: pendingOrder, error: orderError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('merchant_reference', externalReference)
      .single();

    if (orderError || !pendingOrder) {
      console.error('Pending order not found:', externalReference, orderError?.message);
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received - order not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pending order:', pendingOrder.id, 'User:', pendingOrder.user_id);

    // Check payment status - ResultCode 0 means success
    if (resultCode === 0 || status === 'success' || status === 'successful' || status === 'completed') {
      console.log('Payment successful! Receipt:', mpesaReceiptNumber);

      // Update pending order status
      const { error: updateError } = await supabase
        .from('pending_orders')
        .update({ status: 'completed' })
        .eq('id', pendingOrder.id);

      if (updateError) {
        console.error('Failed to update pending order:', updateError.message);
      }

      // Create purchase records for each product
      console.log('Creating purchase records for', pendingOrder.product_ids.length, 'products');
      
      for (let i = 0; i < pendingOrder.product_ids.length; i++) {
        const productId = pendingOrder.product_ids[i];
        const amount = pendingOrder.product_amounts[i];
        
        console.log('Inserting purchase - Product:', productId, 'Amount:', amount, 'User:', pendingOrder.user_id);
        
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: pendingOrder.user_id,
            product_id: productId,
            amount: amount,
            payment_method: 'mpesa',
            transaction_id: mpesaReceiptNumber,
          })
          .select()
          .single();

        if (purchaseError) {
          console.error('Failed to create purchase record:', purchaseError.message);
        } else {
          console.log('Purchase record created:', purchaseData.id);
        }
      }

      console.log('All purchase records created successfully');

    } else if (status === 'failed' || status === 'cancelled' || status === 'rejected' || resultCode !== 0) {
      console.log('Payment failed:', paymentResponse.ResultDesc || status, 'ResultCode:', resultCode);
      
      await supabase
        .from('pending_orders')
        .update({ status: 'failed' })
        .eq('id', pendingOrder.id);

    } else {
      console.log('Unknown payment status:', status, 'ResultCode:', resultCode);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ success: true, message: 'Callback received with error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
