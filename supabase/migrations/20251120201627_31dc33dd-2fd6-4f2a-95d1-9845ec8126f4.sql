-- Create enum types
create type public.cohort_status as enum ('open', 'full', 'completed', 'cancelled');
create type public.enrollment_financial_status as enum ('pending', 'paid');
create type public.enrollment_contract_status as enum ('pending', 'signed');
create type public.enrollment_source as enum ('Instagram', 'Facebook', 'Indicação', 'Tráfego Pago', 'Direto', 'Outro');
create type public.app_role as enum ('admin', 'operator', 'sales', 'viewer');

-- Create courses table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create cohorts table
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null,
  year integer not null,
  start_date date not null,
  end_date date,
  location text not null,
  capacity integer not null default 22,
  status cohort_status not null default 'open',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create enrollments table
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete cascade not null,
  student_name text not null,
  email text not null,
  cpf text not null,
  phone text,
  payment_details text not null,
  payment_amount numeric(10,2),
  financial_status enrollment_financial_status not null default 'pending',
  contract_status enrollment_contract_status not null default 'pending',
  sales_rep text not null,
  source enrollment_source not null default 'Outro',
  position_in_cohort integer,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid references auth.users(id),
  constraint unique_email_per_cohort unique (cohort_id, email)
);

-- Create audit_logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  user_id uuid references auth.users(id),
  user_email text,
  created_at timestamp with time zone default now() not null
);

-- Create user_roles table (CRITICAL: separate table for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now() not null,
  unique (user_id, role)
);

-- Create indexes
create index idx_cohorts_course_id on public.cohorts(course_id);
create index idx_cohorts_status on public.cohorts(status);
create index idx_cohorts_start_date on public.cohorts(start_date);
create index idx_enrollments_cohort_id on public.enrollments(cohort_id);
create index idx_enrollments_email on public.enrollments(email);
create index idx_enrollments_financial_status on public.enrollments(financial_status);
create index idx_enrollments_contract_status on public.enrollments(contract_status);
create index idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index idx_audit_logs_entity_id on public.audit_logs(entity_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_user_roles_user_id on public.user_roles(user_id);

-- Enable Row Level Security
alter table public.courses enable row level security;
alter table public.cohorts enable row level security;
alter table public.enrollments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_roles enable row level security;

-- Create security definer function to check user roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create function to get cohort statistics
create or replace function public.get_cohort_stats(p_cohort_id uuid)
returns table (
  enrolled_count bigint,
  paid_count bigint,
  reserved_count bigint,
  signed_count bigint,
  capacity integer,
  available_spots integer,
  is_overbooked boolean
)
language sql
stable
as $$
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
$$;

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger update_courses_updated_at
  before update on public.courses
  for each row
  execute function public.update_updated_at_column();

create trigger update_cohorts_updated_at
  before update on public.cohorts
  for each row
  execute function public.update_updated_at_column();

create trigger update_enrollments_updated_at
  before update on public.enrollments
  for each row
  execute function public.update_updated_at_column();

-- Create trigger to assign position_in_cohort
create or replace function public.assign_enrollment_position()
returns trigger
language plpgsql
as $$
begin
  if new.position_in_cohort is null then
    select coalesce(max(position_in_cohort), 0) + 1
    into new.position_in_cohort
    from public.enrollments
    where cohort_id = new.cohort_id;
  end if;
  return new;
end;
$$;

create trigger before_insert_enrollment_position
  before insert on public.enrollments
  for each row
  execute function public.assign_enrollment_position();

-- Create trigger to log enrollment changes
create or replace function public.log_enrollment_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create trigger after_enrollment_changes
  after insert or update or delete on public.enrollments
  for each row
  execute function public.log_enrollment_changes();

-- RLS Policies for courses (everyone can read)
create policy "Anyone authenticated can view courses"
  on public.courses for select
  to authenticated
  using (true);

create policy "Only admins can modify courses"
  on public.courses for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cohorts (everyone can read)
create policy "Anyone authenticated can view cohorts"
  on public.cohorts for select
  to authenticated
  using (true);

create policy "Admins and operators can modify cohorts"
  on public.cohorts for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operator'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operator'));

-- RLS Policies for enrollments (everyone can read)
create policy "Anyone authenticated can view enrollments"
  on public.enrollments for select
  to authenticated
  using (true);

create policy "Sales, operators and admins can create enrollments"
  on public.enrollments for insert
  to authenticated
  with check (
    public.has_role(auth.uid(), 'admin') or 
    public.has_role(auth.uid(), 'operator') or 
    public.has_role(auth.uid(), 'sales')
  );

create policy "Operators and admins can update enrollments"
  on public.enrollments for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operator'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'operator'));

create policy "Only admins can delete enrollments"
  on public.enrollments for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs (read only for admins)
create policy "Only admins can view audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (admins only)
create policy "Only admins can manage user roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Insert seed data for courses
insert into public.courses (id, name, description) values
  ('00000000-0000-0000-0000-000000000001', 'Optical Experience', 'Curso imersivo de óptica premium'),
  ('00000000-0000-0000-0000-000000000002', 'Dental Excellence', 'Curso de excelência odontológica');

-- Insert seed data for cohorts (6 turmas com datas reais)
insert into public.cohorts (id, course_id, name, year, start_date, end_date, location, capacity, status) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Optical Experience Janeiro 2025', 2025, '2025-01-15', '2025-01-17', 'São Paulo - SP', 22, 'open'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Optical Experience Março 2025', 2025, '2025-03-20', '2025-03-22', 'Rio de Janeiro - RJ', 22, 'open'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Optical Experience Junho 2025', 2025, '2025-06-10', '2025-06-12', 'Belo Horizonte - MG', 22, 'open'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Optical Experience Setembro 2025', 2025, '2025-09-15', '2025-09-17', 'São Paulo - SP', 22, 'open'),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000002', 'Dental Excellence Abril 2025', 2025, '2025-04-08', '2025-04-10', 'Curitiba - PR', 30, 'open'),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000002', 'Dental Excellence Agosto 2025', 2025, '2025-08-12', '2025-08-14', 'Porto Alegre - RS', 30, 'open');

-- Insert seed data for enrollments (exemplo de alunos)
insert into public.enrollments (cohort_id, student_name, email, cpf, phone, payment_details, payment_amount, financial_status, contract_status, sales_rep, source, created_by) values
  ('00000000-0000-0000-0000-000000000011', 'Ana Silva', 'ana.silva@email.com', '123.456.789-00', '(11) 98765-4321', 'À vista', 5000.00, 'paid', 'signed', 'Jéssica Brandão', 'Instagram', null),
  ('00000000-0000-0000-0000-000000000011', 'Bruno Costa', 'bruno.costa@email.com', '234.567.890-11', '(11) 97654-3210', 'Entrada R$1.500 + 6x R$600', 5100.00, 'paid', 'pending', 'Jéssica Brandão', 'Facebook', null),
  ('00000000-0000-0000-0000-000000000011', 'Carla Mendes', 'carla.mendes@email.com', '345.678.901-22', '(11) 96543-2109', '10x R$520', 5200.00, 'pending', 'pending', 'Roberto Lima', 'Indicação', null),
  ('00000000-0000-0000-0000-000000000012', 'Daniel Souza', 'daniel.souza@email.com', '456.789.012-33', '(21) 95432-1098', 'À vista', 5000.00, 'paid', 'signed', 'Jéssica Brandão', 'Tráfego Pago', null),
  ('00000000-0000-0000-0000-000000000012', 'Eliana Rodrigues', 'eliana.rodrigues@email.com', '567.890.123-44', '(21) 94321-0987', 'Entrada R$2.000 + 5x R$650', 5250.00, 'paid', 'signed', 'Roberto Lima', 'Instagram', null),
  ('00000000-0000-0000-0000-000000000013', 'Fernando Alves', 'fernando.alves@email.com', '678.901.234-55', '(31) 93210-9876', '12x R$450', 5400.00, 'pending', 'pending', 'Jéssica Brandão', 'Facebook', null),
  ('00000000-0000-0000-0000-000000000014', 'Gabriela Santos', 'gabriela.santos@email.com', '789.012.345-66', '(11) 92109-8765', 'À vista', 5000.00, 'paid', 'pending', 'Roberto Lima', 'Indicação', null);