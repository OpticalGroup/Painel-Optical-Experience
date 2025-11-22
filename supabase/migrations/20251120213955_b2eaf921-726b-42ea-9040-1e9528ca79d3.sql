-- Restrict sales representatives table access to only users who can create enrollments
DROP POLICY IF EXISTS "Anyone authenticated can view active sales reps" ON public.sales_representatives;

CREATE POLICY "Only admin/operator/sales can view sales reps"
ON public.sales_representatives
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role) OR
  has_role(auth.uid(), 'sales'::app_role)
);