-- RPC Functions to bypass PostgREST Schema Cache Issues (RETRY)

-- 1. Create Funnel
CREATE OR REPLACE FUNCTION public.rpc_create_funnel(p_name text, p_description text default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.funnels (name, description, active)
  VALUES (p_name, p_description, true)
  RETURNING to_jsonb(funnels.*) INTO v_result;
  RETURN v_result;
END;
$$;

-- 2. Create Macro Origin
CREATE OR REPLACE FUNCTION public.rpc_create_macro_origin(p_funnel_id uuid, p_name text, p_description text default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.macro_origins (funnel_id, name, description, active)
  VALUES (p_funnel_id, p_name, p_description, true)
  RETURNING to_jsonb(macro_origins.*) INTO v_result;
  RETURN v_result;
END;
$$;

-- 3. Create Micro Origin
CREATE OR REPLACE FUNCTION public.rpc_create_micro_origin(p_macro_origin_id uuid, p_name text, p_description text default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.micro_origins (macro_origin_id, name, description, active)
  VALUES (p_macro_origin_id, p_name, p_description, true)
  RETURNING to_jsonb(micro_origins.*) INTO v_result;
  RETURN v_result;
END;
$$;

-- 4. Create Micro Variation
CREATE OR REPLACE FUNCTION public.rpc_create_micro_variation(p_micro_origin_id uuid, p_name text, p_description text default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.micro_variations (micro_origin_id, name, description, active)
  VALUES (p_micro_origin_id, p_name, p_description, true)
  RETURNING to_jsonb(micro_variations.*) INTO v_result;
  RETURN v_result;
END;
$$;

-- 5. Create Nano Variation
CREATE OR REPLACE FUNCTION public.rpc_create_nano_variation(p_micro_variation_id uuid, p_name text, p_description text default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.nano_variations (micro_variation_id, name, description, active)
  VALUES (p_micro_variation_id, p_name, p_description, true)
  RETURNING to_jsonb(nano_variations.*) INTO v_result;
  RETURN v_result;
END;
$$;

-- 6. Insert Enrollment (Massive mapping)
CREATE OR REPLACE FUNCTION public.rpc_insert_enrollment(p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO public.enrollments (
    cohort_id, student_name, email, cpf, sales_rep, source,
    funnel_id, macro_origin_id, micro_origin_id, micro_variation_id,
    payment_amount, financial_status, contract_status,
    phone, city, state, address, zipcode,
    product_name, payment_details, observations, 
    created_by,
    purchase_date, lead_date, submitted_at,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_page,
    payment_proof_url, kommo_contact_id, kommo_lead_id
  )
  SELECT
    (p_data->>'cohort_id')::uuid,
    p_data->>'student_name',
    p_data->>'email',
    p_data->>'cpf',
    p_data->>'sales_rep',
    p_data->>'source',
    (p_data->>'funnel_id')::uuid,
    (p_data->>'macro_origin_id')::uuid,
    (p_data->>'micro_origin_id')::uuid,
    (p_data->>'micro_variation_id')::uuid,
    COALESCE((p_data->>'payment_amount')::numeric, 0),
    p_data->>'financial_status',
    p_data->>'contract_status',
    p_data->>'phone',
    p_data->>'city',
    p_data->>'state',
    p_data->>'address',
    p_data->>'zipcode',
    p_data->>'product_name',
    p_data->>'payment_details',
    p_data->>'observations',
    (p_data->>'created_by')::uuid,
    (p_data->>'purchase_date')::timestamptz,
    (p_data->>'lead_date')::timestamptz,
    (p_data->>'submitted_at')::timestamptz,
    p_data->>'utm_source',
    p_data->>'utm_medium',
    p_data->>'utm_campaign',
    p_data->>'utm_term',
    p_data->>'utm_content',
    p_data->>'utm_page',
    p_data->>'payment_proof_url',
    (p_data->>'kommo_contact_id')::integer,
    (p_data->>'kommo_lead_id')::integer
  RETURNING to_jsonb(enrollments.*) INTO v_result;
  
  RETURN v_result;
END;
$$;
