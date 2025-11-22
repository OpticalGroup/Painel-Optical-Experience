-- Create table for CSV import history
CREATE TABLE public.csv_import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  total_students integer NOT NULL DEFAULT 0,
  successful_imports integer NOT NULL DEFAULT 0,
  failed_imports integer NOT NULL DEFAULT 0,
  cohorts_affected text[] NOT NULL DEFAULT '{}',
  file_name text,
  import_type text NOT NULL DEFAULT 'manual',
  notes text
);

-- Enable RLS
ALTER TABLE public.csv_import_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and operators can view all import history
CREATE POLICY "Admins and operators can view import history"
ON public.csv_import_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'operator'::app_role)
);

-- Policy: Only the system can insert import records
CREATE POLICY "Authenticated users can create import records"
ON public.csv_import_history
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for performance
CREATE INDEX idx_csv_import_history_imported_at ON public.csv_import_history(imported_at DESC);
CREATE INDEX idx_csv_import_history_imported_by ON public.csv_import_history(imported_by);