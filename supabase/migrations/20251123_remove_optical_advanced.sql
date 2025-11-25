-- Simplify to only use Optical Experience course

-- Update any cohorts using Optical Advanced to use Optical Experience
UPDATE public.cohorts
SET course_id = '11111111-1111-1111-1111-111111111111'
WHERE course_id = '22222222-2222-2222-2222-222222222222';

-- Delete Optical Advanced course
DELETE FROM public.courses
WHERE id = '22222222-2222-2222-2222-222222222222';
