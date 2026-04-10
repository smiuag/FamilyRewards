-- ============================================================
-- Actualización del modelo de instancias de tareas
-- ============================================================

-- 1. Reemplazar el CHECK constraint de task_instances.state
--    Viejos valores: pending, completed, not_completed, omitted
--    Nuevos valores: pending, completed, failed, cancelled
ALTER TABLE task_instances
  DROP CONSTRAINT IF EXISTS task_instances_state_check;

-- Migrar valores heredados al nuevo modelo antes de añadir el nuevo constraint
UPDATE task_instances SET state = 'failed'     WHERE state = 'not_completed';
UPDATE task_instances SET state = 'cancelled'  WHERE state = 'omitted';

ALTER TABLE task_instances
  ADD CONSTRAINT task_instances_state_check
  CHECK (state IN ('pending', 'completed', 'failed', 'cancelled'));

-- 2. Añadir penalty_points y default_state a tasks
--    NULL significa "misma penalización que points"; 0 = sin penalización
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS penalty_points integer;

-- default_state para tareas no recurrentes (recurrentes usan recurring_pattern->defaultState)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS default_state text NOT NULL DEFAULT 'pending'
  CHECK (default_state IN ('pending', 'completed'));

-- 3. La columna deadline ya fue añadida en la migración anterior (20260410000000)
--    Solo aseguramos que exista por si se aplican en orden diferente
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deadline date;

-- 4. Índice útil para el backfill: buscar instancias por profile + rango de fechas
CREATE INDEX IF NOT EXISTS task_instances_profile_date_range
  ON task_instances (profile_id, date);
