-- ── Task Templates ──────────────────────────────────────────
-- Stores saved configurations of recurring tasks that can be
-- applied to family members (e.g. "Curso escolar", "Verano").

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

-- Indexes
create index if not exists task_templates_family_id on task_templates (family_id);
create index if not exists task_template_items_template_id on task_template_items (template_id);

-- RLS
alter table task_templates      enable row level security;
alter table task_template_items enable row level security;

create policy "family members can read templates"
  on task_templates for select
  using (family_id = get_my_family_id());

create policy "admins can manage templates"
  on task_templates for all
  using (is_family_admin() and family_id = get_my_family_id());

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
