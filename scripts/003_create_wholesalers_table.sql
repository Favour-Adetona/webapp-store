-- Create wholesalers table for supplier management
CREATE TABLE IF NOT EXISTS public.wholesalers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  phone TEXT NOT NULL,
  products TEXT[] NOT NULL DEFAULT '{}',
  expected_delivery TIMESTAMP WITH TIME ZONE,
  capital_spent DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (capital_spent >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Enable RLS
ALTER TABLE public.wholesalers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All authenticated users can manage wholesalers
CREATE POLICY "All users can view wholesalers" ON public.wholesalers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert wholesalers" ON public.wholesalers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Authenticated users can update wholesalers" ON public.wholesalers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete wholesalers" ON public.wholesalers
  FOR DELETE USING (auth.uid() IS NOT NULL);
