-- Add missing columns to products table
BEGIN;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add active column if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add ticket_medio column if missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ticket_medio numeric;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies (if they don't exist, hard to check existence cleanly in simple SQL block without functions, but create if not exists or replace works)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.products;
CREATE POLICY "Enable read access for authenticated users" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.products;
CREATE POLICY "Enable write access for authenticated users" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
