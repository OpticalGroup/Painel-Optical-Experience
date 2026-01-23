-- Fix Missing Columns in Database
-- Run this in Supabase SQL Editor manually

BEGIN;

-- 1. Fix Hierarchy Tables (Ensure Foreign Keys exist)
ALTER TABLE public.macro_origins 
  ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnels(id);

ALTER TABLE public.micro_origins 
  ADD COLUMN IF NOT EXISTS macro_origin_id uuid REFERENCES public.macro_origins(id);

ALTER TABLE public.micro_variations 
  ADD COLUMN IF NOT EXISTS micro_origin_id uuid REFERENCES public.micro_origins(id);

ALTER TABLE public.nano_variations 
  ADD COLUMN IF NOT EXISTS micro_variation_id uuid REFERENCES public.micro_variations(id);

-- 2. Fix Enrollments Table (Add all potential missing columns used in RPC)
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS zipcode text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS observations text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_contact_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_lead_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS purchase_date timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS lead_date timestamptz;

-- UTMs
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_page text;

-- 3. Reload Schema
NOTIFY pgrst, 'reload schema';

COMMIT;
