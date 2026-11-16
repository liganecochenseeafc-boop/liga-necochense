-- ============================================================
--  PASO 1: tabla de administradores
--  Se pega y ejecuta en Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.admins (
  email text primary key
);

alter table public.admins enable row level security;

-- Un usuario logueado solo puede ver SU propia fila.
-- Así la página sabe si sos admin, sin exponer la lista a nadie más.
drop policy if exists "ver mi propia fila de admin" on public.admins;
create policy "ver mi propia fila de admin"
  on public.admins for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

-- Tu email como administrador
insert into public.admins (email)
values ('liganecochenseeafc@gmail.com')
on conflict (email) do nothing;
