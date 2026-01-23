-- Create nucleos table
CREATE TABLE IF NOT EXISTS public.nucleos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text,
    color text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nucleos ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.nucleos;
CREATE POLICY "Enable read access for authenticated users" ON public.nucleos
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.nucleos;
CREATE POLICY "Enable write access for authenticated users" ON public.nucleos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add foreign key reference to enrollments if not already present
-- Note: We previously added nucleo_id as text, we might want to cast it or just leave it for now until data migration
-- If we want strict integrity:
-- ALTER TABLE public.enrollments 
-- DROP COLUMN IF EXISTS nucleo_id;
-- ALTER TABLE public.enrollments 
-- ADD COLUMN nucleo_id uuid REFERENCES public.nucleos(id);

-- For now, let's just ensure the table exists so the UI stops breaking.
-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
