-- Permitir a admins actualizar el nombre de su familia
create policy "admins can update their family"
  on families for update
  using (id = get_my_family_id() and is_family_admin())
  with check (id = get_my_family_id() and is_family_admin());
