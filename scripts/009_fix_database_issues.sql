-- Fix any potential database issues and ensure all tables are properly set up

-- Ensure sales table has the correct structure
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'Unknown';

-- Ensure wholesalers table has proper nullable fields
ALTER TABLE public.wholesalers 
ALTER COLUMN expected_delivery DROP NOT NULL,
ALTER COLUMN capital_spent SET DEFAULT 0;

-- Ensure products table has proper nullable expiry_date
ALTER TABLE public.products 
ALTER COLUMN expiry_date DROP NOT NULL;

-- Update any existing sales that might have missing user_name
UPDATE public.sales 
SET user_name = 'System User' 
WHERE user_name IS NULL OR user_name = '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_wholesalers_expected_delivery ON public.wholesalers(expected_delivery);

-- Ensure RLS policies are properly set
-- Sales table policies
DROP POLICY IF EXISTS "All users can view sales" ON public.sales;
CREATE POLICY "All users can view sales" ON public.sales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Products table policies  
DROP POLICY IF EXISTS "All users can view products" ON public.products;
CREATE POLICY "All users can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Wholesalers table policies
DROP POLICY IF EXISTS "All users can view wholesalers" ON public.wholesalers;
CREATE POLICY "All users can view wholesalers" ON public.wholesalers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage wholesalers" ON public.wholesalers;
CREATE POLICY "Authenticated users can manage wholesalers" ON public.wholesalers FOR ALL USING (auth.role() = 'authenticated');
