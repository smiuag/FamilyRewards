-- ============================================================
-- FamilyRewards — Reset completo de datos
-- Borra TODOS los datos de TODAS las tablas para empezar de 0.
-- Los auth users de Supabase también se eliminan.
-- El schema (tablas, índices, RLS, funciones) NO se toca.
--
-- Ejecutar en el SQL Editor de Supabase.
-- Después, el primer usuario que se registre fundará una familia nueva.
-- ============================================================

-- Desactivar triggers temporalmente para evitar cascadas innecesarias
set session_replication_role = 'replica';

-- ── Tablas de datos (orden seguro por dependencias) ────────

truncate table task_template_items    cascade;
truncate table task_templates         cascade;
truncate table board_messages         cascade;
truncate table points_transactions    cascade;
truncate table reward_claims          cascade;
truncate table task_instances         cascade;
truncate table task_assignments       cascade;
truncate table tasks                  cascade;
truncate table rewards                cascade;
truncate table family_invitations     cascade;
truncate table profiles               cascade;
truncate table families               cascade;

-- ── Auth users (Supabase internal) ─────────────────────────
-- Esto borra todos los usuarios de auth.users.
-- Los profiles ya se borraron arriba; el trigger on_auth_user_created
-- creará familia + perfil cuando alguien se registre de nuevo.

delete from auth.sessions;
delete from auth.refresh_tokens;
delete from auth.mfa_factors;
delete from auth.identities;
delete from auth.users;

-- Reactivar triggers
set session_replication_role = 'origin';

-- ============================================================
-- Listo. La BD está vacía. Registra un usuario para empezar.
-- ============================================================
