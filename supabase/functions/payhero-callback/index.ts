import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AnyRecord = Record<string, any>;

interface PayHeroCallbackResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: number;
  Amount?: number;
  MpesaReceiptNumber?: string;
  Phone?: string;
  ExternalReference?: string;
  Status?: string;
  ResultDesc?: string;
  ChannelID?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PayHero callback received');

    const body: AnyRecord = await req.json();
    console.log('Callback data:', JSON.stringify(body, null, 2));

    // PayHero payloads can vary. Prefer nested `response` if present.
    const response: PayHeroCallbackResponse | undefined = body?.response;

    const externalReference =
      response?.ExternalReference ||
      body?.external_reference ||
      body?.ExternalReference ||
      body?.reference ||
      body?.checkout_request_id ||
      '';

    const resultCode =
      typeof response?.ResultCode === 'number'
        ? response?.ResultCode
        : typeof body?.result_code === 'number'
          ? body?.result_code
          : typeof body?.ResultCode === 'number'
            ? body?.ResultCode
            : undefined;

    const statusRaw =
      response?.Status ||
      (typeof body?.status === 'string' ? body.status : undefined) ||
      body?.Status ||
      '';

    const status = String(statusRaw).toLowerCase();

    const mpesaReceiptNumber =
      response?.MpesaReceiptNumber ||
      body?.provider_reference ||
      body?.mpesa_receipt_number ||
      body?.MpesaReceiptNumber ||
      response?.CheckoutRequestID ||
      body?.checkout_request_id ||
      '';

    const resultDesc =
      response?.ResultDesc ||
      body?.result_description ||
      body?.ResultDesc ||
      '';

    console.log('Parsed callback:', {
      externalReference,
      status,
      resultCode,
      mpesaReceiptNumber,
    });

    if (!externalReference) {
      console.error('Missing external reference in callback');
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received - missing external reference' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuccess =
      resultCode === 0 ||
      status === 'success' ||
      status === 'successful' ||
      status === 'completed' ||
      status === 'ok';

    const isFailed =
      status === 'failed' ||
      status === 'cancelled' ||
      status === 'canceled' ||
      status === 'rejected' ||
      (typeof resultCode === 'number' && resultCode !== 0);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the pending order
    const { data: pendingOrder, error: orderError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('merchant_reference', externalReference)
      .maybeSingle();

    if (orderError) {
      console.error('Error fetching pending order:', orderError.message);
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received - order lookup error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingOrder) {
      console.error('Pending order not found:', externalReference);
      return new Response(
        JSON.stringify({ success: true, message: 'Callback received - order not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pending order:', {
      id: pendingOrder.id,
      user_id: pendingOrder.user_id,
      status: pendingOrder.status,
      product_count: pendingOrder.product_ids?.length || 0,
    });

    if (isSuccess) {
      console.log('Payment successful! Receipt:', mpesaReceiptNumber);

      await supabase
        .from('pending_orders')
        .update({ status: 'completed' })
        .eq('id', pendingOrder.id);

      // Create purchase records for each product (idempotent)
      const productIds: string[] = pendingOrder.product_ids || [];
      const productAmounts: number[] = pendingOrder.product_amounts || [];

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        const amount = productAmounts[i] ?? pendingOrder.total_amount;

        const { data: existingPurchase, error: existingError } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', pendingOrder.user_id)
          .eq('product_id', productId)
          .maybeSingle();

        if (existingError) {
          console.error('Existing purchase lookup error:', existingError.message);
        }

        if (existingPurchase) {
          console.log('Purchase already exists, skipping insert:', existingPurchase.id);
          continue;
        }

        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: pendingOrder.user_id,
            product_id: productId,
            amount,
            payment_method: 'mpesa',
            transaction_id: mpesaReceiptNumber,
          })
          .select('id')
          .single();

        if (purchaseError) {
          console.error('Failed to create purchase record:', purchaseError.message);
        } else {
          console.log('Purchase record created:', purchaseData.id);
        }
      }

    } else if (isFailed) {
      console.log('Payment failed:', resultDesc || status, 'ResultCode:', resultCode);

      await supabase
        .from('pending_orders')
        .update({ status: 'failed' })
        .eq('id', pendingOrder.id);

    } else {
      console.log('Payment status not actionable yet:', { status, resultCode });
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
