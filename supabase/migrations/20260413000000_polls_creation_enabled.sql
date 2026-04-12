-- Allow admins to toggle whether members can create polls
alter table families
  add column if not exists polls_creation_enabled boolean not null default true;
