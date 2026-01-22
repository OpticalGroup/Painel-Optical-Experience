-- Fix: Insert seed data for courses if they don't exist
-- This ensures the foreign key constraint is satisfied when creating cohorts

INSERT INTO public.courses (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Optical Experience', 'Curso imersivo de óptica premium'),
  ('00000000-0000-0000-0000-000000000002', 'Dental Excellence', 'Curso de excelência odontológica')
ON CONFLICT (id) DO NOTHING;
