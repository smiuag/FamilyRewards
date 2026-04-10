-- Mover estado de onboarding/setup a la tabla families (en vez de localStorage)
alter table families
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists setup_visited_members boolean not null default false,
  add column if not exists setup_visited_tasks boolean not null default false,
  add column if not exists setup_visited_rewards boolean not null default false;
