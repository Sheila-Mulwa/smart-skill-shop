import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('M-Pesa callback received');
    
    const callback: MpesaCallback = await req.json();
    console.log('Callback data:', JSON.stringify(callback, null, 2));

    const stkCallback = callback.Body.stkCallback;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the pending order
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('pending_orders')
      .select('*')
      .eq('order_tracking_id', checkoutRequestId)
      .single();

    if (orderError || !pendingOrder) {
      console.error('Pending order not found:', checkoutRequestId);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found pending order:', pendingOrder.id);

    if (resultCode === 0) {
      // Payment successful
      let mpesaReceiptNumber = '';
      let transactionDate = '';
      let phoneNumber = '';
      let amount = 0;

      if (stkCallback.CallbackMetadata?.Item) {
        for (const item of stkCallback.CallbackMetadata.Item) {
          switch (item.Name) {
            case 'MpesaReceiptNumber':
              mpesaReceiptNumber = String(item.Value);
              break;
            case 'TransactionDate':
              transactionDate = String(item.Value);
              break;
            case 'PhoneNumber':
              phoneNumber = String(item.Value);
              break;
            case 'Amount':
              amount = Number(item.Value);
              break;
          }
        }
      }

      console.log('Payment successful:', { mpesaReceiptNumber, amount, phoneNumber });

      // Check for existing purchases to prevent duplicates
      const { data: existingPurchases } = await supabaseAdmin
        .from('purchases')
        .select('product_id')
        .eq('user_id', pendingOrder.user_id)
        .eq('transaction_id', mpesaReceiptNumber);

      if (existingPurchases && existingPurchases.length > 0) {
        console.log('Purchases already exist for this transaction');
        return new Response(
          JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create purchase records for each product
      const purchaseRecords = pendingOrder.product_ids.map((productId: string, index: number) => ({
        user_id: pendingOrder.user_id,
        product_id: productId,
        amount: pendingOrder.product_amounts[index],
        payment_method: 'mpesa',
        transaction_id: mpesaReceiptNumber,
      }));

      console.log('Creating purchase records:', purchaseRecords);

      const { error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert(purchaseRecords);

      if (purchaseError) {
        console.error('Failed to create purchase records:', purchaseError);
      } else {
        console.log('Purchase records created successfully');
      }

      // Update pending order status
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'completed' })
        .eq('id', pendingOrder.id);

    } else {
      // Payment failed or cancelled
      console.log('Payment failed:', resultDesc);
      
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'failed' })
        .eq('id', pendingOrder.id);
    }

    // Always return success to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
