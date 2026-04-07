# Pendientes FamilyRewards

## 🔴 Urgente — Deploy Vercel
- Verificar que https://family-rewards-zeta.vercel.app funciona tras el fix del middleware.ts
- Si sigue fallando, revisar los logs de build en Vercel dashboard
- El fix: se creó `apps/web/middleware.ts` con default export (el antiguo proxy.ts no lo reconocía Vercel)

## 🟡 Plugin Vercel en Claude Code
- Diego instaló `npx plugins add vercel/vercel-plugin` pero necesita reiniciar Claude Code para activarlo
- Una vez activo, Claude puede ver logs de deploy y redesplegar directamente

## 🟡 APK de pruebas (TWA)
Pasos pendientes una vez el deploy de Vercel funcione:
1. Añadir `manifest.json` y meta PWA a la web (iconos, theme-color, display: standalone)
2. Instalar Bubblewrap: `npm i -g @bubblewrap/cli`
3. `bubblewrap init --manifest https://family-rewards-zeta.vercel.app/manifest.json`
4. `bubblewrap build` → genera el .apk
5. Necesita Java 11+ y Android SDK (Bubblewrap puede descargarlos)

## 🟢 Mejoras pendientes de la maqueta

### Hechas en sesión actual
- [x] Geolocalizador por código postal en Ajustes
- [x] Plantillas de temporada: barra completa clickable, sin flechas separadas
- [x] Sidebar: "Mi perfil" en lugar del nombre, sin item de navegación "Perfil"
- [x] Recompensas "objetivo": marcar/desmarcar, sección separada en la vista
- [x] Catálogo de recompensas: modal de confirmación con puntos editables
- [x] Texto truncado en tarjetas del catálogo (línea 1 + ...)
- [x] Auto-aceptar solicitud de recompensa si quien canjea es administrador
- [x] Recompensas personalizadas: botón "Crear recompensa personalizada" en AdminRewardsClient

### Pendientes nuevas (2026-04-05)

- [x] **Recompensas personalizadas desde catálogo**
  - En la página de catálogo de recompensas (admin), añadir botón "Crear personalizada" que abra
    un modal vacío para crear una recompensa desde cero (no del catálogo predefinido).
  - El modal reutiliza el de AdminRewardsClient (emoji, nombre, descripción, puntos).

- [x] **Texto truncado en tarjetas del catálogo de recompensas**
  - La descripción en cada tarjeta debe truncarse a 1 línea (`line-clamp-1`) para que el botón
    "Añadir al catálogo" siempre quede en la misma posición vertical.

- [x] **Auto-aceptar recompensa si quien canjea es administrador**
  - En `RewardsClient.tsx`, si `currentUser.role === "admin"`, al confirmar el canje llamar
    también a `updateClaim(id, "approved")` en el mismo flujo, en lugar de dejarlo en "pending".
  - Mostrar un toast diferente: "Recompensa canjeada directamente" (sin esperar aprobación).

- [x] **Plantillas de temporada: asignar tareas a miembros concretos**
  - Al hacer clic en "Aplicar pack", antes de confirmar mostrar un paso de asignación:
    un selector múltiple de miembros (como el que tiene AdminTasksClient) para elegir
    a quiénes se les asignan las tareas de la plantilla.
  - Las recompensas del pack se añaden al catálogo familiar (sin asignación, son globales).
  - Guardar la decisión y llamar a `addTask` por cada tarea con `assignedTo` poblado.

- [x] **Descubrimiento progresivo de funcionalidades** (implementado para rachas; challenges/multipliers se ocultan hasta desbloquear "streaks")
  - Introducir un sistema de `featuresUnlocked: string[]` en el store (persistido).
  - Funcionalidades que empiezan bloqueadas (no visibles en el menú ni en el dashboard):
    - `"streaks"` — rachas y bonificaciones por racha
    - `"achievements"` — logros / medallas
    - `"challenges"` — retos familiares
    - `"multipliers"` — multiplicadores de puntos
    - `"board"` — tablón familiar
  - Reglas de desbloqueo:
    - `"streaks"`: cuando al completar una tarea alguien lleva 7 días consecutivos con
      todas las tareas completadas → al admin le aparece un toast/modal con la opción de
      "Bonificar racha y activar funcionalidad de rachas". Si acepta, `featuresUnlocked`
      añade `"streaks"` y se añade el nav item correspondiente.
    - `"achievements"`, `"challenges"`, `"multipliers"`, `"board"`: definir criterios
      similares (proponer criterios razonables antes de implementar).
  - En el sidebar y en la navegación, los items de esas secciones solo aparecen si la
    feature correspondiente está desbloqueada.

- [x] **Archivo de recompensas canjeadas (usuario)**
  - En `RewardsClient.tsx`, las solicitudes aprobadas o rechazadas se pueden "archivar"
    (botón pequeño en la esquina de cada tarjeta con estado resuelto).
  - Añadir al store: `archivedClaimIds: string[]` + `archiveClaim(claimId: string)`.
  - Las solicitudes archivadas desaparecen de la vista principal.
  - Nuevo apartado colapsable "Archivo" al final de la página, con las solicitudes
    archivadas ordenadas por `requestedAt` desc, mostrando emoji + nombre + fecha + estado.

### Otras pendientes anteriores
- [ ] Botones sin handler pendientes de revisar (profile edit, settings save, board pin/delete mensajes)
- [ ] El multiplicador activo debería mostrarse también en la vista de Tareas junto a cada tarea afectada
- [ ] Admin/Stats — página existe pero podría enriquecerse con los datos de reports
- [ ] Eliminar o deprecar `proxy.ts` una vez confirmado que middleware.ts funciona en producción
