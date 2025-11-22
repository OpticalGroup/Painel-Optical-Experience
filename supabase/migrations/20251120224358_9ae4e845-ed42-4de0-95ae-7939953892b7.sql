-- Drop and recreate get_cohort_stats function to include total revenue
DROP FUNCTION IF EXISTS public.get_cohort_stats(uuid);

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
    COUNT(*) as enrolled_count,
    COUNT(*) FILTER (WHERE financial_status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE financial_status = 'pending') as reserved_count,
    COUNT(*) FILTER (WHERE contract_status = 'signed') as signed_count,
    c.capacity,
    GREATEST(0, c.capacity - COUNT(*)::integer) as available_spots,
    COUNT(*) > c.capacity as is_overbooked,
    COALESCE(SUM(payment_amount) FILTER (WHERE financial_status = 'paid'), 0) as total_revenue
  FROM public.enrollments e
  JOIN public.cohorts c ON c.id = e.cohort_id
  WHERE e.cohort_id = p_cohort_id
  GROUP BY c.capacity;
$function$;