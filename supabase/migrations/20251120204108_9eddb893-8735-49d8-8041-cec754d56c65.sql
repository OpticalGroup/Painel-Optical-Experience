-- Fix security warnings: Set search_path on functions that don't have it

-- Fix assign_enrollment_position function
CREATE OR REPLACE FUNCTION public.assign_enrollment_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.position_in_cohort is null then
    select coalesce(max(position_in_cohort), 0) + 1
    into new.position_in_cohort
    from public.enrollments
    where cohort_id = new.cohort_id;
  end if;
  return new;
end;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;