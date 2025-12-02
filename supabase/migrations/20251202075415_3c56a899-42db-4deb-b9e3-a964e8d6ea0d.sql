-- Drop ALL existing storage policies
DROP POLICY IF EXISTS "Anyone can view product covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view PDFs" ON storage.objects;

-- Create ADMIN-ONLY policies for product-covers bucket
CREATE POLICY "Only admins can upload product covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-covers' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update product covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-covers' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete product covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-covers' AND
  public.has_role(auth.uid(), 'admin')
);

-- Public can view product covers
CREATE POLICY "Public can view product covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-covers');

-- Create ADMIN-ONLY upload/update/delete policies for products-pdfs
CREATE POLICY "Only admins can upload product PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update product PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete product PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

-- Authenticated users can view PDFs (will be enhanced with purchase verification later)
CREATE POLICY "Authenticated users can view PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'products-pdfs');

-- Create purchases table for tracking product purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert purchases
CREATE POLICY "Only admins can insert purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.purchases IS 'Tracks all product purchases for download access verification';
COMMENT ON COLUMN public.purchases.transaction_id IS 'External payment gateway transaction reference';