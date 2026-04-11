-- Add vacation mode: when set, recurring tasks are paused and streaks are not broken
alter table profiles add column if not exists vacation_until date;
