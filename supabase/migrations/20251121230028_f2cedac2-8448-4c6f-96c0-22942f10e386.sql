-- Create organization_settings table for whitelabel configuration
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL DEFAULT 'Optical Dental Academy',
  logo_url text,
  primary_color text DEFAULT '#6E66D9', -- Brand Purple
  secondary_color text DEFAULT '#D6CDC8', -- Sand/Gold
  accent_color text DEFAULT '#D6CDC8',
  background_color text DEFAULT '#EDEDED',
  foreground_color text DEFAULT '#242424',
  custom_domain text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Only one organization settings record allowed (single-tenant for now)
CREATE UNIQUE INDEX IF NOT EXISTS one_organization_settings ON public.organization_settings ((true));

-- RLS Policies
CREATE POLICY "Anyone authenticated can view organization settings"
  ON public.organization_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update organization settings"
  ON public.organization_settings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert organization settings"
  ON public.organization_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.organization_settings (organization_name)
VALUES ('Optical Dental Academy')
ON CONFLICT DO NOTHING;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT DO NOTHING;

-- Storage policies for organization logos
CREATE POLICY "Anyone can view organization logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'organization-logos');

CREATE POLICY "Only admins can upload organization logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can update organization logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'organization-logos' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can delete organization logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'organization-logos' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );