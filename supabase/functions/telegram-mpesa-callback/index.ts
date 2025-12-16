import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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

async function sendTelegramMessage(chatId: number, text: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
  return response.json();
}

async function sendDocument(chatId: number, documentUrl: string, caption: string) {
  const response = await fetch(`${TELEGRAM_API}/sendDocument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      document: documentUrl,
      caption,
      parse_mode: 'HTML',
    }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Telegram M-Pesa callback received');
    
    const callback: MpesaCallback = await req.json();
    console.log('Callback data:', JSON.stringify(callback, null, 2));

    const stkCallback = callback.Body.stkCallback;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the telegram order
    const { data: telegramOrder, error: orderError } = await supabase
      .from('telegram_orders')
      .select('*')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (orderError || !telegramOrder) {
      console.error('Telegram order not found:', checkoutRequestId);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found telegram order:', telegramOrder);

    if (resultCode === 0) {
      // Payment successful
      let mpesaReceiptNumber = '';
      
      if (stkCallback.CallbackMetadata?.Item) {
        for (const item of stkCallback.CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') {
            mpesaReceiptNumber = String(item.Value);
            break;
          }
        }
      }

      console.log('Payment successful:', mpesaReceiptNumber);

      // Update telegram order status
      await supabase
        .from('telegram_orders')
        .update({ 
          status: 'completed',
          transaction_id: mpesaReceiptNumber,
        })
        .eq('id', telegramOrder.id);

      // Get product details including PDF URL
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, pdf_url, cover_url')
        .eq('id', telegramOrder.product_id)
        .single();

      if (productError || !product) {
        console.error('Product not found:', telegramOrder.product_id);
        await sendTelegramMessage(telegramOrder.chat_id,
          `✅ Payment successful!\n\n` +
          `Receipt: ${mpesaReceiptNumber}\n\n` +
          `❌ Error retrieving product. Please contact support.`
        );
        return new Response(
          JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate signed URL for PDF (valid for 24 hours)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('products-pdfs')
        .createSignedUrl(product.pdf_url.replace('products-pdfs/', ''), 86400);

      const pdfUrl = signedUrlData?.signedUrl || product.pdf_url;
      
      // Website link to product
      const websiteUrl = `https://syarmfotxrobmrgjatsh.lovable.app/product/${product.id}`;

      // Send success message with download links
      await sendTelegramMessage(telegramOrder.chat_id,
        `🎉 <b>Payment Successful!</b>\n\n` +
        `📦 Product: <b>${telegramOrder.product_title}</b>\n` +
        `💰 Amount: KSh ${telegramOrder.amount.toLocaleString()}\n` +
        `🧾 Receipt: ${mpesaReceiptNumber}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📥 <b>Download your product:</b>\n\n` +
        `1️⃣ <a href="${pdfUrl}">📄 Direct Download (Telegram)</a>\n\n` +
        `2️⃣ <a href="${websiteUrl}">🌐 View on Website</a>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Thank you for your purchase! 🙏\n` +
        `Visit @getyourhacks for more products.`
      );

      // Also update the pending_orders table
      await supabase
        .from('pending_orders')
        .update({ status: 'completed' })
        .eq('order_tracking_id', checkoutRequestId);

    } else {
      // Payment failed
      console.log('Payment failed:', resultDesc);
      
      await supabase
        .from('telegram_orders')
        .update({ status: 'failed' })
        .eq('id', telegramOrder.id);

      await supabase
        .from('pending_orders')
        .update({ status: 'failed' })
        .eq('order_tracking_id', checkoutRequestId);

      await sendTelegramMessage(telegramOrder.chat_id,
        `❌ <b>Payment Failed</b>\n\n` +
        `Reason: ${resultDesc}\n\n` +
        `Please try again by clicking the product link at @getyourhacks`
      );
    }

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
