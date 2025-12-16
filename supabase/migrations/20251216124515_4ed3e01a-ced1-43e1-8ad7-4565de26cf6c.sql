-- Create telegram_orders table to track Telegram bot purchases
CREATE TABLE public.telegram_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  phone_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  merchant_reference TEXT NOT NULL,
  checkout_request_id TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_orders ENABLE ROW LEVEL SECURITY;

-- Only service role can manage telegram orders (used by edge functions)
CREATE POLICY "Service role can manage telegram orders"
ON public.telegram_orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_telegram_orders_checkout_request_id ON public.telegram_orders(checkout_request_id);
CREATE INDEX idx_telegram_orders_merchant_reference ON public.telegram_orders(merchant_reference);
CREATE INDEX idx_telegram_orders_chat_id ON public.telegram_orders(chat_id);