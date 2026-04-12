# FamilyRewards — Pendientes, Ideas y Roadmap

> Actualizado: 2026-04-11
> Fichero unificado. Sustituye a TODO.md e IDEAS.md como fuente de verdad.
> PLANNING.md se conserva como referencia de arquitectura original.

---

## Estado actual del proyecto

**Stack**: Next.js + Supabase (Postgres + Auth + RLS) + Vercel + Zustand (solo UI)
**Auth**: Email/password + Google OAuth, sesión persistente (SessionGuard)
**Datos**: Todas las páginas consultan Supabase al montar. Store no persiste datos de servidor.

### Funcionalidades implementadas
- Familias, perfiles (admin/member), invitaciones por email con token
- Tareas recurrentes y puntuales con 4 estados (pending/completed/failed/cancelled)
- Tareas sin asignar (reclamables): primera persona que reclama se lleva los puntos
- Compartir puntos con ayudante tras completar tarea
- Penalizaciones configurables por tarea
- Recompensas, catálogo, canjes con aprobación admin
- Puntos, historial de transacciones, ajustes manuales
- Calendario mensual con indicadores de estado
- Dashboard con resumen diario, quick-complete, feed familiar
- Tablón familiar (board messages)
- Logros/achievements calculados desde datos reales
- Rachas (streaks) con desbloqueo progresivo
- Retos familiares (challenges) y multiplicadores de puntos
- Catálogos de tareas y recompensas predefinidos
- Onboarding wizard para nueva familia
- Plantillas de tareas recurrentes (BD + API + UI, ocultas del menú)
- SessionGuard: sesión sobrevive hard refresh y reinicio

---

## Pendiente — Funcional

### Prioritario
- [x] **Protección de rutas**: middleware redirige a login si no hay sesión (eliminado flag NEXT_PUBLIC_AUTH_ENABLED)
- [x] **PIN de dispositivo**: PIN 4 dígitos opcional en Settings, se pide al cambiar de usuario (local, no servidor)
- [x] **Realtime**: suscripciones Supabase en task_instances, reward_claims, profiles, rewards, tasks — cambios se reflejan sin recargar

### Gestión de roles
- [ ] UI para promover miembro a admin
- [ ] UI para degradarse a sí mismo (validar que queda al menos otro admin)

### Plantillas
- [ ] Reactivar en el menú cuando se quiera usar
- [ ] Ya está implementado: guardar config actual, crear/editar/eliminar, aplicar a miembros seleccionados

### Tareas
- [ ] Multiplicador activo debería verse también en la vista de Tareas junto a cada tarea afectada
- [ ] Modo vacaciones: pausar tareas recurrentes N días sin romper rachas

### Tablón / Social
- [ ] Botones sin handler: pin/delete mensajes del board
- [x] Reacciones emoji en mensajes del tablón

### Admin
- [ ] Admin/Stats — enriquecer con datos de reports (ya hay datos, falta UI)

---

## Pendiente — Técnico

### Accesibilidad (a11y) — WCAG 2.2 AA
- [x] Roles ARIA y landmarks (`role="main"`, `role="navigation"`, etc.)
- [x] `aria-label` en todos los botones icono sin texto visible
- [x] Formularios: asociar `<Label>` con input vía `htmlFor`/`id`
- [x] Focus visible (outline) en todos los elementos interactivos
- [x] Emojis decorativos: `aria-hidden="true"`; informativos: `aria-label`
- [x] Skip-to-main link bilingüe (ES/EN) con `useTranslations`
- [x] Target size mínimo 44px en touch devices (WCAG 2.5.8)
- [x] `autoComplete` en inputs de auth (email, password, name, postal-code)
- [x] Navegación completa por teclado (Tab, Enter, Space, Escape) — Cards clickables con tabIndex + onKeyDown
- [x] Focus trap en PIN modal del sidebar — ya usa Dialog de Base UI con focus trap nativo
- [x] Selectores de emoji/avatar: `aria-label` con nombre del emoji
- [x] Tablas admin: `aria-label` en ambas tablas (members + claims)
- [ ] Contraste WCAG AA — verificar ratios con herramienta (colores oklch)
- [x] `aria-live="polite"` para anuncios dinámicos (tareas, rewards, claims)
- [x] Orden DOM = orden visual en grids (verificado, solo flex-col-reverse menor en dialog footer)

### PWA
- [x] `manifest.ts` dinámico con iconos, theme-color, display: standalone
- [x] Service Worker (`public/sw.js`) con cache strategies (cache-first assets, network-first navigation)
- [x] Página offline (`/offline`) con diseño branded
- [x] Viewport y theme-color meta tags (light/dark)
- [x] Apple Web App metadata (capable, statusBarStyle)
- [x] Iconos PWA generados: 192x192, 512x512, maskable, apple-icon, favicon
- [x] Headers de seguridad (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [x] Headers específicos para SW (no-cache, CSP)

### APK (Android)
- [ ] Bubblewrap para generar APK de pruebas (TWA) — requiere Java 11+ y Android SDK
- [ ] Alternativa futura: Capacitor para iOS + Android desde el mismo codebase

### Contraste de colores
- [ ] Revisar paleta naranja primary (#F97316) — no pasa WCAG AA (2.8:1 con blanco). Decidir: oscurecer naranja, texto oscuro, o nueva paleta

### Performance
- [ ] Optimizar bundle JS: lazy loading de páginas admin, dynamic imports, tree-shaking
- [ ] Reducir unused JavaScript (~429 KiB estimado por Lighthouse)

### Calidad
- [ ] Tests unitarios para lógica de puntos y transiciones de estado
- [ ] Tests e2e para flujo crítico (login → completar tarea → canjear recompensa)

---

## Ideas — Gamificación

| Idea | Descripción | Complejidad |
|------|-------------|-------------|
| Tarea sorpresa del día | Tarea aleatoria bonus cada mañana, configurable por admin | Media |
| Caja misteriosa | Recompensa con contenido oculto, revelado con animación al canjear | Media |
| Jefe de semana | Rotación semanal, el "jefe" propone tarea bonus o recompensa extra | Baja |
| Multiplicador de cumpleaños | Puntos x2 automático el día del cumpleaños | Baja |
| Niveles de miembro | Títulos por puntos acumulados históricos (Aprendiz → Leyenda) | Media |
| Temporadas | Ciclos de 1-3 meses con ranking final y recompensa especial | Alta |

## Ideas — Social y familia

| Idea | Descripción | Complejidad |
|------|-------------|-------------|
| Retos de equipo | Meta de puntos conjunta para recompensa compartida (ya hay challenges base) | Baja |
| Votación familiar | Admin abre votación antes de recompensa cara (24-48h, visible) | Media |
| Préstamo de puntos | Pedir puntos prestados al banco familiar, devolver con tareas futuras | Alta |

## Ideas — Utilidad

| Idea | Descripción | Complejidad |
|------|-------------|-------------|
| Verificación con foto | Tareas que requieren foto antes de marcarse como completadas | Media |
| Exportar informe | PDF/CSV mensual con resumen por miembro | Media |
| Recordatorios push | Notificaciones PWA a hora configurable si hay tareas pendientes | Media |
| Metas personales | Cada miembro define meta con objetivo de puntos y barra de progreso | Baja |

---

## Referencia — Ficheros de documentación

| Fichero | Contenido |
|---------|-----------|
| `PLANNING.md` | Arquitectura original, modelo de datos conceptual, fases de desarrollo, diseño visual |
| `TODO.md` | Decisiones de auth/BD tomadas durante la migración a Supabase (histórico) |
| `IDEAS.md` | Ideas originales detalladas (sustituido por la sección Ideas de este fichero) |
| `supabase/full_schema.sql` | Schema idempotente actualizado — ejecutar para tener toda la BD al día |
