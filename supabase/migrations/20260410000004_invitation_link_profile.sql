-- ============================================================
-- Invitaciones vinculan al perfil existente en vez de crear nuevo
-- ============================================================

-- 1. Añadir columna profile_id a family_invitations
alter table family_invitations
  add column if not exists profile_id uuid references profiles(id) on delete set null;

-- 2. Actualizar trigger para linkear perfil existente
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

    -- Si la invitación tiene un perfil asociado, linkear en vez de crear
    if v_invitation.profile_id is not null then
      update profiles
      set auth_user_id = new.id
      where id = v_invitation.profile_id
        and auth_user_id is null;
    else
      -- Sin perfil asociado: crear perfil nuevo (invitación genérica)
      insert into profiles (auth_user_id, family_id, name, avatar, role)
      values (
        new.id,
        v_family_id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'avatar', '😊'),
        v_invitation.role
      );
    end if;

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
