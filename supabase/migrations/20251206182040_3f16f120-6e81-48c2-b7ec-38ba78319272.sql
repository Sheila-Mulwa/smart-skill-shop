-- Remove any existing public access policies on products-pdfs bucket
DROP POLICY IF EXISTS "Allow public read access on products-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read products-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for products-pdfs" ON storage.objects;

-- Create strict RLS policies for products-pdfs bucket
-- Only allow service role (edge functions) and admins to access PDFs directly

-- Policy: Admins can upload PDFs
CREATE POLICY "Admins can upload to products-pdfs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update PDFs
CREATE POLICY "Admins can update products-pdfs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete PDFs
CREATE POLICY "Admins can delete from products-pdfs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'products-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- No SELECT policy for authenticated users - they must use the edge function
-- The edge function uses the service role which bypasses RLS