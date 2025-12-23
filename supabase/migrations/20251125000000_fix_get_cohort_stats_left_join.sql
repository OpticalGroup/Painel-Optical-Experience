DROP FUNCTION IF EXISTS public.get_cohort_stats(uuid);

CREATE OR REPLACE FUNCTION public.get_cohort_stats(p_cohort_id uuid)
 RETURNS TABLE(
    capacity integer, 
    available_spots integer, 
    enrolled_count bigint, 
    reserved_count bigint, 
    paid_count bigint, 
    signed_count bigint, 
    is_overbooked boolean, 
    total_revenue numeric
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.capacity,
    (c.capacity - COUNT(e.id)::int) as available_spots,
    COUNT(e.id) as enrolled_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'pending') as reserved_count,
    COUNT(e.id) FILTER (WHERE e.financial_status = 'paid') as paid_count,
    COUNT(e.id) FILTER (WHERE e.contract_status = 'signed') as signed_count,
    (COUNT(e.id) > c.capacity) as is_overbooked,
    COALESCE(SUM(e.payment_amount) FILTER (WHERE e.financial_status = 'paid'), 0) as total_revenue
  FROM public.cohorts c
  LEFT JOIN public.enrollments e ON e.cohort_id = c.id
  WHERE c.id = p_cohort_id
  GROUP BY c.id;
END;
$function$;
