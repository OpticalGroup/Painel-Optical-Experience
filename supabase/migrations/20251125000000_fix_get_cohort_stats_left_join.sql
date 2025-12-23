CREATE OR REPLACE FUNCTION public.get_cohort_stats(p_cohort_id uuid)
RETURNS TABLE(
  enrolled_count bigint,
  paid_count bigint,
  reserved_count bigint,
  signed_count bigint,
  capacity integer,
  available_spots integer,
  is_overbooked boolean,
  total_revenue numeric
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(e.id) as enrolled_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'paid') as paid_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'pending') as reserved_count,
    COUNT(e.id) FILTER (WHERE e.contract_status = 'signed') as signed_count,
    c.capacity,
    GREATEST(0, c.capacity - COUNT(e.id)::integer) as available_spots,
    COUNT(e.id) > c.capacity as is_overbooked,
    COALESCE(SUM(e.payment_amount) FILTER (WHERE e.financial_status = 'paid'), 0) as total_revenue
  FROM public.cohorts c
  LEFT JOIN public.enrollments e ON e.cohort_id = c.id
  WHERE c.id = p_cohort_id
  GROUP BY c.capacity;
$function$;
