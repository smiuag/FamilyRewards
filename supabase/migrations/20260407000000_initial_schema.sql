-- ============================================================
-- FamilyRewards — Schema inicial
-- ============================================================

-- ── FAMILIES ────────────────────────────────────────────────
create table families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ── PROFILES ────────────────────────────────────────────────
-- Incluye tanto miembros con cuenta (auth_user_id != null)
-- como perfiles gestionados sin cuenta (niños, etc.)
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  family_id    uuid not null references families(id) on delete cascade,
  name         text not null,
  avatar       text not null default '😊',
  role         text not null default 'member' check (role in ('admin', 'member')),
  points_balance integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── FAMILY INVITATIONS ──────────────────────────────────────
create table family_invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  email       text not null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references profiles(id) on delete set null,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ── TASKS ───────────────────────────────────────────────────
create table tasks (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families(id) on delete cascade,
  title            text not null,
  description      text,
  points           integer not null default 0,
  created_by       uuid references profiles(id) on delete set null,
  is_recurring     boolean not null default false,
  recurring_pattern jsonb,           -- { daysOfWeek, time, durationHours, defaultState }
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Asignación de tareas a perfiles (n:m)
create table task_assignments (
  task_id    uuid not null references tasks(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

-- ── TASK INSTANCES ──────────────────────────────────────────
create table task_instances (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references tasks(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,
  date           date not null,
  state          text not null default 'pending'
                   check (state in ('pending', 'completed', 'not_completed', 'omitted')),
  points_awarded integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (task_id, profile_id, date)
);

-- ── REWARDS ─────────────────────────────────────────────────
create table rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null,
  description text,
  points_cost integer not null default 0,
  emoji       text not null default '🎁',
  status      text not null default 'available' check (status in ('available', 'disabled')),
  created_at  timestamptz not null default now()
);

-- ── REWARD CLAIMS ───────────────────────────────────────────
create table reward_claims (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null references rewards(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null,
  -- Un admin no puede aprobar su propia reclamación
  constraint no_self_approval check (resolved_by is null or resolved_by != profile_id)
);

-- ── POINTS TRANSACTIONS ─────────────────────────────────────
create table points_transactions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  amount        integer not null,
  type          text not null check (type in ('task', 'reward', 'adjustment', 'streak')),
  description   text not null,
  emoji         text not null default '⭐',
  created_at    timestamptz not null default now(),
  balance_after integer not null
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index on profiles (family_id);
create index on profiles (auth_user_id);
create index on tasks (family_id);
create index on task_assignments (profile_id);
create index on task_instances (profile_id, date);
create index on task_instances (task_id);
create index on rewards (family_id);
create index on reward_claims (profile_id);
create index on reward_claims (reward_id);
create index on points_transactions (profile_id, created_at desc);
create index on family_invitations (token);
create index on family_invitations (family_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Devuelve el family_id del usuario autenticado actual
create or replace function get_my_family_id()
returns uuid
language sql
stable
security definer
as $$
  select family_id
  from profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Devuelve el profile.id del usuario autenticado actual
create or replace function get_my_profile_id()
returns uuid
language sql
stable
security definer
as $$
  select id
  from profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- Comprueba si el usuario autenticado es admin en su familia
create or replace function is_family_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid()
    and role = 'admin'
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table families           enable row level security;
alter table profiles           enable row level security;
alter table family_invitations enable row level security;
alter table tasks              enable row level security;
alter table task_assignments   enable row level security;
alter table task_instances     enable row level security;
alter table rewards            enable row level security;
alter table reward_claims      enable row level security;
alter table points_transactions enable row level security;

-- ── families ────────────────────────────────────────────────
create policy "members can read their family"
  on families for select
  using (id = get_my_family_id());

create policy "authenticated users can create a family"
  on families for insert
  with check (auth.uid() is not null);

-- ── profiles ────────────────────────────────────────────────
create policy "family members can read all profiles"
  on profiles for select
  using (family_id = get_my_family_id());

create policy "admins can insert profiles"
  on profiles for insert
  with check (is_family_admin() and family_id = get_my_family_id());

create policy "admins can update profiles"
  on profiles for update
  using (is_family_admin() and family_id = get_my_family_id());

-- Caso especial: al fundar la familia se inserta el primer perfil
-- (el admin no existe aún, así que se permite si el auth_user_id = auth.uid())
create policy "user can insert own profile on signup"
  on profiles for insert
  with check (auth_user_id = auth.uid());

-- Un admin puede degradarse a sí mismo (validación de "queda otro admin" va en la app)
create policy "user can update own role"
  on profiles for update
  using (auth_user_id = auth.uid());

-- ── family_invitations ───────────────────────────────────────
create policy "admins can manage invitations"
  on family_invitations for all
  using (is_family_admin() and family_id = get_my_family_id());

-- Acceso público para aceptar invitación por token (sin sesión aún)
create policy "anyone can read invitation by token"
  on family_invitations for select
  using (true);

-- ── tasks ────────────────────────────────────────────────────
create policy "family members can read tasks"
  on tasks for select
  using (family_id = get_my_family_id());

create policy "admins can manage tasks"
  on tasks for all
  using (is_family_admin() and family_id = get_my_family_id());

-- ── task_assignments ─────────────────────────────────────────
create policy "family members can read assignments"
  on task_assignments for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "admins can manage assignments"
  on task_assignments for all
  using (is_family_admin());

-- ── task_instances ───────────────────────────────────────────
create policy "family members can read instances"
  on task_instances for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "admins can manage instances"
  on task_instances for all
  using (is_family_admin());

-- ── rewards ──────────────────────────────────────────────────
create policy "family members can read rewards"
  on rewards for select
  using (family_id = get_my_family_id());

create policy "admins can manage rewards"
  on rewards for all
  using (is_family_admin() and family_id = get_my_family_id());

-- ── reward_claims ────────────────────────────────────────────
create policy "family members can read their claims"
  on reward_claims for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "members can create own claims"
  on reward_claims for insert
  with check (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

-- Solo admins pueden aprobar/rechazar, y no pueden aprobar las suyas propias
create policy "admins can resolve others claims"
  on reward_claims for update
  using (
    is_family_admin()
    and profile_id != get_my_profile_id()
  );

-- ── points_transactions ──────────────────────────────────────
create policy "family members can read transactions"
  on points_transactions for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "admins can insert transactions"
  on points_transactions for insert
  with check (is_family_admin());

-- ============================================================
-- TRIGGER: crear perfil al registrarse un nuevo usuario
-- ============================================================
-- Se activa después de que Supabase Auth crea el auth.users row.
-- Los datos de nombre/avatar/family llegan como metadata del signup.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_invitation record;
  v_token text;
begin
  v_token := new.raw_user_meta_data->>'invitation_token';

  if v_token is not null then
    -- El usuario se registra aceptando una invitación
    select * into v_invitation
    from family_invitations
    where token = v_token
      and accepted_at is null
      and expires_at > now();

    if not found then
      raise exception 'Invitation token invalid or expired';
    end if;

    v_family_id := v_invitation.family_id;

    -- Marcar invitación como aceptada
    update family_invitations
    set accepted_at = now()
    where id = v_invitation.id;

    -- Crear perfil vinculado a la familia
    insert into profiles (auth_user_id, family_id, name, avatar, role)
    values (
      new.id,
      v_family_id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'avatar', '😊'),
      v_invitation.role
    );

  else
    -- El usuario funda una nueva familia
    insert into families (name)
    values (coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'))
    returning id into v_family_id;

    insert into profiles (auth_user_id, family_id, name, avatar, role)
    values (
      new.id,
      v_family_id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'avatar', '😊'),
      'admin'
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
