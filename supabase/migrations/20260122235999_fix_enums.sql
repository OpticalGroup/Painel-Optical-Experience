-- Remove Enum constraints for smoother imports
-- Run manually in Supabase SQL Editor

BEGIN;

-- 1. Relax 'financial_status' to TEXT
-- This prevents errors like "column is of type enum but expression is of type text"
ALTER TABLE public.enrollments ALTER COLUMN financial_status TYPE text;

-- 2. Relax 'contract_status' to TEXT (Preventing the next likely error)
ALTER TABLE public.enrollments ALTER COLUMN contract_status TYPE text;

-- 3. Relax 'status' in leads table if it exists (Preventing lead import errors)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
        ALTER TABLE public.leads ALTER COLUMN status TYPE text;
    END IF;
END $$;

-- 4. Reload Schema
NOTIFY pgrst, 'reload schema';

COMMIT;
