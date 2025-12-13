-- Remove the client-side INSERT policy for purchases
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;

-- Create a restrictive policy that only allows service role to insert purchases
-- This ensures all purchase records must be created through server-side edge functions
-- after proper payment verification
CREATE POLICY "Only service role can insert purchases"
ON public.purchases
FOR INSERT
TO service_role
WITH CHECK (true);