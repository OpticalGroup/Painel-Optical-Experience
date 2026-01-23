-- =====================================================
-- SCRIPT FINAL: Adicionar TODAS as colunas que o Frontend espera
-- Execute no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- COLUNAS DE HIERARQUIA (usadas por useOriginHierarchy.ts)
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS funnel_id uuid;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS macro_origin_id uuid;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_origin_id uuid;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_variation_id uuid;

-- Colunas de NOME (desnormalizadas para performance)
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS funnel_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS macro_origin_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_origin_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_variation_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS nano_variation_name text;

-- =====================================================
-- COLUNAS DE NÚCLEOS (usadas por useEnrollmentAnalytics.ts)
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS nucleo_id text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS nucleo_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS cohort_name text;

-- =====================================================
-- COLUNAS DE UTM (usadas por useUtmData.ts e outros)
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_page text;

-- =====================================================
-- COLUNAS DE DADOS DO ALUNO
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS zipcode text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS observations text;

-- =====================================================
-- COLUNAS DE INTEGRAÇÃO
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_contact_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_lead_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_proof_url text;

-- =====================================================
-- COLUNAS DE DATAS
-- =====================================================
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS lead_date timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS purchase_date timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- =====================================================
-- TABELAS AUXILIARES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  value jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.csv_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mapping jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  config jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- RLS para tabelas auxiliares
-- =====================================================
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all" ON public.organization_settings;
CREATE POLICY "auth_all" ON public.organization_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_all" ON public.csv_templates;
CREATE POLICY "auth_all" ON public.csv_templates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_all" ON public.integrations;
CREATE POLICY "auth_all" ON public.integrations FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FORÇAR RELOAD DO SCHEMA
-- =====================================================
NOTIFY pgrst, 'reload schema';

COMMIT;

-- =====================================================
-- VERIFICAÇÃO (execute separadamente para confirmar)
-- =====================================================
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'enrollments' ORDER BY ordinal_position;
