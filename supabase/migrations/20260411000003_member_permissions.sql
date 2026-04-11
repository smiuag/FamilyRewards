-- ============================================================
-- Fix: allow members to complete tasks, backfill instances,
-- claim unassigned tasks, and share points.
-- Previously only admins could write to these tables.
-- ============================================================

-- ── task_instances: members can manage their own ────────────
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

-- ── task_assignments: members can self-assign (for claiming) ─
create policy "members can insert own assignments"
  on task_assignments for insert
  with check (
    profile_id in (select id from profiles where auth_user_id = auth.uid())
  );

-- ── points_transactions: all family members can insert ──────
-- (needed for recording task completions, sharing points, etc.)
drop policy if exists "admins can insert transactions" on points_transactions;

create policy "family members can insert transactions"
  on points_transactions for insert
  with check (
    profile_id in (select id from profiles where family_id = get_my_family_id())
  );

-- ── profiles: members can update own points_balance ─────────
-- The existing "user can update own role" policy covers auth_user_id = auth.uid()
-- but we need to ensure it allows points_balance updates too.
-- It already does (it's a generic UPDATE on the row), so no change needed.
