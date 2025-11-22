-- FASE 1: Adicionar colunas de integração na tabela enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS kommo_lead_id text,
ADD COLUMN IF NOT EXISTS clicksign_document_id text,
ADD COLUMN IF NOT EXISTS typeform_response_id text,
ADD COLUMN IF NOT EXISTS external_metadata jsonb DEFAULT '{}'::jsonb;

-- Criar índices para performance nas buscas por IDs externos
CREATE INDEX IF NOT EXISTS idx_enrollments_kommo_lead_id ON public.enrollments(kommo_lead_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_clicksign_document_id ON public.enrollments(clicksign_document_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_typeform_response_id ON public.enrollments(typeform_response_id);

-- FASE 5: Criar tabela de logs de integração
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source_system text NOT NULL, -- 'kommo', 'clicksign', 'typeform', etc
  event_type text NOT NULL, -- 'webhook_received', 'sync_sent', 'error', etc
  status text NOT NULL, -- 'success', 'error', 'retry', 'pending'
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  external_id text, -- ID do registro no sistema externo
  payload jsonb, -- Dados completos do evento
  error_message text,
  retry_count integer DEFAULT 0,
  processed_at timestamp with time zone
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_source_system ON public.integration_logs(source_system);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_enrollment_id ON public.integration_logs(enrollment_id);

-- RLS para integration_logs
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view integration logs"
  ON public.integration_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de configurações de integração
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  system_name text UNIQUE NOT NULL, -- 'kommo', 'clicksign', 'typeform'
  enabled boolean DEFAULT false,
  api_key text, -- Criptografado
  webhook_secret text, -- Para validação HMAC
  config jsonb DEFAULT '{}'::jsonb, -- Configurações específicas do sistema
  last_sync_at timestamp with time zone
);

-- RLS para integration_settings
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage integration settings"
  ON public.integration_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registros iniciais para os 3 sistemas
INSERT INTO public.integration_settings (system_name, enabled)
VALUES 
  ('kommo', false),
  ('clicksign', false),
  ('typeform', false)
ON CONFLICT (system_name) DO NOTHING;