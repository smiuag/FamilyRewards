-- Enable Realtime on key tables for live sync between family members
alter publication supabase_realtime add table task_instances;
alter publication supabase_realtime add table reward_claims;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table rewards;
alter publication supabase_realtime add table tasks;
