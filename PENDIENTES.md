# Pendientes FamilyRewards

## 🔴 Migración a Supabase — datos reales

Todo lo que sigue usa datos mock/Zustand local y necesita conectarse a Supabase.
El esquema de base de datos ya existe (`supabase/migrations/20260407000000_initial_schema.sql`).

### FASE 3 — Miembros e invitaciones
- [ ] **Admin → Miembros**: guardar nuevos miembros en `profiles` de Supabase (ahora solo es local)
- [ ] **Admin → Miembros**: editar nombre/avatar/rol y persistirlo en Supabase
- [ ] **Admin → Miembros**: ajuste de puntos → guardar en `points_transactions` y actualizar `profiles.points_balance`
- [ ] **Invitaciones**: flujo para invitar a otro adulto como administrador (tabla `family_invitations`, email con link de join)
- [ ] **ProfileSelectClient**: leer perfiles desde Supabase en lugar de solo al hacer login (refrescar si cambian)

### FASE 4 — Tareas
- [ ] **Admin → Tareas**: crear/editar/desactivar tareas → tabla `tasks` en Supabase
- [ ] **Admin → Tareas**: asignar tareas a miembros → tabla `task_assignments`
- [ ] **Admin → Catálogo Tareas**: al añadir una tarea del catálogo, guardarla en `tasks`
- [ ] **TasksClient / DashboardClient**: leer `task_instances` desde Supabase para el día actual
- [ ] **TasksClient**: marcar completada/omitida → actualizar `task_instances` en Supabase
- [ ] **CalendarClient**: usa `MOCK_TASKS` para resolver nombre de tarea → usar store real
- [ ] **AdminMembersClient**: contadores "tareas hoy" usan `MOCK_TASK_INSTANCES` → usar store real

### FASE 5 — Recompensas y canjes
- [ ] **Admin → Recompensas**: crear/editar recompensas → tabla `rewards` en Supabase
- [ ] **Admin → Catálogo Recompensas**: al añadir del catálogo, guardar en `rewards`
- [ ] **RewardsClient**: leer recompensas y canjes desde Supabase
- [ ] **RewardsClient**: solicitar canje → insertar en `reward_claims`
- [ ] **Admin → Recompensas**: aprobar/rechazar canje → actualizar `reward_claims` y `points_transactions`

### FASE 6 — Puntos e historial
- [ ] **ProfileClient**: historial de puntos usa `MOCK_POINTS_HISTORY` → leer `points_transactions` de Supabase
- [ ] **ProfileClient**: `completedThisMonth` es valor hardcodeado → calcular desde Supabase
- [ ] **Admin → Stats**: toda la página usa `MOCK_USERS`, `MOCK_TASK_INSTANCES`, `MOCK_CLAIMS`, `MOCK_REWARDS` → store real / Supabase

### FASE 7 — Funcionalidades avanzadas (datos mock)
- [ ] **Board** (`BoardClient`, `DashboardClient`): mensajes hardcodeados en `MOCK_BOARD_MESSAGES` → tabla nueva en Supabase
- [ ] **Achievements**: `MOCK_USER_STATS` hardcodeado → calcular desde datos reales
- [ ] **Challenges** (`useChallengesStore`): usa `MOCK_CHALLENGES` → tabla en Supabase
- [ ] **Multipliers** (`useMultipliersStore`): usa `MOCK_MULTIPLIERS` → tabla en Supabase
- [ ] **Reports** (`lib/reports/index.ts`): usa `MOCK_TASKS` para calcular top task → usar store real
- [ ] **Admin → Multipliers**: `MOCK_USERS` y `MOCK_TASKS` para mostrar nombres → usar store real
- [ ] **Admin → Challenges**: `MOCK_USERS` para mostrar participantes → usar store real
- [ ] **CatalogTasksClient**: asignación en modal usa `MOCK_USERS` → usar store real

---

## 🟡 APK de pruebas (TWA)
Pasos pendientes una vez el deploy de Vercel funcione:
1. Añadir `manifest.json` y meta PWA a la web (iconos, theme-color, display: standalone)
2. Instalar Bubblewrap: `npm i -g @bubblewrap/cli`
3. `bubblewrap init --manifest https://family-awards.vercel.app/manifest.json`
4. `bubblewrap build` → genera el .apk
5. Necesita Java 11+ y Android SDK (Bubblewrap puede descargarlos)

## 🟠 Autenticación con Google (OAuth)
- [ ] Habilitar proveedor Google en Supabase Dashboard (Authentication → Providers)
- [ ] Añadir `NEXT_PUBLIC_GOOGLE_CLIENT_ID` y secret en variables de entorno
- [ ] LoginClient: añadir botón "Continuar con Google" → `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] RegisterClient: mismo botón en el flujo de registro
- [ ] Gestionar callback OAuth en `/auth/confirm` (ya existe, Supabase lo maneja automáticamente)
- [ ] Al primer login con Google: si no tiene perfil en `profiles`, redirigir a onboarding/creación de familia

## 🟢 Mejoras UI pendientes
- [ ] Botones sin handler pendientes de revisar (profile edit, settings save, board pin/delete mensajes)
- [ ] El multiplicador activo debería mostrarse también en la vista de Tareas junto a cada tarea afectada
- [ ] Admin/Stats — página existe pero podría enriquecerse con los datos de reports
- [ ] NEXT_PUBLIC_AUTH_ENABLED sigue en `false` — activar protección de rutas cuando la migración a Supabase esté completa

## ✅ Completado

- [x] Sidebar: secciones colapsables, jerarquía visual, separadores
- [x] Wizard de onboarding: orden de pasos, código postal, custom inline, traducciones
- [x] Wizard sale solo una vez; preserva estado entre logins
- [x] Al terminar wizard → redirige a Admin → Miembros
- [x] Badges `!` en sidebar (Miembros, Catálogo Tareas, Catálogo Recompensas)
- [x] Banners de primera visita en secciones de configuración
- [x] Auth real con Supabase: registro, login, profile-select
- [x] Ruta `/auth/confirm` para intercambio de token de confirmación de email
- [x] Skip re-login si Supabase devuelve sesión directamente tras registro
- [x] Pantalla de espera "Confirmando email" con auto-avance por onAuthStateChange
- [x] Recompensas objetivo, archivo de canjes, auto-aceptar si admin
- [x] Descubrimiento progresivo de funcionalidades (streaks desbloquea challenges/multipliers)
- [x] Plantillas de temporada con asignación de miembros
- [x] Catálogo de recompensas con modal de puntos editables y recompensa personalizada
