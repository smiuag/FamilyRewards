-- ============================================================
-- TABLÓN FAMILIAR: mensajes persistentes
-- ============================================================

create table board_messages (
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

create index on board_messages (family_id, created_at desc);

-- RLS
alter table board_messages enable row level security;

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
