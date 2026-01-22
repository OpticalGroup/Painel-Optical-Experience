-- Sync products table with courses table
-- The frontend uses 'products' table but cohorts FK references 'courses' table
-- This ensures the same ID exists in both tables

-- First, ensure products table exists and insert Optical Experience
INSERT INTO public.products (id, name)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Optical Experience'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
