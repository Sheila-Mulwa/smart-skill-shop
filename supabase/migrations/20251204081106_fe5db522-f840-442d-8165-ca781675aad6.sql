-- Storage policy: Allow public to see PDF metadata but not download until verified purchase
-- First, update the products-pdfs bucket policies

-- Remove existing policies if any
DROP POLICY IF EXISTS "Admins can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view PDF metadata" ON storage.objects;
DROP POLICY IF EXISTS "Users can download purchased PDFs" ON storage.objects;

-- Allow admins to upload PDFs
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update/delete PDFs
CREATE POLICY "Admins can manage PDFs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'products-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated users to download PDFs they have purchased
CREATE POLICY "Users can download purchased PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'products-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.products prod ON prod.id = p.product_id
    WHERE p.user_id = auth.uid()
    AND prod.pdf_url = name
  )
);