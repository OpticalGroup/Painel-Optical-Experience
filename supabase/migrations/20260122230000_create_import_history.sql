-- Create csv_import_history table
CREATE TABLE IF NOT EXISTS public.csv_import_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_by UUID REFERENCES auth.users(id),
  user_email TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  total_students INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  cohorts_affected TEXT[],
  file_name TEXT,
  import_type TEXT,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.csv_import_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own import history"
  ON public.csv_import_history FOR SELECT
  TO authenticated
  USING (auth.uid() = imported_by);

CREATE POLICY "Users can insert their own import history"
  ON public.csv_import_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = imported_by);

CREATE POLICY "Admins can view all import history"
  ON public.csv_import_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
