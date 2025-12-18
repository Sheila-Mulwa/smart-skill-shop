import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayHeroCallback {
  status: string;
  external_reference: string;
  reference?: string;
  amount?: number;
  phone_number?: string;
  provider_reference?: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  result_description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PayHero callback received');
    
    const callback: PayHeroCallback = await req.json();
    console.log('Callback data:', JSON.stringify(callback, null, 2));

    const externalReference = callback.external_reference;
    const status = callback.status?.toLowerCase();
    const mpesaReceiptNumber = callback.provider_reference || callback.checkout_request_id || '';

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
      console.error('Pending order not found:', externalReference);
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pending order:', pendingOrder);

    // Check payment status - PayHero uses "SUCCESS" for successful payments
    if (status === 'success' || status === 'successful' || status === 'completed') {
      console.log('Payment successful:', mpesaReceiptNumber);

      // Update pending order status
      await supabase
        .from('pending_orders')
        .update({ status: 'completed' })
        .eq('id', pendingOrder.id);

      // Create purchase records for each product
      const purchasePromises = pendingOrder.product_ids.map((productId: string, index: number) => 
        supabase.from('purchases').insert({
          user_id: pendingOrder.user_id,
          product_id: productId,
          amount: pendingOrder.product_amounts[index],
          payment_method: 'mpesa',
          transaction_id: mpesaReceiptNumber,
        })
      );

      const results = await Promise.all(purchasePromises);
      
      for (const result of results) {
        if (result.error) {
          console.error('Failed to create purchase record:', result.error);
        }
      }

      console.log('Purchase records created successfully');

    } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
      console.log('Payment failed:', callback.result_description || status);
      
      await supabase
        .from('pending_orders')
        .update({ status: 'failed' })
        .eq('id', pendingOrder.id);

    } else {
      console.log('Payment status:', status, '- No action taken');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Callback processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ success: true, message: 'Callback received' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
