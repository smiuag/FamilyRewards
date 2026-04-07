# Ideas para FamilyRewards

Ideas propuestas el 2026-04-05. Ordenadas por categoría.

---

## Gamificación

### Tarea sorpresa del día
Cada mañana aparece una tarea extra aleatoria con puntos bonus. Crea expectativa diaria y rompe la rutina.
- El admin configura un pool de tareas sorpresa
- Aparece a las 00:00 y caduca a medianoche
- Puntos bonus configurables (ej. x1.5)

### Caja misteriosa
Una recompensa especial que cuesta X puntos fijos pero lo que hay dentro es sorpresa (el admin la configura).
- El admin crea "cajas" con un coste y un contenido oculto
- Al canjear se revela el contenido con animación
- Puede contener puntos extra, recompensas reales o mensajes personalizados

### Jefe de semana
Cada semana rota un miembro como "jefe": puede proponer una tarea bonus o una recompensa extra.
- El admin activa el modo y configura la rotación
- El "jefe" recibe un badge visible en su perfil durante la semana
- Da protagonismo a los niños y fomenta la responsabilidad

### Penalizaciones opcionales
El admin puede restar puntos por comportamientos negativos.
- Complementa el sistema de recompensas
- Configurable: se puede desactivar si no encaja con la filosofía familiar
- Registradas en el historial de puntos con razón visible

### Multiplicador de cumpleaños
El día del cumpleaños de un miembro, sus tareas completadas valen el doble automáticamente.
- Requiere guardar fecha de nacimiento en el perfil del miembro
- Aviso en el dashboard: "¡Hoy es el cumpleaños de [nombre]! Sus puntos valen x2"
- Se desactiva a medianoche

---

## Social y familia

### Retos de equipo
Objetivo común donde toda la familia contribuye puntos hacia una recompensa compartida.
- El admin define la meta (ej: "2000 pts entre todos → día de excursión")
- Barra de progreso visible en el dashboard familiar
- Al llegar a la meta, se notifica a todos y la recompensa se activa

### Tablón con reacciones
Ampliar el tablón familiar con reacciones emoji en los mensajes y "felicitaciones" entre miembros al completar rachas.
- Emojis de reacción (❤️ 🔥 👏 ⭐) en cada post del tablón
- Notificación al autor cuando alguien reacciona
- "Felicitación automática" cuando alguien alcanza un hito de racha

### Votación familiar
Antes de añadir una recompensa cara, el admin abre una votación entre los miembros.
- Votación de 24-48h: 👍 / 👎
- Resultado visible para todos
- El admin decide si seguir el resultado o no

### Préstamo de puntos
Un miembro puede pedir prestados puntos al "banco familiar" (admin aprueba), con devolución en tareas futuras.
- El miembro solicita un préstamo con motivo
- El admin aprueba/rechaza
- El sistema descuenta los puntos de las tareas futuras hasta saldar la deuda

---

## Utilidad real

### Verificación con foto
Algunas tareas pueden requerir foto de confirmación antes de marcarse como completadas.
- El admin activa la verificación en tareas concretas
- El miembro sube foto desde el móvil
- El admin ve la foto y aprueba o rechaza
- En rechazo, la tarea vuelve a pendiente con comentario

### Modo vacaciones
Pausa las tareas recurrentes durante N días sin que afecte a las rachas.
- El admin activa el modo vacaciones con fecha de fin
- Las rachas no se rompen durante el período
- Opción de pausa solo para miembros concretos

### Exportar informe familiar
PDF o CSV con el resumen mensual: puntos ganados, tareas completadas, recompensas canjeadas.
- Selección de período (mes, trimestre, personalizado)
- Separado por miembro o vista conjunta
- Útil para revisiones familiares mensuales

### Recordatorios configurables
Notificaciones push (PWA) a una hora concreta para avisar de tareas pendientes del día.
- Configurable por miembro y por hora
- Solo activa si hay tareas pendientes ese día
- Requiere permisos de notificación del navegador/dispositivo

---

## Progresión a largo plazo

### Niveles de miembro
Cada miembro sube de nivel según puntos acumulados históricos (no el saldo actual, sino el total ganado).
- Títulos divertidos: Aprendiz → Colaborador → Héroe → Leyenda familiar
- Badge de nivel visible en el perfil y en la lista de miembros
- Ventajas opcionales por nivel (descuentos en recompensas, acceso anticipado a cajas misteriosas)

### Temporadas
La app funciona por temporadas de 1-3 meses. Al final hay ranking final y recompensa especial.
- Al inicio de temporada: puntos se reinician parcialmente (ej: se guarda el 20%)
- Durante la temporada: tabla de clasificación familiar
- Al cerrar: resumen con medallas (mejor racha, más tareas, más puntos)
- Crea ciclos de motivación y evita el agotamiento a largo plazo

### Metas personales
Cada miembro define su propia meta con un objetivo de puntos, y la app muestra el progreso.
- El miembro crea una meta (nombre + puntos necesarios)
- Barra de progreso personal en su perfil
- Al llegar a la meta, celebración con confetti y opción de crear una recompensa directamente
- Diferente a las recompensas del catálogo: más personal y motivador

---

## Ya implementado (referencia)
- [x] Historial de puntos — vista detallada por miembro con cada transacción
- [x] Retos familiares (challenges) — desbloqueados progresivamente
- [x] Multiplicadores de puntos — desbloqueados progresivamente
- [x] Rachas (streaks) — desbloqueo progresivo al llegar a 7 días
- [x] Recompensas objetivo — marcar recompensas como meta personal
