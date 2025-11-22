-- FASE 4: SEGURANÇA & ESCALA - Correções de Segurança (Parte 1)

-- =====================================================
-- 1. CORRIGIR ACESSO DE VENDEDORES AOS ENROLLMENTS
-- =====================================================

-- Drop política atual
DROP POLICY IF EXISTS "Only admins and operators can view enrollments" ON public.enrollments;

-- Nova política: Admins e Operators veem tudo
CREATE POLICY "Admins and operators can view all enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role)
  );

-- Nova política: Sales veem apenas suas próprias vendas
CREATE POLICY "Sales reps can view only their own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'sales'::app_role) AND 
    sales_rep IN (
      SELECT name FROM public.sales_representatives 
      WHERE email IN (
        SELECT email FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 2. FUNÇÃO PARA MASCARAR DADOS SENSÍVEIS EM AUDIT LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION public.sanitize_audit_data(data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove campos sensíveis
  RETURN data 
    - 'cpf'
    - 'address'
    - 'zipcode'
    - 'payment_amount'
    - 'payment_details'
    - 'payment_proof_url'
    - 'phone';
END;
$$;

-- Atualizar trigger de audit para sanitizar dados
CREATE OR REPLACE FUNCTION public.log_enrollment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_action text;
  v_user_email text;
  v_before_sanitized jsonb;
  v_after_sanitized jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
    select email into v_user_email from auth.users where id = new.created_by;
    
    v_after_sanitized := public.sanitize_audit_data(to_jsonb(new));
    
    insert into public.audit_logs (
      entity_type,
      entity_id,
      action,
      after_data,
      user_id,
      user_email
    ) values (
      'enrollment',
      new.id,
      v_action,
      v_after_sanitized,
      new.created_by,
      v_user_email
    );
  elsif tg_op = 'UPDATE' then
    v_action := 'updated';
    select email into v_user_email from auth.users where id = auth.uid();
    
    v_before_sanitized := public.sanitize_audit_data(to_jsonb(old));
    v_after_sanitized := public.sanitize_audit_data(to_jsonb(new));
    
    insert into public.audit_logs (
      entity_type,
      entity_id,
      action,
      before_data,
      after_data,
      user_id,
      user_email
    ) values (
      'enrollment',
      new.id,
      v_action,
      v_before_sanitized,
      v_after_sanitized,
      auth.uid(),
      v_user_email
    );
  elsif tg_op = 'DELETE' then
    v_action := 'deleted';
    select email into v_user_email from auth.users where id = auth.uid();
    
    v_before_sanitized := public.sanitize_audit_data(to_jsonb(old));
    
    insert into public.audit_logs (
      entity_type,
      entity_id,
      action,
      before_data,
      user_id,
      user_email
    ) values (
      'enrollment',
      old.id,
      v_action,
      v_before_sanitized,
      auth.uid(),
      v_user_email
    );
  end if;
  
  return coalesce(new, old);
end;
$function$;

-- =====================================================
-- 3. RESTRINGIR ACESSO A SALES REPRESENTATIVES
-- =====================================================

DROP POLICY IF EXISTS "Only admin/operator/sales can view sales reps" ON public.sales_representatives;

CREATE POLICY "Only admins and operators can view sales reps"
  ON public.sales_representatives
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'operator'::app_role)
  );

CREATE POLICY "Sales reps can view their own profile"
  ON public.sales_representatives
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'sales'::app_role) AND
    email IN (
      SELECT email FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. POLÍTICA DE RETENÇÃO DE DADOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_import_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.csv_import_history
  WHERE imported_at < NOW() - INTERVAL '90 days';
END;
$$;

-- =====================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_sales_rep ON public.enrollments(sales_rep);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_financial_status ON public.enrollments(financial_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_contract_status ON public.enrollments(contract_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_status_dates ON public.enrollments(financial_status, contract_status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON public.audit_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date ON public.cohorts(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_reps_email ON public.sales_representatives(email);

-- =====================================================
-- 6. VALIDAÇÃO DE INPUT BÁSICA
-- =====================================================

-- Validar que payment_amount não é negativo
ALTER TABLE public.enrollments 
  DROP CONSTRAINT IF EXISTS check_payment_amount_positive;
  
ALTER TABLE public.enrollments 
  ADD CONSTRAINT check_payment_amount_positive 
  CHECK (payment_amount IS NULL OR payment_amount >= 0);

-- Validar capacidade de cohort é positiva
ALTER TABLE public.cohorts 
  DROP CONSTRAINT IF EXISTS check_capacity_positive;
  
ALTER TABLE public.cohorts 
  ADD CONSTRAINT check_capacity_positive 
  CHECK (capacity > 0 AND capacity <= 1000);