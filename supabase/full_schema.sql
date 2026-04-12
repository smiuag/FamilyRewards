-- ============================================================
-- FamilyRewards — Schema completo idempotente
-- Ejecutar en el SQL Editor de Supabase para tener toda la BD
-- al día. Se puede re-ejecutar sin errores.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLAS
-- ────────────────────────────────────────────────────────────

-- ── FAMILIES ────────────────────────────────────────────────
create table if not exists families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table families
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists setup_visited_members boolean not null default false,
  add column if not exists setup_visited_tasks boolean not null default false,
  add column if not exists setup_visited_rewards boolean not null default false;

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  family_id    uuid not null references families(id) on delete cascade,
  name         text not null,
  avatar       text not null default '😊',
  role         text not null default 'member' check (role in ('admin', 'member')),
  points_balance integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table profiles
  add column if not exists vacation_until date;

alter table profiles
  add column if not exists birth_date date;

-- ── FAMILY INVITATIONS ──────────────────────────────────────
create table if not exists family_invitations (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  email       text,
  role        text not null default 'member' check (role in ('admin', 'member')),
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references profiles(id) on delete set null,
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table family_invitations
  add column if not exists profile_id uuid references profiles(id) on delete set null;

-- ── TASKS ───────────────────────────────────────────────────
create table if not exists tasks (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families(id) on delete cascade,
  title            text not null,
  description      text,
  points           integer not null default 0,
  created_by       uuid references profiles(id) on delete set null,
  is_recurring     boolean not null default false,
  recurring_pattern jsonb,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table tasks
  add column if not exists deadline date,
  add column if not exists penalty_points integer;

-- default_state con CHECK (idempotente)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'tasks' and column_name = 'default_state'
  ) then
    alter table tasks add column default_state text not null default 'pending'
      check (default_state in ('pending', 'completed'));
  end if;
end $$;

-- ── TASK ASSIGNMENTS ────────────────────────────────────────
create table if not exists task_assignments (
  task_id    uuid not null references tasks(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (task_id, profile_id)
);

-- ── TASK INSTANCES ──────────────────────────────────────────
create table if not exists task_instances (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references tasks(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,
  date           date not null,
  state          text not null default 'pending',
  points_awarded integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (task_id, profile_id, date)
);

-- Actualizar constraint de state
alter table task_instances drop constraint if exists task_instances_state_check;
update task_instances set state = 'failed'    where state = 'not_completed';
update task_instances set state = 'cancelled' where state = 'omitted';
alter table task_instances
  add constraint task_instances_state_check
  check (state in ('pending', 'completed', 'failed', 'cancelled'));

-- ── REWARDS ─────────────────────────────────────────────────
create table if not exists rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null,
  description text,
  points_cost integer not null default 0,
  emoji       text not null default '🎁',
  status      text not null default 'available' check (status in ('available', 'disabled')),
  mystery_prizes jsonb,        -- array of {name, emoji, weight}; null = standard reward
  created_at  timestamptz not null default now()
);

-- ── REWARD CLAIMS ───────────────────────────────────────────
create table if not exists reward_claims (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null references rewards(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id) on delete set null,
  revealed_prize jsonb,         -- {name, emoji} of randomly selected prize; null = standard claim
  constraint no_self_approval check (resolved_by is null or resolved_by != profile_id)
);

-- ── POINTS TRANSACTIONS ─────────────────────────────────────
create table if not exists points_transactions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  amount        integer not null,
  type          text not null check (type in ('task', 'reward', 'adjustment', 'streak')),
  description   text not null,
  emoji         text not null default '⭐',
  created_at    timestamptz not null default now(),
  balance_after integer not null
);

-- ── BOARD MESSAGES ──────────────────────────────────────────
create table if not exists board_messages (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  type        text not null default 'message'
              check (type in ('message', 'achievement', 'reward', 'announcement', 'points')),
  content     text not null,
  emoji       text,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── BOARD REACTIONS ─────────────────────────────────────────
-- message_id is generic: can reference board_messages OR points_transactions
create table if not exists board_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null,
  profile_id  uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (message_id, profile_id, emoji)
);

-- Drop FK if it exists (idempotent for existing DBs)
alter table board_reactions drop constraint if exists board_reactions_message_id_fkey;

-- ── TASK TEMPLATES ──────────────────────────────────────────
create table if not exists task_templates (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  description text,
  emoji       text not null default '📋',
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists task_template_items (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid not null references task_templates(id) on delete cascade,
  title             text not null,
  description       text,
  points            integer not null default 0,
  recurring_pattern jsonb not null,
  penalty_points    integer
);

-- ────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────
create index if not exists profiles_family_id on profiles (family_id);
create index if not exists profiles_auth_user_id on profiles (auth_user_id);
create index if not exists tasks_family_id on tasks (family_id);
create index if not exists task_assignments_profile_id on task_assignments (profile_id);
create index if not exists task_instances_profile_date on task_instances (profile_id, date);
create index if not exists task_instances_task_id on task_instances (task_id);
create index if not exists task_instances_profile_date_range on task_instances (profile_id, date);
create index if not exists rewards_family_id on rewards (family_id);
create index if not exists reward_claims_profile_id on reward_claims (profile_id);
create index if not exists reward_claims_reward_id on reward_claims (reward_id);
create index if not exists points_transactions_profile_created on points_transactions (profile_id, created_at desc);
create index if not exists family_invitations_token on family_invitations (token);
create index if not exists family_invitations_family_id on family_invitations (family_id);
create index if not exists board_messages_family_created on board_messages (family_id, created_at desc);
create index if not exists board_reactions_message_id on board_reactions (message_id);
create index if not exists task_templates_family_id on task_templates (family_id);
create index if not exists task_template_items_template_id on task_template_items (template_id);

-- ────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

create or replace function get_my_family_id()
returns uuid
language sql stable security definer
as $$
  select family_id from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function get_my_profile_id()
returns uuid
language sql stable security definer
as $$
  select id from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_family_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function email_exists_in_auth(p_email text)
returns boolean
language sql security definer
set search_path = auth, public
as $$
  select exists(select 1 from auth.users where email = p_email);
$$;

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table families            enable row level security;
alter table profiles            enable row level security;
alter table family_invitations  enable row level security;
alter table tasks               enable row level security;
alter table task_assignments    enable row level security;
alter table task_instances      enable row level security;
alter table rewards             enable row level security;
alter table reward_claims       enable row level security;
alter table points_transactions enable row level security;
alter table board_messages      enable row level security;
alter table board_reactions     enable row level security;
alter table task_templates      enable row level security;
alter table task_template_items enable row level security;

-- Drop all policies first (idempotente)
do $$
declare
  r record;
begin
  for r in (
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'families','profiles','family_invitations','tasks',
        'task_assignments','task_instances','rewards',
        'reward_claims','points_transactions','board_messages',
        'board_reactions','task_templates','task_template_items'
      )
  ) loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── families ────────────────────────────────────────────────
create policy "members can read their family"
  on families for select
  using (id = get_my_family_id());

create policy "authenticated users can create a family"
  on families for insert
  with check (auth.uid() is not null);

create policy "admins can update their family"
  on families for update
  using (id = get_my_family_id() and is_family_admin())
  with check (id = get_my_family_id() and is_family_admin());

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

create policy "user can insert own profile on signup"
  on profiles for insert
  with check (auth_user_id = auth.uid());

create policy "user can update own role"
  on profiles for update
  using (auth_user_id = auth.uid());

create policy "admins can delete family profiles"
  on profiles for delete
  using (
    family_id = get_my_family_id()
    and is_family_admin()
    and id != get_my_profile_id()
  );

-- ── family_invitations ──────────────────────────────────────
create policy "admins can manage invitations"
  on family_invitations for all
  using (is_family_admin() and family_id = get_my_family_id());

create policy "anyone can read invitation by token"
  on family_invitations for select
  using (true);

-- ── tasks ───────────────────────────────────────────────────
create policy "family members can read tasks"
  on tasks for select
  using (family_id = get_my_family_id());

create policy "admins can manage tasks"
  on tasks for all
  using (is_family_admin() and family_id = get_my_family_id());

-- ── task_assignments ────────────────────────────────────────
create policy "family members can read assignments"
  on task_assignments for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "admins can manage assignments"
  on task_assignments for all
  using (is_family_admin());

create policy "members can insert own assignments"
  on task_assignments for insert
  with check (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
  );

-- ── task_instances ──────────────────────────────────────────
create policy "family members can read instances"
  on task_instances for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "admins can manage instances"
  on task_instances for all
  using (is_family_admin());

create policy "members can insert own instances"
  on task_instances for insert
  with check (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "members can update own instances"
  on task_instances for update
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

-- ── rewards ─────────────────────────────────────────────────
create policy "family members can read rewards"
  on rewards for select
  using (family_id = get_my_family_id());

create policy "admins can manage rewards"
  on rewards for all
  using (is_family_admin() and family_id = get_my_family_id());

-- ── reward_claims ───────────────────────────────────────────
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

create policy "admins can resolve others claims"
  on reward_claims for update
  using (
    is_family_admin()
    and profile_id != get_my_profile_id()
  );

-- ── points_transactions ─────────────────────────────────────
create policy "family members can read transactions"
  on points_transactions for select
  using (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

create policy "family members can insert transactions"
  on points_transactions for insert
  with check (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

-- ── board_messages ──────────────────────────────────────────
create policy "family members can read board messages"
  on board_messages for select
  using (family_id = get_my_family_id());

create policy "family members can post messages"
  on board_messages for insert
  with check (family_id = get_my_family_id());

create policy "admins can update board messages"
  on board_messages for update
  using (family_id = get_my_family_id() and is_family_admin());

create policy "admins can delete board messages"
  on board_messages for delete
  using (family_id = get_my_family_id() and is_family_admin());

-- ── board_reactions ─────────────────────────────────────────
create policy "family members can read reactions"
  on board_reactions for select
  using (
    message_id in (
      select id from board_messages where family_id = get_my_family_id()
    )
    or message_id in (
      select id from points_transactions where profile_id in (
        select id from profiles where family_id = get_my_family_id()
      )
    )
  );

create policy "family members can add reactions"
  on board_reactions for insert
  with check (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
    and (
      message_id in (select id from board_messages where family_id = get_my_family_id())
      or message_id in (
        select id from points_transactions where profile_id in (
          select id from profiles where family_id = get_my_family_id()
        )
      )
    )
  );

create policy "members can remove own reactions"
  on board_reactions for delete
  using (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
  );

-- ── task_templates ──────────────────────────────────────────
create policy "family members can read templates"
  on task_templates for select
  using (family_id = get_my_family_id());

create policy "admins can manage templates"
  on task_templates for all
  using (is_family_admin() and family_id = get_my_family_id());

-- ── task_template_items ─────────────────────────────────────
create policy "family members can read template items"
  on task_template_items for select
  using (
    template_id in (select id from task_templates where family_id = get_my_family_id())
  );

create policy "admins can manage template items"
  on task_template_items for all
  using (
    exists (
      select 1 from task_templates
      where id = task_template_items.template_id
        and family_id = get_my_family_id()
        and is_family_admin()
    )
  );

-- ────────────────────────────────────────────────────────────
-- TRIGGER: crear perfil al registrarse un nuevo usuario
-- ────────────────────────────────────────────────────────────

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
  v_found boolean := false;
begin
  v_token := new.raw_user_meta_data->>'invitation_token';

  -- 1) Intentar por token de metadata (signup desde /join con email+password)
  if v_token is not null then
    select * into v_invitation
    from family_invitations
    where token = v_token
      and accepted_at is null
      and expires_at > now();
    v_found := found;
  end if;

  -- 2) Si no hay token o era inválido, buscar por email
  --    (cubre inviteUserByEmail y Google OAuth)
  if not v_found then
    select * into v_invitation
    from family_invitations
    where email = new.email
      and accepted_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;
    v_found := found;
  end if;

  -- 3) Si hay invitación válida → unirse a la familia existente
  if v_found then
    v_family_id := v_invitation.family_id;

    update family_invitations
    set accepted_at = now()
    where id = v_invitation.id;

    -- Si la invitación tiene un perfil asociado, linkear en vez de crear
    if v_invitation.profile_id is not null then
      update profiles
      set auth_user_id = new.id
      where id = v_invitation.profile_id
        and auth_user_id is null;
    else
      -- Sin perfil asociado: crear perfil nuevo
      insert into profiles (auth_user_id, family_id, name, avatar, role)
      values (
        new.id,
        v_family_id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar', '😊'),
        v_invitation.role
      );
    end if;

  else
    -- 4) Sin invitación → fundar nueva familia
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

-- Recrear trigger (idempotente)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
