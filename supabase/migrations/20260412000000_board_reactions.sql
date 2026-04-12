-- Board message reactions (emoji reactions from family members)
create table if not exists board_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references board_messages(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (message_id, profile_id, emoji)
);

create index if not exists board_reactions_message_id on board_reactions (message_id);

-- RLS
alter table board_reactions enable row level security;

create policy "family members can read reactions"
  on board_reactions for select
  using (
    message_id in (
      select id from board_messages where family_id = get_my_family_id()
    )
  );

create policy "family members can add reactions"
  on board_reactions for insert
  with check (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
    and message_id in (
      select id from board_messages where family_id = get_my_family_id()
    )
  );

create policy "members can remove own reactions"
  on board_reactions for delete
  using (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
  );
