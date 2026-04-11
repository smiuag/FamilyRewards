-- Permitir invitaciones sin email (flujo de enlace compartido)
ALTER TABLE family_invitations ALTER COLUMN email DROP NOT NULL;
