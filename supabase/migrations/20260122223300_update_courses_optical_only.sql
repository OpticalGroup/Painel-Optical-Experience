-- Remove Dental Excellence course and update Optical Experience
-- Approved by user on 2026-01-22

-- Remove Dental Excellence course (cascades to cohorts and enrollments)
DELETE FROM public.courses 
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Update Optical Experience with correct info
UPDATE public.courses 
SET 
  name = 'Optical Experience',
  description = 'Curso presencial de 4 dias em Salvador - BA',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001';
