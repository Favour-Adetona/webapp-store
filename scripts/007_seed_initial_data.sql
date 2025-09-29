-- Seed initial products data
-- Note: This will only work after users are created through authentication
INSERT INTO public.products (name, category, packaging, price, stock, low_stock_threshold, expiry_date, image) VALUES
  ('Hand Sanitizer', 'Liquids', 'Bottles (Plastic)', 5000, 50, 10, NOW() + INTERVAL '1 year', '/placeholder.svg?height=100&width=100'),
  ('Vitamin C', 'Solids', 'Tablets (strips)', 12000, 30, 5, NOW() + INTERVAL '6 months', '/placeholder.svg?height=100&width=100'),
  ('Moisturizing Cream', 'Semi-Solids/Creams', 'Tubes', 8500, 25, 5, NOW() + INTERVAL '8 months', '/placeholder.svg?height=100&width=100'),
  ('Pain Relief Spray', 'Sprays & Inhalables', 'Aerosol Cans', 15000, 15, 3, NOW() + INTERVAL '4 months', '/placeholder.svg?height=100&width=100'),
  ('Eye Drops', 'Drops & Applicators', 'Droppers', 9000, 8, 10, NOW() + INTERVAL '3 months', '/placeholder.svg?height=100&width=100')
ON CONFLICT DO NOTHING;

-- Seed initial wholesalers data
INSERT INTO public.wholesalers (name, contact, phone, products, expected_delivery, capital_spent) VALUES
  ('MediSupply Inc.', 'contact@medisupply.com', '123-456-7890', ARRAY['Hand Sanitizer', 'Vitamin C'], NOW() + INTERVAL '1 week', 250000),
  ('HealthGoods Distributors', 'orders@healthgoods.com', '987-654-3210', ARRAY['Moisturizing Cream', 'Pain Relief Spray'], NOW() + INTERVAL '2 weeks', 320000)
ON CONFLICT DO NOTHING;
