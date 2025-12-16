import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    contact?: {
      phone_number: string;
      first_name: string;
      user_id?: number;
    };
  };
}

interface UserSession {
  chatId: number;
  productSlug?: string;
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  awaitingPhone: boolean;
  phoneNumber?: string;
}

// In-memory session store (for demo - in production use Redis or database)
const sessions = new Map<number, UserSession>();

async function sendMessage(chatId: number, text: string, options?: Record<string, unknown>) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  const result = await response.json();
  console.log('Send message result:', result);
  return result;
}

async function requestContact(chatId: number, text: string) {
  return sendMessage(chatId, text, {
    reply_markup: {
      keyboard: [[{ text: '📱 Share Phone Number', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

async function removeKeyboard(chatId: number, text: string) {
  return sendMessage(chatId, text, {
    reply_markup: { remove_keyboard: true },
  });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface ProductResult {
  id: string;
  title: string;
  price: number;
  price_usd: number | null;
  description: string;
  category: string;
  pdf_url: string;
}

async function findProductBySlug(supabaseClient: any, slug: string): Promise<ProductResult | null> {
  // First try exact slug match by converting titles to slugs
  const { data: products, error } = await supabaseClient
    .from('products')
    .select('id, title, price, price_usd, description, category, pdf_url');

  if (error) {
    console.error('Error fetching products:', error);
    return null;
  }

  // Find product where slugified title matches
  const product = (products as ProductResult[])?.find((p: ProductResult) => slugify(p.title) === slug);
  return product || null;
}

async function getMpesaToken(): Promise<string> {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!;
  
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);
  
  const response = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    }
  );

  const data = await response.json();
  return data.access_token;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

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

async function initiateSTKPush(
  accessToken: string,
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  const shortcode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  const passkey = Deno.env.get('MPESA_PASSKEY')!;
  const timestamp = getTimestamp();
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const callbackUrl = `${supabaseUrl}/functions/v1/telegram-mpesa-callback`;

  const stkPushData = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  console.log('STK Push request:', JSON.stringify(stkPushData, null, 2));

  const response = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    }
  );

  const result = await response.json();
  console.log('STK Push response:', result);
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const update: TelegramUpdate = await req.json();
    console.log('Telegram update:', JSON.stringify(update, null, 2));

    const message = update.message;
    if (!message) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const contact = message.contact;

    // Get or create session
    let session = sessions.get(chatId) || { chatId, awaitingPhone: false };

    // Handle /start command with product slug
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const productSlug = parts[1];
        console.log('Looking for product with slug:', productSlug);
        
        const product = await findProductBySlug(supabase, productSlug);
        
        if (product) {
          session = {
            chatId,
            productSlug,
            productId: product.id,
            productTitle: product.title,
            productPrice: product.price,
            awaitingPhone: true,
          };
          sessions.set(chatId, session);

          const priceUsd = product.price_usd ? ` (~$${product.price_usd.toFixed(2)})` : '';
          
          await sendMessage(chatId, 
            `🛒 <b>${product.title}</b>\n\n` +
            `${product.description?.substring(0, 200)}...\n\n` +
            `💰 Price: <b>KSh ${product.price.toLocaleString()}</b>${priceUsd}\n\n` +
            `To purchase, please share your M-Pesa phone number:`
          );
          
          await requestContact(chatId, '👇 Tap the button below to share your phone number for M-Pesa payment:');
        } else {
          await sendMessage(chatId, 
            `❌ Sorry, product "${productSlug}" not found.\n\n` +
            `Visit our channel @getyourhacks to see available products.`
          );
        }
      } else {
        // Just /start without product
        await sendMessage(chatId,
          `👋 Welcome to <b>SmartLife Hub</b>!\n\n` +
          `🛍️ Browse our products at @getyourhacks\n\n` +
          `Click on any product link to start your purchase!`
        );
      }
    }
    // Handle contact sharing (phone number)
    else if (contact && session.awaitingPhone && session.productId) {
      const phoneNumber = formatPhoneNumber(contact.phone_number);
      session.phoneNumber = phoneNumber;
      session.awaitingPhone = false;
      sessions.set(chatId, session);

      await removeKeyboard(chatId, 
        `📱 Phone: ${phoneNumber}\n\n` +
        `🔄 Initiating M-Pesa payment for <b>${session.productTitle}</b>...\n\n` +
        `💡 Check your phone for the M-Pesa prompt!`
      );

      // Create pending order for telegram
      const merchantReference = `TG-${Date.now()}-${chatId}`;
      
      const { error: orderError } = await supabase
        .from('pending_orders')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for telegram users
          total_amount: session.productPrice,
          product_ids: [session.productId],
          product_amounts: [session.productPrice],
          merchant_reference: merchantReference,
          status: 'pending',
        });

      if (orderError) {
        console.error('Error creating pending order:', orderError);
        await sendMessage(chatId, '❌ Error processing order. Please try again.');
        return new Response('OK', { status: 200 });
      }

      // Store telegram chat info for callback
      const { error: telegramOrderError } = await supabase
        .from('telegram_orders')
        .insert({
          chat_id: chatId,
          phone_number: phoneNumber,
          product_id: session.productId,
          product_title: session.productTitle,
          amount: session.productPrice,
          merchant_reference: merchantReference,
          status: 'pending',
        });

      if (telegramOrderError) {
        console.error('Error creating telegram order:', telegramOrderError);
      }

      // Initiate M-Pesa STK Push
      try {
        const accessToken = await getMpesaToken();
        const stkResult = await initiateSTKPush(
          accessToken,
          phoneNumber,
          session.productPrice!,
          merchantReference.substring(0, 12),
          `SmartLife Hub - ${session.productTitle?.substring(0, 20)}`
        );

        if (stkResult.ResponseCode === '0') {
          // Update pending order with checkout request ID
          await supabase
            .from('pending_orders')
            .update({ order_tracking_id: stkResult.CheckoutRequestID })
            .eq('merchant_reference', merchantReference);

          await supabase
            .from('telegram_orders')
            .update({ checkout_request_id: stkResult.CheckoutRequestID })
            .eq('merchant_reference', merchantReference);

          await sendMessage(chatId,
            `✅ M-Pesa prompt sent!\n\n` +
            `📱 Enter your M-Pesa PIN on your phone to complete payment.\n\n` +
            `⏳ Waiting for payment confirmation...`
          );
        } else {
          await sendMessage(chatId,
            `❌ Failed to initiate payment: ${stkResult.errorMessage || 'Unknown error'}\n\n` +
            `Please try again or contact support.`
          );
        }
      } catch (mpesaError) {
        console.error('M-Pesa error:', mpesaError);
        await sendMessage(chatId,
          `❌ Payment error. Please try again later.\n\n` +
          `If the problem persists, visit our website: smartlifehub.com`
        );
      }
    }
    // Handle manual phone number input
    else if (session.awaitingPhone && session.productId && /^(\+?254|0)?[17]\d{8}$/.test(text.replace(/\s/g, ''))) {
      const phoneNumber = formatPhoneNumber(text);
      session.phoneNumber = phoneNumber;
      sessions.set(chatId, session);

      // Trigger same payment flow as contact sharing
      await removeKeyboard(chatId,
        `📱 Phone: ${phoneNumber}\n\n` +
        `🔄 Initiating M-Pesa payment...`
      );

      // Same STK push logic...
      const merchantReference = `TG-${Date.now()}-${chatId}`;
      
      await supabase.from('pending_orders').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        total_amount: session.productPrice,
        product_ids: [session.productId],
        product_amounts: [session.productPrice],
        merchant_reference: merchantReference,
        status: 'pending',
      });

      await supabase.from('telegram_orders').insert({
        chat_id: chatId,
        phone_number: phoneNumber,
        product_id: session.productId,
        product_title: session.productTitle,
        amount: session.productPrice,
        merchant_reference: merchantReference,
        status: 'pending',
      });

      try {
        const accessToken = await getMpesaToken();
        const stkResult = await initiateSTKPush(
          accessToken,
          phoneNumber,
          session.productPrice!,
          merchantReference.substring(0, 12),
          `SmartLife Hub - ${session.productTitle?.substring(0, 20)}`
        );

        if (stkResult.ResponseCode === '0') {
          await supabase
            .from('pending_orders')
            .update({ order_tracking_id: stkResult.CheckoutRequestID })
            .eq('merchant_reference', merchantReference);

          await supabase
            .from('telegram_orders')
            .update({ checkout_request_id: stkResult.CheckoutRequestID })
            .eq('merchant_reference', merchantReference);

          await sendMessage(chatId,
            `✅ M-Pesa prompt sent! Enter your PIN to complete payment.`
          );
        } else {
          await sendMessage(chatId, `❌ Payment failed: ${stkResult.errorMessage || 'Try again'}`);
        }
      } catch (err) {
        console.error('M-Pesa error:', err);
        await sendMessage(chatId, `❌ Payment error. Please try again.`);
      }
    }
    // Handle other messages
    else if (session.awaitingPhone) {
      await sendMessage(chatId,
        `Please share your phone number using the button below, or type it in format: 0712345678`
      );
    }
    else {
      await sendMessage(chatId,
        `👋 Welcome to SmartLife Hub!\n\n` +
        `🛍️ Browse products at @getyourhacks and click any product link to purchase.`
      );
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Telegram bot error:', error);
    return new Response('OK', { status: 200 });
  }
});
