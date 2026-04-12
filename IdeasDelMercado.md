# Ideas del Mercado — Análisis de competencia (abril 2026)

> Investigación de apps similares: PointUp, Joon, Habitica, OurHome, S'moresUp,
> Homey, BusyKid, Greenlight, Levelty, ChoreMonster (extinta), Choreio, Nori, FamHive.
> Fuentes: reviews App Store, Reddit (r/parenting, r/apps), Product Hunt, Common Sense Media.

---

## Lo que FamilyRewards YA tiene y es diferenciador

Ningún competidor tiene este combo completo:
- Compartir puntos con helpers (ÚNICO)
- Caja misteriosa con reveal animado (ÚNICO)
- Modo vacaciones sin romper rachas (ÚNICO)
- Desafíos familiares + multiplicadores de puntos
- Tablón familiar con reacciones
- Penalizaciones configurables por tarea
- Tareas reclamables (sin asignar)
- Realtime via Supabase (la fiabilidad es el dolor #1 de la competencia)
- PWA + i18n (ES/EN)

---

## Ideas con alta demanda — Para implementar

### 1. Mascota virtual de la familia
- **Demanda**: Muy alta. Joon reporta 90% de completado de tareas con su mascota.
- **Concepto**: La familia elige una mascota compartida. Se alimenta/cuida con las tareas completadas de todos. Si nadie hace tareas, la mascota se pone triste. Se puede personalizar (accesorios, fondos, skins) gastando puntos.
- **Ventaja sobre Joon**: Es mascota FAMILIAR (cooperativa), no individual (competitiva). Refuerza trabajo en equipo.
- **Riesgo**: Los adolescentes lo encuentran infantil a partir de ~12-13 años. ChoreMonster murió en parte por esto.
- **Mitigación**: Hacerlo opcional. Que el admin pueda activar/desactivar. Estilo visual no infantil.
- **Complejidad**: Media-Alta
- **Estado**: POR DISEÑAR

### 2. Verificación con foto (almacenamiento LOCAL)
- **Demanda**: La #1 más pedida en reviews. Padres se quejan de tareas "marcadas sin hacer".
- **Concepto**: El admin marca ciertas tareas como "requiere foto". Al completar, el niño saca foto que se guarda SOLO en el dispositivo (IndexedDB/localStorage). El admin la ve al revisar la tarea en el mismo dispositivo o que el niño le enseñe el móvil.
- **Ventaja**: Sin coste de servidor. Sin problemas de privacidad (COPPA). Sin almacenamiento en cloud.
- **Limitación**: La foto solo existe en el dispositivo que la tomó. No se ve desde otro dispositivo.
- **Apps que lo tienen**: PointUp, Rooster Money, Gleam (todas con cloud).
- **Complejidad**: Media
- **Estado**: POR DISEÑAR

### 3. Rotación automática de tareas
- **Demanda**: Alta. OurHome la tiene pero buggy ("la rotación se desordena si un niño falta un día").
- **Concepto**: Tareas recurrentes pueden tener asignación rotativa entre miembros seleccionados (diaria, semanal, mensual). Ya tenemos tareas recurrentes, sería extender la asignación.
- **Ejemplo**: "Poner la mesa" rota entre Lucas, Ana y María cada semana.
- **Complejidad**: Baja-Media
- **Estado**: POR DISEÑAR

### 4. Franjas horarias en tareas (AM/PM)
- **Demanda**: Media-Alta. Padres piden separar "antes del cole" vs "después del cole".
- **Concepto**: Campo opcional en la tarea: mañana / tarde / noche. El dashboard agrupa por franja.
- **Beneficio**: Enseña gestión del tiempo a los niños.
- **Apps que lo tienen**: Neat Kid.
- **Complejidad**: Baja
- **Estado**: POR DISEÑAR

### 5. Avatares personalizables / tienda de skins
- **Demanda**: Alta para engagement infantil. Habitica, Joon, PointUp, Levelty lo usan.
- **Concepto**: Cada miembro tiene un avatar personalizable. Se pueden comprar accesorios, fondos o skins con puntos. Da un segundo uso a los puntos además de recompensas físicas.
- **Conecta con**: La mascota virtual (personalizar la mascota) y los niveles de miembro.
- **Complejidad**: Media
- **Estado**: POR DISEÑAR

### 6. Imágenes en recompensas
- **Demanda**: Media. Users: "solo texto no motiva, los niños quieren VER la recompensa".
- **Concepto**: Permitir subir foto o elegir de galería al crear recompensa en el catálogo.
- **Mismo problema de storage que fotos de verificación**: podría usar URL externa o imagen local.
- **Complejidad**: Baja
- **Estado**: POR DISEÑAR

---

## Ideas interesantes — Prioridad menor

### 7. Funciones ADHD-friendly
- **Qué es**: Modo foco (una tarea a la vez), temporizadores visuales countdown, instrucciones paso a paso, modo calma (menos estímulos visuales).
- **Demanda**: Nicho creciente. Solo PointUp y Joon lo abordan.
- **Complejidad**: Media

### 8. Integración con tiempo de pantalla
- **Qué es**: Vincular completar tareas con ganar minutos de pantalla. Choreio y ScreenCoach lo hacen.
- **Demanda**: Alta entre padres de adolescentes.
- **Limitación**: Requiere integración con OS (Screen Time API en iOS, Digital Wellbeing en Android). Inviable desde PWA.
- **Complejidad**: Alta (requiere app nativa)

### 9. Widget de pantalla de inicio
- **Qué es**: Mini-recuadro en la home del móvil mostrando "3 tareas pendientes hoy" sin abrir la app.
- **Demanda**: Media. "Un widget lo haría la mejor app" — review de Chorly.
- **Limitación**: Soporte parcial en Android PWA, inexistente en iOS.
- **Complejidad**: Media (depende de plataforma)

### 10. Entrada por voz
- **Qué es**: "Agrega vaciar lavaplatos a las tareas de Emma" — Nori (2026) lo implementa.
- **Demanda**: Emergente, pocos lo esperan aún.
- **Complejidad**: Media (Web Speech API existe)

### 11. AI auto-asignación
- **Qué es**: S'moresUp tiene ChoreAI que sugiere qué tareas asignar a quién según historial.
- **Demanda**: Baja. Over-engineering para familias de 3-6 personas.
- **Complejidad**: Media

---

## Insights clave del mercado

1. **El dolor #1 no son features, es fiabilidad** — sincronización rota, bugs, notificaciones perdidas destruyen la confianza. Nosotros vamos bien con Supabase realtime.

2. **La gamificación tiene fecha de caducidad** — las apps exitosas la usan como puente hacia rutinas, no como fin en sí misma. Combinar con estructura.

3. **El hueco más grande son los adolescentes (13-17)** — mascotas les parecen infantiles, responden a autonomía y dinero real. Nadie lo hace bien.

4. **El setup inicial es crítico** — las familias abandonan en la primera semana. Nuestro onboarding wizard es ventaja real.

5. **Paywall agresivos generan odio** — Joon a $12.99/mes, S'moresUp a $9.99/mes reciben críticas fuertes. Plan gratuito generoso = diferenciador.

6. **Privacidad (COPPA)** — 40%+ de apps para niños podrían no cumplir COPPA. Si apuntamos a distribución pública, el cumplimiento es diferenciador de confianza.

---

## Apps de referencia

| App | Enfoque | Precio | Lo mejor | Lo peor |
|-----|---------|--------|----------|---------|
| **PointUp** | RPG gamificado (15 rangos, 40+ insignias, misiones equipo, ADHD) | £3.99/mes | La más completa en gamificación | Nuevo, poco track record |
| **Joon** | Mascota virtual para niños 6-12 / ADHD | $12.99/mes | 90% completado tareas | Cara, niños se aburren |
| **Habitica** | RPG retro para toda la familia | Gratis + $4.99/mes | Funciona para adultos también | No maneja bien tareas semanales |
| **OurHome** | Todo-en-uno del hogar | Gratis + premium | Amplia, gratuita | Bugs graves, sync rota, abandonada |
| **S'moresUp** | Tech-heavy (IoT, ChoreAI) | $9.99/mes | Innovadora | Compleja, cara, curva aprendizaje |
| **Levelty** | Simple y efectivo (2 clics) | Gratis + $2.99/mes | Sencillez | Pocas funciones avanzadas |
| **Homey** | Tareas + educación financiera | $4.99/mes | Free for All tasks | UI anticuada, bugs |
| **BusyKid** | Tarjeta débito + tareas | $3.99/mes | Dinero real motiva teens | Tareas como add-on, bugs Plaid |
| **ChoreMonster** | Colección monstruos (EXTINTA) | - | Diseño kid-first brillante | Murió: engagement temporal |
| **Choreio** | Control parental + tareas | Gratis + premium | Screen time integration | Nicho muy específico |
