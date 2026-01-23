-- =====================================================
-- SCRIPT DE RECUPERAÇÃO COMPLETA DO BANCO DE DADOS
-- Execute este script no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: ESTRUTURA DE TABELAS BASE
-- =====================================================

-- 1.1 Garantir tabela products existe
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  ticket_medio numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar colunas que podem estar faltando
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ticket_medio numeric DEFAULT 0;

-- 1.2 Inserir produto padrão
INSERT INTO public.products (id, name, description, active) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Optical Experience', 'Curso presencial de 4 dias em Salvador - BA', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 1.3 Garantir tabela courses existe (para compatibilidade)
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.courses (id, name, description) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Optical Experience', 'Curso presencial de 4 dias em Salvador - BA')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =====================================================
-- PARTE 2: TABELAS DE HIERARQUIA
-- =====================================================

-- 2.1 Funnels
CREATE TABLE IF NOT EXISTS public.funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 2.2 Macro Origins
CREATE TABLE IF NOT EXISTS public.macro_origins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid REFERENCES public.funnels(id),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.macro_origins ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnels(id);
ALTER TABLE public.macro_origins ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.macro_origins ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 2.3 Micro Origins
CREATE TABLE IF NOT EXISTS public.micro_origins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  macro_origin_id uuid REFERENCES public.macro_origins(id),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.micro_origins ADD COLUMN IF NOT EXISTS macro_origin_id uuid REFERENCES public.macro_origins(id);
ALTER TABLE public.micro_origins ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.micro_origins ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 2.4 Micro Variations
CREATE TABLE IF NOT EXISTS public.micro_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_origin_id uuid REFERENCES public.micro_origins(id),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.micro_variations ADD COLUMN IF NOT EXISTS micro_origin_id uuid REFERENCES public.micro_origins(id);
ALTER TABLE public.micro_variations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.micro_variations ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- 2.5 Nano Variations
CREATE TABLE IF NOT EXISTS public.nano_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_variation_id uuid REFERENCES public.micro_variations(id),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nano_variations ADD COLUMN IF NOT EXISTS micro_variation_id uuid REFERENCES public.micro_variations(id);
ALTER TABLE public.nano_variations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.nano_variations ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- =====================================================
-- PARTE 3: COLUNAS EXTRAS EM ENROLLMENTS
-- =====================================================

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS zipcode text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS observations text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_contact_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS kommo_lead_id integer;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS purchase_date timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS lead_date timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS utm_page text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnels(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS macro_origin_id uuid REFERENCES public.macro_origins(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_origin_id uuid REFERENCES public.micro_origins(id);
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS micro_variation_id uuid REFERENCES public.micro_variations(id);

-- =====================================================
-- PARTE 4: RELAXAR CONSTRAINTS (Permitir NULLs)
-- =====================================================

ALTER TABLE public.enrollments ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN sales_rep DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN payment_amount DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN payment_details DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN financial_status DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN contract_status DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN source DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN funnel_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN macro_origin_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN micro_origin_id DROP NOT NULL;
ALTER TABLE public.enrollments ALTER COLUMN micro_variation_id DROP NOT NULL;

-- Converter tipos ENUM para TEXT
ALTER TABLE public.enrollments ALTER COLUMN financial_status TYPE text;
ALTER TABLE public.enrollments ALTER COLUMN contract_status TYPE text;
ALTER TABLE public.enrollments ALTER COLUMN source TYPE text;

-- =====================================================
-- PARTE 5: FUNÇÃO get_cohort_stats (CRÍTICA)
-- =====================================================

DROP FUNCTION IF EXISTS public.get_cohort_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_cohort_stats(p_cohort_id uuid)
RETURNS TABLE (
  enrolled_count bigint,
  paid_count bigint,
  reserved_count bigint,
  signed_count bigint,
  available_spots bigint,
  is_overbooked boolean,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(e.id)::bigint as enrolled_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'paid')::bigint as paid_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'pending')::bigint as reserved_count,
    COUNT(e.id) FILTER (WHERE e.contract_status = 'signed')::bigint as signed_count,
    GREATEST(0, c.capacity - COUNT(e.id))::bigint as available_spots,
    (COUNT(e.id) > c.capacity) as is_overbooked,
    COALESCE(SUM(e.payment_amount) FILTER (WHERE e.financial_status = 'paid'), 0)::numeric as total_revenue
  FROM public.cohorts c
  LEFT JOIN public.enrollments e ON e.cohort_id = c.id
  WHERE c.id = p_cohort_id
  GROUP BY c.id, c.capacity;
END;
$$;

-- =====================================================
-- PARTE 6: RPCs DE HIERARQUIA
-- =====================================================

-- 6.1 Create Funnel
CREATE OR REPLACE FUNCTION public.rpc_create_funnel(p_name text, p_description text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.funnels (name, description, active) VALUES (p_name, p_description, true)
  RETURNING to_jsonb(funnels.*) INTO v_result;
  RETURN v_result;
END; $$;

-- 6.2 Create Macro Origin
CREATE OR REPLACE FUNCTION public.rpc_create_macro_origin(p_funnel_id uuid, p_name text, p_description text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.macro_origins (funnel_id, name, description, active) VALUES (p_funnel_id, p_name, p_description, true)
  RETURNING to_jsonb(macro_origins.*) INTO v_result;
  RETURN v_result;
END; $$;

-- 6.3 Create Micro Origin
CREATE OR REPLACE FUNCTION public.rpc_create_micro_origin(p_macro_origin_id uuid, p_name text, p_description text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.micro_origins (macro_origin_id, name, description, active) VALUES (p_macro_origin_id, p_name, p_description, true)
  RETURNING to_jsonb(micro_origins.*) INTO v_result;
  RETURN v_result;
END; $$;

-- 6.4 Create Micro Variation
CREATE OR REPLACE FUNCTION public.rpc_create_micro_variation(p_micro_origin_id uuid, p_name text, p_description text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.micro_variations (micro_origin_id, name, description, active) VALUES (p_micro_origin_id, p_name, p_description, true)
  RETURNING to_jsonb(micro_variations.*) INTO v_result;
  RETURN v_result;
END; $$;

-- 6.5 Create Nano Variation
CREATE OR REPLACE FUNCTION public.rpc_create_nano_variation(p_micro_variation_id uuid, p_name text, p_description text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.nano_variations (micro_variation_id, name, description, active) VALUES (p_micro_variation_id, p_name, p_description, true)
  RETURNING to_jsonb(nano_variations.*) INTO v_result;
  RETURN v_result;
END; $$;

-- 6.6 Insert Enrollment (via RPC)
CREATE OR REPLACE FUNCTION public.rpc_insert_enrollment(p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE v_result jsonb;
BEGIN
  INSERT INTO public.enrollments (
    cohort_id, student_name, email, cpf, sales_rep, source,
    funnel_id, macro_origin_id, micro_origin_id, micro_variation_id,
    payment_amount, financial_status, contract_status,
    phone, city, state, address, zipcode,
    product_name, payment_details, observations, created_by,
    purchase_date, lead_date, submitted_at,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_page,
    payment_proof_url, kommo_contact_id, kommo_lead_id
  ) SELECT
    (p_data->>'cohort_id')::uuid, p_data->>'student_name', p_data->>'email', p_data->>'cpf', 
    p_data->>'sales_rep', p_data->>'source', (p_data->>'funnel_id')::uuid, 
    (p_data->>'macro_origin_id')::uuid, (p_data->>'micro_origin_id')::uuid, 
    (p_data->>'micro_variation_id')::uuid, COALESCE((p_data->>'payment_amount')::numeric, 0), 
    p_data->>'financial_status', p_data->>'contract_status', p_data->>'phone', 
    p_data->>'city', p_data->>'state', p_data->>'address', p_data->>'zipcode',
    p_data->>'product_name', p_data->>'payment_details', p_data->>'observations', 
    (p_data->>'created_by')::uuid, (p_data->>'purchase_date')::timestamptz, 
    (p_data->>'lead_date')::timestamptz, (p_data->>'submitted_at')::timestamptz,
    p_data->>'utm_source', p_data->>'utm_medium', p_data->>'utm_campaign', 
    p_data->>'utm_term', p_data->>'utm_content', p_data->>'utm_page',
    p_data->>'payment_proof_url', (p_data->>'kommo_contact_id')::integer, 
    (p_data->>'kommo_lead_id')::integer
  RETURNING to_jsonb(enrollments.*) INTO v_result;
  RETURN v_result;
END; $$;

-- =====================================================
-- PARTE 7: RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nano_variations ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (autenticados podem tudo)
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.funnels;
CREATE POLICY "Allow all for authenticated" ON public.funnels FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.macro_origins;
CREATE POLICY "Allow all for authenticated" ON public.macro_origins FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.micro_origins;
CREATE POLICY "Allow all for authenticated" ON public.micro_origins FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.micro_variations;
CREATE POLICY "Allow all for authenticated" ON public.micro_variations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.nano_variations;
CREATE POLICY "Allow all for authenticated" ON public.nano_variations FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- PARTE 8: RELOAD SCHEMA
-- =====================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
