-- Add deadline column to tasks table for non-recurring tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline date;
