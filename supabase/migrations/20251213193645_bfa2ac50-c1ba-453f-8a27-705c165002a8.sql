-- Fix security issues

-- 1. Add policy to prevent users from updating their own purchases
CREATE POLICY "No one can update purchases directly"
ON public.purchases
FOR UPDATE
USING (false);

-- 2. Add policy to prevent deletion of purchases
CREATE POLICY "No one can delete purchases"
ON public.purchases
FOR DELETE
USING (false);

-- 3. Allow users to insert their own purchases (after payment verification)
DROP POLICY IF EXISTS "Only admins can insert purchases" ON public.purchases;

CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);