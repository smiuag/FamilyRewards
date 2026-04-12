-- Make board_reactions generic: allow reactions on board_messages AND points_transactions
-- Drop FK so message_id can reference either table (UUIDs won't collide)

alter table board_reactions drop constraint if exists board_reactions_message_id_fkey;

-- Update RLS policies to also allow reactions on transactions
drop policy if exists "family members can read reactions" on board_reactions;
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

drop policy if exists "family members can add reactions" on board_reactions;
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
