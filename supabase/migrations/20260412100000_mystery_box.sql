-- Mystery box: rewards can contain multiple possible prizes
-- When claimed, one prize is randomly selected and auto-approved

-- Add mystery_prizes to rewards (null = standard reward)
alter table rewards
  add column if not exists mystery_prizes jsonb;

-- Add revealed_prize to reward_claims (null = standard claim)
alter table reward_claims
  add column if not exists revealed_prize jsonb;

-- Comment for clarity
comment on column rewards.mystery_prizes is 'Array of {name, emoji, weight} objects. Null = standard reward.';
comment on column reward_claims.revealed_prize is '{name, emoji} of randomly selected prize. Null = standard claim.';
