-- Final DB Fix
-- Run manually in Supabase SQL Editor

BEGIN;

-- 1. Fix Missing 'description' and 'active' columns in Hierarchy Tables
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE public.macro_origins ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.macro_origins ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE public.micro_origins ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.micro_origins ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE public.micro_variations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.micro_variations ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE public.nano_variations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.nano_variations ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 2. Fix 'source' column type mismatch in Enrollments
-- Change source to TEXT to accept any CSV value and avoid Enum errors
ALTER TABLE public.enrollments ALTER COLUMN source TYPE text;

-- 3. Reload Schema
NOTIFY pgrst, 'reload schema';

COMMIT;
