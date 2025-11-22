-- Fix get_cohort_stats function - add search_path
CREATE OR REPLACE FUNCTION public.get_cohort_stats(p_cohort_id uuid)
RETURNS TABLE(enrolled_count bigint, paid_count bigint, reserved_count bigint, signed_count bigint, capacity integer, available_spots integer, is_overbooked boolean)
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  select
    count(*) as enrolled_count,
    count(*) filter (where financial_status = 'paid') as paid_count,
    count(*) filter (where financial_status = 'pending') as reserved_count,
    count(*) filter (where contract_status = 'signed') as signed_count,
    c.capacity,
    greatest(0, c.capacity - count(*)::integer) as available_spots,
    count(*) > c.capacity as is_overbooked
  from public.enrollments e
  join public.cohorts c on c.id = e.cohort_id
  where e.cohort_id = p_cohort_id
  group by c.capacity;
$function$;