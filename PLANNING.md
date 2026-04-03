# FamilyRewards — Plan de Proyecto

> Versión 1.0 — Abril 2026  
> Estado: Planificación inicial

---

## 1. Visión del Producto

**FamilyRewards** es una aplicación familiar multiplataforma (web + móvil) que combina:
- Gestión de tareas y calendario familiar
- Sistema de puntos por completar tareas
- Catálogo de recompensas canjeables
- Planificador con alertas y resúmenes diarios/semanales

El objetivo es crear un ecosistema motivador para toda la familia, especialmente para los hijos, donde las responsabilidades del día a día se convierten en oportunidades de conseguir recompensas acordadas en familia.

---

## 2. Roles y Usuarios

### 2.1 Rol: Administrador (padre/madre)
- Crear y gestionar la familia (grupo familiar)
- Invitar y gestionar miembros
- Crear, editar y eliminar tareas y tareas recurrentes
- Configurar puntos por tarea
- Crear, editar y eliminar recompensas
- Ver el historial y progreso de todos los miembros
- Aprobar o rechazar el canje de recompensas
- Gestionar el calendario de todos los miembros
- Activar/desactivar tareas recurrentes de cualquier miembro
- Ver resúmenes y estadísticas familiares

### 2.2 Rol: Miembro (hijo/a)
- Ver su propio calendario y tareas
- Marcar tareas como completadas o no completadas
- Ver su saldo de puntos acumulados
- Ver el catálogo de recompensas y su coste
- Solicitar canje de recompensas
- Recibir alertas y notificaciones
- Ver su resumen diario y semanal

> **Nota de diseño**: El nombre del rol "Miembro" es provisional. Se puede personalizar por familia (ej: "Explorador", "Héroe", etc.).

---

## 3. Funcionalidades Principales

### 3.1 Gestión de Tareas

#### Tareas puntuales
- Crear una tarea para una fecha concreta
- Asignarla a uno o varios miembros
- Asignar puntos (puede ser 0 para tareas sin recompensa)
- Marcar como completada / no completada
- Opcionalmente con hora y alerta

#### Tareas recurrentes
- Definir patrón de repetición: diaria, semanal (días de la semana), mensual
- Configurar horario (ej: lunes a viernes, 8 horas)
- Asignar puntos automáticos al completarla
- Estado por defecto configurable: completada por defecto (ej: "Ir a trabajar") o pendiente por defecto (ej: "Hacer los deberes")
- Posibilidad de marcar/desmarcar para un día específico sin afectar al patrón
- Activar/desactivar la recurrencia completa sin borrarla

**Ejemplo de uso:**
> "Trabajar 8h" → Lunes a viernes → Completada por defecto → 50 puntos/día  
> Un día concreto se puede desmarcar (vacaciones, baja) → ese día: 0 puntos

#### Estados de una tarea (por día)
- `pendiente` — aún no se ha marcado
- `completada` — se ha marcado como hecha → suma puntos
- `no_completada` — se ha marcado explícitamente como no hecha → no suma puntos
- `omitida` — desactivada para ese día específico (no cuenta ni suma ni resta)

### 3.2 Sistema de Puntos

- Cada usuario tiene un saldo de puntos acumulados
- Los puntos se ganan al completar tareas
- Los puntos NO se gastan automáticamente; el canje es explícito
- Al canjear una recompensa, los puntos se descuentan del saldo
- Historial de puntos: ganados, gastados, fecha y motivo
- Los administradores pueden ajustar puntos manualmente (bonus o corrección)

### 3.3 Catálogo de Recompensas

- Nombre y descripción de la recompensa
- Coste en puntos
- Imagen/icono opcional
- Estado: disponible / agotada / desactivada
- Puede ser individual (para un miembro concreto) o familiar (para todos)
- Flujo de canje:
  1. El miembro solicita el canje
  2. El administrador aprueba o rechaza
  3. Si se aprueba, se descuentan los puntos

**Ejemplos de recompensas:**
- Teléfono nuevo: 5.000 puntos
- Viaje de fin de semana: 10.000 puntos
- Tarde libre de tareas: 200 puntos
- Pizza para cenar: 300 puntos

### 3.4 Calendario y Planificador

- Vista mensual, semanal y diaria
- Cada miembro ve su propio calendario
- El administrador puede ver el de cualquier miembro o el familiar completo
- Las tareas recurrentes aparecen automáticamente en el calendario
- Las tareas puntuales se añaden manualmente
- Indicadores visuales: tarea completada / pendiente / no completada
- Resumen de puntos del día en la vista diaria

### 3.5 Alertas y Notificaciones

- Alerta de tarea próxima (configurable con antelación)
- Resumen diario (hora configurable, ej: 8:00 AM) con las tareas del día
- Resumen semanal (día y hora configurables) con logros y puntos de la semana
- Notificación cuando se aprueba un canje de recompensa
- Notificación cuando el administrador asigna una nueva tarea

### 3.6 Resúmenes y Estadísticas

- **Resumen diario**: tareas completadas/pendientes, puntos ganados hoy
- **Resumen semanal**: rendimiento de la semana, racha de días consecutivos, puntos acumulados
- **Estadísticas del miembro**: historial de puntos, tareas más completadas, recompensas canjeadas
- **Vista familiar (admin)**: comparativa entre miembros, tareas pendientes de revisión

---

## 4. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│   Web App (Next.js)  ←→  Mobile App (React Native)     │
│              ↑ Shared UI Components ↑                   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API / WebSockets
┌────────────────────────▼────────────────────────────────┐
│                     BACKEND (futuro)                    │
│              Node.js + NestJS (API REST)                │
│              WebSockets para notificaciones en tiempo   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   BASE DE DATOS (futuro)                │
│              PostgreSQL (datos relacionales)            │
│              Redis (sesiones, caché, colas notif.)      │
└─────────────────────────────────────────────────────────┘
```

### 4.1 Modelo de datos (esquema conceptual)

```
Family
  └── id, name, code_invite, created_at

User
  └── id, family_id, name, avatar, role (admin|member), points_balance, created_at

Task
  └── id, family_id, title, description, points, assigned_to (user_id[]), created_by

RecurringTask
  └── id, task_id, pattern (days_of_week[], time, duration), default_state (completed|pending), active

TaskInstance          ← una ocurrencia concreta de una tarea en el calendario
  └── id, task_id, user_id, date, state (pending|completed|not_completed|omitted), points_awarded

Reward
  └── id, family_id, title, description, points_cost, image_url, status (available|disabled)

RewardClaim
  └── id, reward_id, user_id, requested_at, status (pending|approved|rejected), resolved_at

PointsHistory
  └── id, user_id, amount (+/-), reason, source (task|reward|manual), date

Notification
  └── id, user_id, type, message, read, created_at
```

---

## 5. Tecnologías Recomendadas

### Opción A — Recomendada: Monorepo React (Web + Mobile)

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Web** | Next.js 14+ (App Router) | SSR/SSG, SEO, routing moderno, excelente ecosistema |
| **Mobile** | Expo (React Native) | Mismo lenguaje que web, iOS + Android, OTA updates |
| **Compartido** | Componentes React + lógica de negocio | Reutilización máxima entre plataformas |
| **Monorepo** | Turborepo + pnpm workspaces | Gestión eficiente de múltiples paquetes |
| **UI Web** | Tailwind CSS + shadcn/ui | Moderno, altamente personalizable, componentes accesibles |
| **UI Mobile** | NativeWind + React Native Paper | Tailwind en mobile, componentes nativos |
| **Estado** | Zustand | Simple, ligero, sin boilerplate |
| **Formularios** | React Hook Form + Zod | Validación tipada y ergonómica |
| **Fechas** | date-fns | Ligero, modular, sin mutaciones |
| **Backend (futuro)** | Node.js + NestJS | TypeScript nativo, arquitectura modular, escalable |
| **Base de datos (futuro)** | PostgreSQL + Prisma ORM | Relacional, tipos generados automáticamente |
| **Auth (futuro)** | JWT + Refresh Tokens | Estándar seguro para API REST |
| **Notif. Push (futuro)** | Expo Notifications + Web Push API | Unificado para ambas plataformas |

**Ventajas:**
- Un solo lenguaje (TypeScript) en toda la pila
- Máxima reutilización de lógica entre web y móvil
- Ecosistema enorme y maduro
- Fácil de encontrar desarrolladores

**Desventajas:**
- Web y mobile tienen bases de código separadas (aunque compartidas)
- La experiencia UI mobile no es 100% nativa

---

### Opción B — Alternativa: Flutter

| Capa | Tecnología |
|------|-----------|
| **Web + Mobile** | Flutter (Dart) |
| **Backend (futuro)** | Node.js o Go |
| **Base de datos (futuro)** | PostgreSQL |

**Ventajas:** Un solo código para web, iOS y Android con UI verdaderamente nativa.  
**Desventajas:** Dart es menos conocido, el soporte web de Flutter aún es menos maduro, menor ecosistema de componentes UI.

---

### Opción C — Simplificada: PWA

| Capa | Tecnología |
|------|-----------|
| **Web + Mobile** | Next.js como PWA |
| **Backend (futuro)** | Node.js + NestJS |

**Ventajas:** Un solo proyecto, instalable como app en móvil, mínima complejidad.  
**Desventajas:** Sin notificaciones push nativas fiables en iOS, experiencia móvil limitada comparada con app nativa.

---

### Recomendación final

> **Opción A (Monorepo React)** es la más adecuada para este proyecto.  
> Permite una experiencia web y móvil de calidad, comparte la lógica de negocio, y usa tecnologías con amplia comunidad. La maqueta inicial puede hacerse solo con Next.js (web) y añadir el proyecto Expo (mobile) en una segunda fase.

---

## 6. Estructura de Carpetas (Monorepo)

```
FamilyRewards/
├── apps/
│   ├── web/                  # Next.js — aplicación web
│   └── mobile/               # Expo — aplicación móvil
├── packages/
│   ├── ui/                   # Componentes compartidos (donde aplique)
│   ├── types/                # Tipos TypeScript compartidos
│   ├── utils/                # Lógica de negocio compartida (fechas, puntos, etc.)
│   └── api-client/           # Cliente HTTP (fetch/axios) para el backend
├── PLANNING.md
├── README.md
└── package.json
```

---

## 7. Fases de Desarrollo

### Fase 1 — Maqueta Web (actual)
- [ ] Configurar monorepo (Turborepo + pnpm)
- [ ] Proyecto Next.js con Tailwind + shadcn/ui
- [ ] Layout principal y navegación
- [ ] Pantallas: Login / Dashboard / Calendario / Tareas / Recompensas / Perfil
- [ ] Datos mock (sin backend)
- [ ] Diseño responsive (mobile-first)
- [ ] Tema visual: colores familiares, amigables, modernos

### Fase 2 — Maqueta Mobile
- [ ] Proyecto Expo dentro del monorepo
- [ ] Mismas pantallas adaptadas a mobile
- [ ] Navegación con React Navigation

### Fase 3 — Backend y Base de Datos
- [ ] API REST con NestJS
- [ ] Modelos y migraciones con Prisma + PostgreSQL
- [ ] Autenticación JWT
- [ ] Conectar frontend al backend real

### Fase 4 — Notificaciones y Tiempo Real
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Push notifications (Expo + Web Push)
- [ ] Resúmenes automáticos diarios/semanales (cron jobs)

### Fase 5 — Pulido y Despliegue
- [ ] Tests (unitarios + integración)
- [ ] CI/CD
- [ ] Despliegue web (Vercel)
- [ ] Despliegue mobile (App Store + Google Play)

---

## 8. Pantallas Principales (Maqueta)

### Comunes (todos los roles)
- **Login / Selección de miembro** — entrada a la app
- **Dashboard** — resumen del día: tareas pendientes, puntos, próximas recompensas
- **Calendario** — vista mensual/semanal/diaria con tareas
- **Mis Tareas** — listado de tareas del día con acciones (completar/omitir)
- **Recompensas** — catálogo con coste en puntos y botón de solicitud
- **Mi Perfil** — puntos acumulados, historial, logros

### Solo Administrador
- **Gestión de miembros** — añadir, editar roles, ver progreso
- **Gestión de tareas** — crear, editar, asignar tareas y recurrentes
- **Gestión de recompensas** — crear, editar, aprobar canjes
- **Estadísticas familiares** — vista global del rendimiento familiar

---

## 9. Criterios de Diseño Visual

- **Estilo**: Moderno, limpio, con toques lúdicos (no infantil)
- **Paleta**: Colores cálidos y amigables (naranja, azul suave, verde)
- **Tipografía**: Sans-serif redondeada (ej: Inter, Nunito)
- **Iconografía**: Iconos consistentes (Lucide Icons)
- **Componentes**: Cards redondeadas, sombras suaves, microanimaciones
- **Responsive**: Mobile-first; funcional en pantallas desde 320px
- **Accesibilidad**: Contraste WCAG AA, navegación por teclado

---

## 10. Decisiones Pendientes

| Decisión | Opciones | Prioridad |
|----------|----------|-----------|
| Nombre del rol hijo | Miembro / Explorador / Héroe / ... | Baja |
| Idioma de la app | Español / Inglés / Multiidioma | Media |
| Modo oscuro | Sí / No | Baja |
| Límite de miembros por familia | Sin límite / máximo configurable | Media |
| Puntos negativos (penalizaciones) | Sí / No | Media |
| Gamificación extra (niveles, medallas) | Sí / No | Baja |

---

*Documento vivo — actualizar a medida que se toman decisiones.*
