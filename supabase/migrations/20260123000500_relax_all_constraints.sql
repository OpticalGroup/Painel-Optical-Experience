-- RELAX ALL CONSTRAINTS (Prevent further import errors)
-- Run manually in Supabase SQL Editor

BEGIN;

-- 1. CPF and Personal Info
ALTER TABLE public.enrollments ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN email DROP NOT NULL;

-- 2. Business Logic Fields
ALTER TABLE public.enrollments ALTER COLUMN sales_rep DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN payment_amount DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN payment_details DROP NOT NULL;

-- 3. Status Fields (Ensure Type Text + Nullable)
ALTER TABLE public.enrollments ALTER COLUMN financial_status TYPE text;
ALTER TABLE public.enrollments ALTER COLUMN financial_status DROP NOT NULL;

ALTER TABLE public.enrollments ALTER COLUMN contract_status TYPE text;
ALTER TABLE public.enrollments ALTER COLUMN contract_status DROP NOT NULL;

-- 4. Location
ALTER TABLE public.enrollments ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN state DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN zipcode DROP NOT NULL;

-- 5. Product & Source
ALTER TABLE public.enrollments ALTER COLUMN product_name DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN source DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN source TYPE text;

-- 6. Hierarchy Foreign Keys (Make nullable to prevent failure if origin matches fail)
ALTER TABLE public.enrollments ALTER COLUMN funnel_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN macro_origin_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN micro_origin_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN micro_variation_id DROP NOT NULL;

-- Reload Schema
NOTIFY pgrst, 'reload schema';

COMMIT;
