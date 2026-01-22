-- Fix cohorts FK to reference products table instead of courses
-- The frontend uses products table but FK was pointing to courses table

-- Drop old FK referencing courses
ALTER TABLE public.cohorts DROP CONSTRAINT IF EXISTS cohorts_course_id_fkey;

-- Add new FK referencing products
ALTER TABLE public.cohorts 
ADD CONSTRAINT cohorts_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.products(id) ON DELETE CASCADE;
