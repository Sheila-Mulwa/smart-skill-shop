-- Create pending_orders table to track orders awaiting payment confirmation
CREATE TABLE public.pending_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_tracking_id TEXT,
  merchant_reference TEXT NOT NULL UNIQUE,
  total_amount NUMERIC NOT NULL,
  product_ids UUID[] NOT NULL,
  product_amounts NUMERIC[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending orders
CREATE POLICY "Users can view their own pending orders"
ON public.pending_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update pending orders (via edge functions)
CREATE POLICY "Service role can manage pending orders"
ON public.pending_orders
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_pending_orders_merchant_ref ON public.pending_orders(merchant_reference);
CREATE INDEX idx_pending_orders_tracking_id ON public.pending_orders(order_tracking_id);