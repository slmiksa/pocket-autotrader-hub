-- Allow public to insert, update and delete subscription codes
-- Note: This is not secure for production. Consider implementing proper authentication.

CREATE POLICY "Allow public to insert subscription codes"
ON public.subscription_codes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public to update subscription codes"
ON public.subscription_codes
FOR UPDATE
USING (true);

CREATE POLICY "Allow public to delete subscription codes"
ON public.subscription_codes
FOR DELETE
USING (true);

-- Allow public to read all subscription codes (not just active ones)
DROP POLICY IF EXISTS "Anyone can validate codes" ON public.subscription_codes;

CREATE POLICY "Allow public to read subscription codes"
ON public.subscription_codes
FOR SELECT
USING (true);