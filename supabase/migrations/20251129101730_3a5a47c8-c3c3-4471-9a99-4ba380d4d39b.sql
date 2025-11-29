-- Create storage buckets for products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('products-pdfs', 'products-pdfs', false, 52428800, ARRAY['application/pdf']),
  ('product-covers', 'product-covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  format TEXT DEFAULT 'PDF',
  pages INTEGER,
  level TEXT CHECK (level IN ('beginner', 'advanced', 'all-levels')),
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  pdf_url TEXT NOT NULL,
  cover_url TEXT,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products (anyone can view)
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
USING (true);

-- Only authenticated users can insert products (admin uploads)
CREATE POLICY "Authenticated users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update products
CREATE POLICY "Authenticated users can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);

-- Storage policies for product PDFs (private - only authenticated users can access)
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products-pdfs');

CREATE POLICY "Authenticated users can view PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'products-pdfs');

CREATE POLICY "Authenticated users can update PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products-pdfs');

CREATE POLICY "Authenticated users can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products-pdfs');

-- Storage policies for product covers (public - anyone can view)
CREATE POLICY "Anyone can view product covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-covers');

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-covers');

CREATE POLICY "Authenticated users can update covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-covers');

CREATE POLICY "Authenticated users can delete covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-covers');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_updated_at();