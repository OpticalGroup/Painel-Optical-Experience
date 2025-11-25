-- Create integration_settings table
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_name TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read integration settings"
    ON public.integration_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow admins to manage integration settings
CREATE POLICY "Allow admins to manage integration settings"
    ON public.integration_settings
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));


-- Add comment
COMMENT ON TABLE public.integration_settings IS 'Stores system-wide configuration settings for integrations, UTM parameters, and other app settings';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_settings_system_name ON public.integration_settings(system_name);
CREATE INDEX IF NOT EXISTS idx_integration_settings_active ON public.integration_settings(active);
