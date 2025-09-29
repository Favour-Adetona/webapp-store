-- Enable public access to sales table for receipt viewing
-- This allows the public receipt page to work without authentication

-- Create a policy for public receipt access (read-only)
CREATE POLICY "Public can view sales for receipts" ON public.sales
  FOR SELECT USING (true);

-- Note: This enables public read access to sales data
-- In production, you might want to add additional security measures
-- such as time-based access or encrypted receipt IDs
