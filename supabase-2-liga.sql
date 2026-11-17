-- ============================================================
--  PASO 2: tablas de la liga, permisos y seguridad
--  Se pega y ejecuta en Supabase -> SQL Editor -> New query -> Run
--  (Antes tiene que estar ejecutado supabase-1-admin.sql)
--  Es seguro ejecutarlo más de una vez.
-- ============================================================

-- ---------- Función: ¿el usuario logueado es administrador? ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- Perfiles de jugadores ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text,
  gamertag    text,
  whatsapp    text,
  plataforma  text default 'PlayStation 5',
  disp        text[] default '{}',
  created_at  timestamptz default now()
);
-- Dos jugadores no pueden tener el mismo nombre
create unique index if not exists profiles_nombre_unico on public.profiles (lower(nombre));

-- Cuando alguien crea su cuenta, se le crea el perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email,
          coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)))
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para los usuarios que ya existían (por ejemplo, el tuyo)
insert into public.profiles (id, email, nombre)
select u.id, u.email, split_part(u.email, '@', 1) from auth.users u
on conflict do nothing;

-- ---------- Inscripciones ----------
create table if not exists public.inscripciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles(id) on delete cascade,
  equipo_id   int  not null,
  precio      int,
  estado      text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  pagado      boolean not null default false,
  liga        text check (liga in ('A','B','C','D','E')),
  nota        text,
  created_at  timestamptz default now()
);
-- Un equipo lo puede tener un solo jugador (las rechazadas no cuentan)
create unique index if not exists inscripciones_equipo_unico
  on public.inscripciones (equipo_id) where estado <> 'rechazada';

-- ---------- Partidos ----------
create table if not exists public.partidos (
  id         uuid primary key default gen_random_uuid(),
  liga       text not null check (liga in ('A','B','C','D','E')),
  jornada    int  not null default 1,
  jugador_a  uuid not null references public.profiles(id) on delete cascade,
  jugador_b  uuid not null references public.profiles(id) on delete cascade,
  estado     text not null default 'programado' check (estado in ('programado','jugado')),
  fecha      timestamptz,
  stats      jsonb,
  created_at timestamptz default now(),
  check (jugador_a <> jugador_b)
);

-- ---------- Vistas públicas (sin datos privados) ----------
create or replace view public.jugadores_publicos as
  select i.user_id as id, p.nombre, i.equipo_id, i.liga, p.plataforma, i.created_at as desde
  from public.inscripciones i
  join public.profiles p on p.id = i.user_id
  where i.estado = 'aprobada';

create or replace view public.equipos_ocupados as
  select equipo_id from public.inscripciones where estado <> 'rechazada';

grant select on public.jugadores_publicos to anon, authenticated;
grant select on public.equipos_ocupados   to anon, authenticated;

-- ---------- Seguridad (RLS) ----------
alter table public.profiles       enable row level security;
alter table public.inscripciones  enable row level security;
alter table public.partidos       enable row level security;

-- profiles: cada uno ve y edita el suyo; el admin ve y edita todos
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- inscripciones: el jugador crea la suya (siempre pendiente) y la ve; el admin gestiona todas
drop policy if exists "insc_select" on public.inscripciones;
create policy "insc_select" on public.inscripciones for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "insc_insert" on public.inscripciones;
create policy "insc_insert" on public.inscripciones for insert to authenticated
  with check (
    public.is_admin()
    or (user_id = auth.uid() and estado = 'pendiente' and pagado = false and liga is null)
  );
drop policy if exists "insc_update" on public.inscripciones;
create policy "insc_update" on public.inscripciones for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "insc_delete" on public.inscripciones;
create policy "insc_delete" on public.inscripciones for delete to authenticated
  using (public.is_admin() or (user_id = auth.uid() and estado = 'pendiente'));

-- partidos: los ven todos (son públicos); solo el admin los crea, edita o borra
drop policy if exists "partidos_select" on public.partidos;
create policy "partidos_select" on public.partidos for select to anon, authenticated using (true);
drop policy if exists "partidos_insert" on public.partidos;
create policy "partidos_insert" on public.partidos for insert to authenticated with check (public.is_admin());
drop policy if exists "partidos_update" on public.partidos;
create policy "partidos_update" on public.partidos for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "partidos_delete" on public.partidos;
create policy "partidos_delete" on public.partidos for delete to authenticated using (public.is_admin());

-- ---------- WhatsApp del rival (solo si tenés un partido pendiente con esa persona) ----------
create or replace function public.contacto_rival(p_partido uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select pr.whatsapp
  from public.partidos m
  join public.profiles pr
    on pr.id = case when m.jugador_a = auth.uid() then m.jugador_b else m.jugador_a end
  where m.id = p_partido
    and m.estado = 'programado'
    and auth.uid() in (m.jugador_a, m.jugador_b);
$$;
grant execute on function public.contacto_rival(uuid) to authenticated;
