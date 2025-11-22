-- Drop the overly permissive policy that allows all authenticated users to view enrollments
DROP POLICY IF EXISTS "Anyone authenticated can view enrollments" ON public.enrollments;

-- Create a restrictive policy that only allows admins and operators to view enrollments
CREATE POLICY "Only admins and operators can view enrollments"
ON public.enrollments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);