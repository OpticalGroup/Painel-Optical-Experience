-- Fix remaining security warning: log_enrollment_changes function
CREATE OR REPLACE FUNCTION public.log_enrollment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare
  v_action text;
  v_user_email text;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
    select email into v_user_email from auth.users where id = new.created_by;
    
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
      to_jsonb(new),
      new.created_by,
      v_user_email
    );
  elsif tg_op = 'UPDATE' then
    v_action := 'updated';
    select email into v_user_email from auth.users where id = auth.uid();
    
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
      to_jsonb(old),
      to_jsonb(new),
      auth.uid(),
      v_user_email
    );
  elsif tg_op = 'DELETE' then
    v_action := 'deleted';
    select email into v_user_email from auth.users where id = auth.uid();
    
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
      to_jsonb(old),
      auth.uid(),
      v_user_email
    );
  end if;
  
  return coalesce(new, old);
end;
$function$;