-- Create sellers table (missing from database)
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  nucleo_id UUID,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sellers_name ON public.sellers(name);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON public.sellers(active);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view sellers
CREATE POLICY "Authenticated users can view sellers"
  ON public.sellers FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and operators to manage sellers
CREATE POLICY "Admins and operators can manage sellers"
  ON public.sellers FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'operator'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'operator'::app_role)
  );
