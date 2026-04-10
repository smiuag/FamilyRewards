-- ============================================================
-- FIX: invitaciones — buscar por email además de por token
-- ============================================================
-- Problema: inviteUserByEmail crea el auth.users row sin
-- invitation_token en metadata, y Google OAuth tampoco lo lleva.
-- El trigger solo miraba metadata → creaba familia nueva.
--
-- Solución: si no hay token en metadata, buscar invitación
-- pendiente por email antes de crear familia nueva.
-- ============================================================

-- 1. Helper: comprobar si un email ya tiene cuenta en auth.users
create or replace function email_exists_in_auth(p_email text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists(select 1 from auth.users where email = p_email);
$$;

-- 2. Reemplazar trigger de nuevo usuario
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_invitation record;
  v_token text;
  v_found boolean := false;
begin
  v_token := new.raw_user_meta_data->>'invitation_token';

  -- 1) Intentar por token de metadata (signup desde /join con email+password)
  if v_token is not null then
    select * into v_invitation
    from family_invitations
    where token = v_token
      and accepted_at is null
      and expires_at > now();

    v_found := found;
  end if;

  -- 2) Si no hay token o era inválido, buscar por email
  --    (cubre inviteUserByEmail y Google OAuth)
  if not v_found then
    select * into v_invitation
    from family_invitations
    where email = new.email
      and accepted_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;

    v_found := found;
  end if;

  -- 3) Si hay invitación válida → unirse a la familia existente
  if v_found then
    v_family_id := v_invitation.family_id;

    update family_invitations
    set accepted_at = now()
    where id = v_invitation.id;

    insert into profiles (auth_user_id, family_id, name, avatar, role)
    values (
      new.id,
      v_family_id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'avatar', '😊'),
      v_invitation.role
    );

  else
    -- 4) Sin invitación → fundar nueva familia
    insert into families (name)
    values (coalesce(new.raw_user_meta_data->>'family_name', 'Mi familia'))
    returning id into v_family_id;

    insert into profiles (auth_user_id, family_id, name, avatar, role)
    values (
      new.id,
      v_family_id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'avatar', '😊'),
      'admin'
    );
  end if;

  return new;
end;
$$;
