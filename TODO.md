# FamilyRewards — Backend & Auth TODO

> Decisiones tomadas en diseño. Pendiente de implementación.

---

## Stack decidido

- **Base de datos / Backend**: Supabase (Postgres + Auth + Realtime + RLS)
- **Hosting actual**: Vercel (sin cambios)
- **Estado en cliente**: Zustand como caché local, sincronizado con Supabase

---

## Modelo de datos

- Añadir tabla `families` y tabla de unión `family_members` (en lugar de `familyId` directo en `users`)
  - Permite que un usuario pertenezca a más de una familia en el futuro
- Mantener el resto de tipos actuales (`tasks`, `task_instances`, `rewards`, `claims`, `transactions`)
- Row Level Security en todas las tablas: cada familia solo ve sus propios datos

---

## Modelo de autenticación

### Tipos de miembro

| Tipo | Cuenta Supabase | Puede iniciar sesión | Notas |
|------|----------------|---------------------|-------|
| Auth member | Sí (email + contraseña) | Sí | Adultos, mayores con email |
| Managed profile | No | No | Niños pequeños, perfiles sin email |

### Roles

- `admin` y `member`
- Puede haber **múltiples admins** en una familia
- Cualquier admin puede **promover** a otro miembro a admin
- Nadie puede **quitar** el admin a otro
- Un admin puede **degradarse a sí mismo** a member, solo si queda al menos otro admin

### Flujo de fundación

1. Usuario nuevo entra a la app sin familia
2. Se registra con email + contraseña → crea su cuenta Supabase
3. Funda la familia (le da nombre) → se convierte en primer admin

### Flujo de invitación

1. Admin envía invitación por email indicando rol (`admin` o `member`)
2. Se genera un token con caducidad de **7 días**
3. El destinatario hace clic en el enlace → crea su cuenta Supabase → queda vinculado a la familia con el rol asignado
4. Las invitaciones pueden reenviarse y caducan automáticamente

### Creación de perfiles sin cuenta

- El admin puede crear un perfil (nombre + avatar + rol) sin email
- Este perfil no tiene cuenta Supabase, solo existe como fila en la base de datos
- Solo los admins pueden gestionar estos perfiles

---

## Sesión y cambio de perfil (PIN)

### Comportamiento general

- La sesión persiste en el dispositivo: al reabrir la app se entra directamente al último perfil activo, sin pedir contraseña
- La contraseña completa (Supabase Auth) solo se pide en:
  - Primera vez en un dispositivo nuevo
  - Reset/olvido de PIN

### PIN de dispositivo

- Cada miembro **puede configurar opcionalmente un PIN de 4 dígitos** para su perfil en cada dispositivo
- El PIN es local al dispositivo (no se almacena en el servidor)
- Al cambiar de perfil en el selector de avatares:
  - Perfil **sin PIN configurado** → acceso directo
  - Perfil **con PIN** → pide PIN
  - Perfil **sin cuenta (niño)** → igual que arriba (PIN opcional)
- Los admins pueden decidir si quieren PIN — no se les obliga (la familia confía en el contexto)

### Cierre de sesión completo

- Opción explícita "Cerrar sesión en este dispositivo"
- Borra la sesión de Supabase y el PIN local
- Vuelve a pedir email + contraseña la próxima vez

---

## Reglas de negocio a garantizar en RLS / servidor

- Un miembro **no puede aprobar sus propias reclamaciones de recompensa**
- Solo los admins pueden crear/editar tareas, recompensas y miembros
- Solo los admins pueden aprobar/rechazar reclamaciones
- La degradación de admin a member de uno mismo solo es posible si queda al menos otro admin

---

## Realtime

- Activar subscripciones en tiempo real en:
  - `task_instances` (el admin marca tarea → el miembro lo ve al momento)
  - `reward_claims` (admin aprueba → miembro ve el cambio)
  - `users` (puntos actualizados en tiempo real)

---

## Fases de implementación

### Fase 1 — Schema y proyecto Supabase
- [ ] Crear proyecto en Supabase (manual en supabase.com)
- [x] Definir schema SQL completo con RLS → `supabase/migrations/20260407000000_initial_schema.sql`
- [x] Instalar `@supabase/supabase-js` y `@supabase/ssr`
- [x] Crear clientes Supabase → `apps/web/lib/supabase/{client,server,middleware}.ts`
- [x] Crear middleware Next.js con session refresh + i18n → `apps/web/middleware.ts`
- [x] Crear `.env.local.example` con variables necesarias
- [ ] Crear `.env.local` real copiando `.env.local.example` y rellenando con claves del proyecto Supabase

### Fase 2 — Auth básica
- [ ] Pantalla de registro / login (email + contraseña)
- [ ] Flujo de fundación de familia
- [ ] Middleware Next.js para proteger rutas

### Fase 3 — Invitaciones y perfiles
- [ ] Sistema de invitación por email con token
- [ ] Creación de perfiles sin cuenta (managed profiles)
- [ ] Selector de perfil / avatares en dispositivo compartido

### Fase 4 — PIN de dispositivo
- [ ] Configuración de PIN por perfil en settings
- [ ] Lógica de cambio de perfil con PIN
- [ ] Cierre de sesión completo

### Fase 5 — Migración del store
- [ ] Reemplazar mock-data por queries Supabase al cargar
- [ ] Convertir acciones del store en mutations + sync con Supabase
- [ ] Activar Realtime en tablas clave

### Fase 6 — Gestión de roles
- [ ] UI para promover miembro a admin
- [ ] UI para degradarse a sí mismo (con validación de mínimo 1 admin)
- [ ] Transferencia de admin si el fundador abandona la familia
