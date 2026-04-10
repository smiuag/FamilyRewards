-- Permitir a admins eliminar perfiles de su familia (excepto a sí mismos)
create policy "admins can delete family profiles"
  on profiles for delete
  using (
    family_id = get_my_family_id()
    and is_family_admin()
    and id != get_my_profile_id()
  );
