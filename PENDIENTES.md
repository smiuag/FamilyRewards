# Pendientes FamilyRewards

---

## 🔴 Datos mock pendientes de eliminar

### Dashboard — datos hardcodeados
- [ ] **`DashboardClient.tsx:59`** — `MOCK_USER_STATS[currentUser.id]` para mostrar logros recientes. Debe calcular las estadísticas reales igual que hace `AchievementsClient` (ya tiene la función `computeUserStats` con `useMemo`). Si no tiene el ID real (familia nueva), la sección de logros debe quedar vacía o mostrar "aún no hay logros".
- [ ] **`DashboardClient.tsx:65`** — `MOCK_BOARD_MESSAGES.slice(0,2)` para el widget de mensajes recientes del tablón. El tablón (`BoardClient`) usa estado local sin persistencia → hace falta un store o tabla Supabase `board_messages` para que el dashboard pueda leer los mensajes reales.
- [ ] **`DashboardClient.tsx:319`** — `MOCK_USERS.find(...)` para resolver el autor del mensaje en el widget del tablón. Cambiar a `users.find(...)` del store (ya disponible en el componente).

### Challenges — datos hardcodeados
- [ ] **`ChallengesClient.tsx:165`** — `MOCK_USERS.find(...)` para mostrar el avatar/nombre del contribuyente en cada reto. Cambiar a `users.find(...)` del store (`useAppStore`).

### Datos mock definidos pero nunca usados (dead code a eliminar)
- [ ] **`lib/challenges/index.ts`** — `MOCK_CHALLENGES` (3 retos con IDs u1/u2/u3 hardcodeados). El store arranca vacío → este array es dead code puro.
- [ ] **`lib/multipliers/index.ts`** — `MOCK_MULTIPLIERS` (3 multiplicadores con IDs u1/u2/u3 hardcodeados). Mismo caso, nunca importado.
- [ ] **`lib/mock-data/index.ts`** — `MOCK_USERS`, `MOCK_TASKS`, `MOCK_TASK_INSTANCES`, `MOCK_REWARDS`, `MOCK_CLAIMS`, `MOCK_POINTS_HISTORY`, `MOCK_FAMILY`. Todas importadas solo por `DashboardClient` (`MOCK_USERS`) y dead code en el resto. Al migrar Dashboard, se puede borrar el fichero entero.
- [ ] **`lib/mock-data/board.ts`** — `MOCK_BOARD_MESSAGES` con 7 mensajes usando IDs u1/u2/u3. Solo lo usa `DashboardClient`. Eliminar cuando se migre el widget del tablón.
- [ ] **`lib/achievements/index.ts`** — `MOCK_USER_STATS` (estadísticas hardcodeadas de u1/u2/u3). Solo lo usa `DashboardClient`. Eliminar al computar stats reales.

### Posible dato persistido en localStorage
- [ ] Si al añadir una tarea o en cualquier selector de miembros aparecen "María", "Ana" o "Pablo", es que el Zustand store tiene datos del template original persistidos en `localStorage`. La solución es que `initRealAuth` sobrescriba siempre el array `users` con lo que devuelve Supabase (verificar que no haya merge parcial). Como workaround temporal: borrar `localStorage` desde las DevTools del navegador.

---

## 🟡 Accesibilidad (a11y) para invidentes

- [ ] **Roles ARIA y landmarks** — añadir `role="main"`, `role="navigation"`, `role="banner"` en el layout principal; `role="list"` / `role="listitem"` donde corresponda.
- [ ] **Etiquetas para lectores de pantalla** — todos los botones icono (sin texto visible) necesitan `aria-label`. Revisar especialmente: botones de ajuste de puntos (+/-), botón de copiar enlace, botones de avatar en selectores.
- [ ] **Formularios accesibles** — asociar cada `<Label>` con su input mediante `htmlFor` / `id` si no lo está ya. Los inputs sin label visible deben tener `aria-label`.
- [ ] **Focus visible** — verificar que el foco de teclado sea siempre visible (outline). Tailwind v4 puede sobreescribir el outline por defecto; revisar que `focus-visible:ring` esté presente en todos los elementos interactivos.
- [ ] **Navegación por teclado** — todo el flujo crítico (login → dashboard → completar tarea → canjear recompensa) debe ser completamente operable solo con teclado (Tab, Enter, Space, Escape para cerrar modales).
- [ ] **Modales y diálogos** — los `AppModal` deben atrapar el foco mientras están abiertos (`aria-modal="true"`, focus trap) y devolverlo al elemento disparador al cerrar.
- [ ] **Selectores de emoji/avatar** — la cuadrícula de avatares es inaccesible para lectores de pantalla; cada botón necesita `aria-label` con el nombre del emoji (ej. `aria-label="Niño"`).
- [ ] **Tablas** — las `<Table>` del admin deben tener `<caption>` o `aria-label` descriptivo.
- [ ] **Textos alternativos** — los emojis usados como iconos decorativos deben tener `aria-hidden="true"`; los usados como información deben tener `aria-label`.
- [ ] **Contraste de color** — revisar que los colores oklch del tema cumplan WCAG AA (ratio 4.5:1 para texto normal, 3:1 para texto grande). Especialmente los grises de `text-muted-foreground`.
- [ ] **Anuncios dinámicos** — acciones como "tarea completada" o "puntos ajustados" deben anunciarse a lectores de pantalla con `aria-live="polite"` o usando los toasts de Sonner con soporte ARIA.
- [ ] **Orden de lectura** — verificar que el orden DOM coincida con el orden visual en todas las páginas (especialmente en grids con Tailwind `order-*`).

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
