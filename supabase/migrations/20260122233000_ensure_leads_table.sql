create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text,
  email text,
  phone text,
  status text default 'new',
  source text,
  custom_fields jsonb
);

-- Add unique constraint on email if not exists
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_email_key') then
    alter table public.leads add constraint leads_email_key unique (email);
  end if;
end $$;

-- Enable RLS
alter table public.leads enable row level security;

-- Policies
create policy "Enable read access for authenticated users"
on public.leads for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.leads for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on public.leads for update
to authenticated
using (true);

create policy "Enable delete access for authenticated users"
on public.leads for delete
to authenticated
using (true);
