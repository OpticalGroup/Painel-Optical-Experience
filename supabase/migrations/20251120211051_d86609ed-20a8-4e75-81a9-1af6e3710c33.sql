-- Create tables for system configuration

-- Sales Representatives table
CREATE TABLE IF NOT EXISTS public.sales_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_representatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_representatives
CREATE POLICY "Anyone authenticated can view active sales reps"
  ON public.sales_representatives
  FOR SELECT
  USING (active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Only admins and operators can manage sales reps"
  ON public.sales_representatives
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- Enrollment Sources table (custom sources beyond the enum)
CREATE TABLE IF NOT EXISTS public.custom_enrollment_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_enrollment_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_enrollment_sources
CREATE POLICY "Anyone authenticated can view active sources"
  ON public.custom_enrollment_sources
  FOR SELECT
  USING (active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage custom sources"
  ON public.custom_enrollment_sources
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_sales_representatives_updated_at
  BEFORE UPDATE ON public.sales_representatives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_enrollment_sources_updated_at
  BEFORE UPDATE ON public.custom_enrollment_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sales representatives
INSERT INTO public.sales_representatives (name, email) VALUES
  ('João Vendedor', 'joao@optical.com'),
  ('Maria Vendedora', 'maria@optical.com'),
  ('Pedro Vendedor', 'pedro@optical.com'),
  ('Ana Vendedora', 'ana@optical.com'),
  ('Carlos Vendedor', 'carlos@optical.com')
ON CONFLICT DO NOTHING;

-- Insert default custom sources (complementing the enum)
INSERT INTO public.custom_enrollment_sources (name, description) VALUES
  ('WhatsApp', 'Lead via WhatsApp Business'),
  ('LinkedIn', 'Contato via LinkedIn'),
  ('Email Marketing', 'Campanha de email')
ON CONFLICT (name) DO NOTHING;