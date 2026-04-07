# Pendientes FamilyRewards

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

---

## ✅ Completado

### Migración a Supabase
- [x] **FASE 3 — Miembros**: crear/editar/ajuste de puntos → `profiles` + `points_transactions` en Supabase
- [x] **FASE 3 — Invitaciones**: `createInvitation` → `family_invitations`; `JoinClient` acepta token y crea perfil
- [x] **FASE 3 — ProfileSelectClient**: siempre lee perfiles desde Supabase en el mount
- [x] **FASE 3 — OnboardingWizard**: miembro/tarea/recompensa inicial → persisten en Supabase
- [x] **FASE 3 — SeasonTemplatesClient**: aplicar pack → `createTask`/`createReward` en Supabase
- [x] **FASE 3 — useAppStore**: estado inicial vacío (sin MOCK data); eliminadas acciones locales `addMember`/`addTask`/`addReward`
- [x] **FASE 4 — Tareas**: crear/editar/desactivar tareas, asignar a miembros, `task_instances` del día, marcar completada/omitida → Supabase
- [x] **FASE 4 — Catálogo Tareas**: al añadir del catálogo → guarda en `tasks`; modal usa store real en vez de MOCK_USERS
- [x] **FASE 4 — CalendarClient**: resuelve nombre de tarea desde store real
- [x] **FASE 4 — AdminMembersClient**: contadores "tareas hoy" usan store real
- [x] **FASE 5 — Recompensas**: crear/editar recompensas → `rewards`; leer recompensas y canjes desde Supabase
- [x] **FASE 5 — Catálogo Recompensas**: al añadir del catálogo → guarda en `rewards`
- [x] **FASE 5 — RewardsClient**: solicitar canje → `reward_claims`; aprobar/rechazar → actualiza `reward_claims` y `points_transactions`
- [x] **FASE 6 — ProfileClient**: historial desde `points_transactions`; `completedThisMonth` calculado desde Supabase
- [x] **FASE 6 — Admin → Stats**: usa store real (users, taskInstances, claims, rewards)
- [x] **FASE 7 — Board**: empieza vacío (sin MOCK_BOARD_MESSAGES); autores resueltos desde store
- [x] **FASE 7 — Achievements**: `UserStats` calculado desde datos reales (taskInstances, claims, balance)
- [x] **FASE 7 — Challenges/Multipliers**: stores arrancan vacíos (sin MOCK data), persistidos en Zustand
- [x] **FASE 7 — Reports**: `buildMemberReport`/`buildFamilyReport` usan `tasks[]` del store en vez de MOCK_TASKS
- [x] **FASE 7 — Admin → Challenges/Multipliers**: usan store users/tasks en vez de MOCK

### UI / Funcionalidades
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
- [x] Catálogos (tareas y recompensas): filtro de categoría muestra label en vez de "all"
- [x] Catálogo de tareas: fichas alineadas aunque unas tengan días y otras no; días recurrentes editables en modal
- [x] Avatares ampliados (~75 emojis) en selección de perfil y wizard de invitación
- [x] `points_transactions` registradas al completar tarea y al aprobar canje
