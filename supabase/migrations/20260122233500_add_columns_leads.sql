alter table public.leads add column if not exists status text default 'new';
alter table public.leads add column if not exists source text;
alter table public.leads add column if not exists phone text; -- jic
