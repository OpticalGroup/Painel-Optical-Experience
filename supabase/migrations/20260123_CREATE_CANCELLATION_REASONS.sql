-- Create cancellation_reasons table
CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cancellation_reasons;
CREATE POLICY "Enable read access for authenticated users" ON public.cancellation_reasons FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.cancellation_reasons;
CREATE POLICY "Enable write access for authenticated users" ON public.cancellation_reasons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default reasons
INSERT INTO public.cancellation_reasons (name, active) VALUES
('Financeiro / Sem budget', true),
('Horário incompatível / Agenda', true),
('Problema de saúde', true),
('Mudança de cidade/país', true),
('Optou por concorrente', true),
('Não gostou da metodologia', true),
('Problemas pessoais/familiares', true),
('Empresa cancelou subsídio', true),
('Achou caro / Custo-benefício', true),
('Outro', true)
ON CONFLICT DO NOTHING;

-- Reload schema
NOTIFY pgrst, 'reload schema';
