"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HelpCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpSection {
  id: string;
  emoji: string;
  title: string;
  adminOnly?: boolean;
  items: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
}

const HELP_CONTENT: HelpSection[] = [
  {
    id: "start",
    emoji: "🚀",
    title: "Primeros pasos",
    items: [
      {
        question: "¿Qué es FamilyRewards?",
        answer:
          "FamilyRewards es una app para organizar las tareas del hogar de forma divertida. Cada miembro de la familia gana puntos al completar sus tareas, y puede canjear esos puntos por recompensas que el administrador define.",
      },
      {
        question: "¿Cómo entro a mi cuenta?",
        answer:
          'En la pantalla de inicio, verás las tarjetas de todos los miembros de tu familia. Pulsa sobre tu nombre para entrar. No necesitas contraseña en esta versión de la app.',
      },
      {
        question: "¿Cuál es la diferencia entre Administrador y Miembro?",
        answer:
          "El Administrador (normalmente un padre o madre) puede crear y gestionar tareas, recompensas, miembros, retos y multiplicadores. También aprueba los canjes de recompensas. Los Miembros sólo pueden ver y completar sus tareas, pedir canjes y ver sus logros.",
      },
    ],
  },
  {
    id: "tasks",
    emoji: "✅",
    title: "Tareas",
    items: [
      {
        question: "¿Cómo marco una tarea como completada?",
        answer:
          'En la sección "Mis Tareas" o en el Dashboard, verás el botón "Completar" junto a cada tarea pendiente. Al pulsarlo, la tarea se marca como completada y recibirás los puntos correspondientes al instante.',
      },
      {
        question: "¿Qué significa omitir una tarea?",
        answer:
          'Omitir una tarea significa que no la vas a hacer ese día. No recibirás puntos pero tampoco cuenta negativamente. Es útil para tareas recurrentes que por algún motivo no puedes hacer ese día.',
      },
      {
        question: "¿Qué son las tareas recurrentes?",
        answer:
          'Son tareas que se repiten automáticamente según un patrón (por ejemplo, "Hacer los deberes" de lunes a viernes). Cada día aparecerán de nuevo en tu lista, ya sea como pendientes o como completadas por defecto.',
      },
      {
        question: "¿Puedo ver las tareas de días anteriores?",
        answer:
          'Sí. En la sección "Tareas" puedes navegar por el calendario para ver las tareas de cualquier día pasado o futuro.',
      },
    ],
  },
  {
    id: "points",
    emoji: "⭐",
    title: "Puntos y multiplicadores",
    items: [
      {
        question: "¿Cómo se ganan puntos?",
        answer:
          "Ganas puntos al completar tareas. Cada tarea tiene un valor en puntos definido por el administrador. También puedes ganar puntos extra por logros, rachas y retos familiares.",
      },
      {
        question: "¿Qué son los multiplicadores?",
        answer:
          "Los multiplicadores son eventos especiales que el administrador activa por un período concreto. Por ejemplo, un ×2 durante el fin de semana duplica los puntos de todas las tareas que completes en esos días.",
      },
      {
        question: "¿Cómo sé si hay un multiplicador activo?",
        answer:
          "En el Dashboard verás un banner de alerta naranja cuando haya un multiplicador activo. También aparecerá en la lista de tareas junto a cada tarea afectada.",
      },
      {
        question: "¿Qué es la racha?",
        answer:
          'La racha cuenta los días consecutivos en que has completado al menos una tarea. En tu perfil verás tu racha actual y tu mejor racha histórica. Mantener la racha desbloquea logros especiales.',
      },
    ],
  },
  {
    id: "rewards",
    emoji: "🎁",
    title: "Recompensas",
    items: [
      {
        question: "¿Cómo canjeo una recompensa?",
        answer:
          'Ve a la sección "Recompensas", elige la que quieras y pulsa "Canjear". Si tienes suficientes puntos, se enviará una solicitud al administrador. Recibirás la confirmación cuando la apruebe.',
      },
      {
        question: "¿Qué ocurre con mis puntos al canjear?",
        answer:
          "Los puntos se descuentan de tu saldo en el momento en que el administrador aprueba el canje, no cuando lo solicitas.",
      },
      {
        question: "¿Puedo ver el estado de mis solicitudes?",
        answer:
          'Sí. En la sección "Recompensas", en la pestaña "Mis solicitudes", verás todas tus peticiones con su estado: pendiente, aprobada o rechazada.',
      },
    ],
  },
  {
    id: "challenges",
    emoji: "🏆",
    title: "Retos familiares",
    items: [
      {
        question: "¿Qué es un reto familiar?",
        answer:
          "Un reto familiar es un objetivo que toda la familia trabaja para conseguir juntos. Por ejemplo: acumular 500 puntos entre todos esta semana. Si lo conseguís, todos los miembros reciben una recompensa colectiva.",
      },
      {
        question: "¿Cómo contribuyo a un reto?",
        answer:
          "Al completar tareas mientras hay un reto activo, tu progreso se suma automáticamente al reto. También puedes pulsar el botón de contribuir en la sección de Retos para añadir tu aportación directamente.",
      },
      {
        question: "¿Qué pasa si no completamos el reto?",
        answer:
          "Si el reto llega a su fecha límite sin completarse, quedará marcado como fallido y no se otorgará la recompensa. El administrador puede crear un nuevo reto cuando quiera.",
      },
    ],
  },
  {
    id: "achievements",
    emoji: "🥇",
    title: "Logros",
    items: [
      {
        question: "¿Cómo desbloqueo logros?",
        answer:
          "Los logros se desbloquean automáticamente al cumplir ciertos hitos: completar un número de tareas, mantener una racha, canjear recompensas, etc. Comprueba la sección Logros para ver cuáles te quedan por conseguir.",
      },
      {
        question: "¿Los logros dan puntos?",
        answer:
          "Sí, cada logro tiene un valor en puntos que se añade a tu total al desbloquearlo. Los logros épicos y legendarios dan muchos más puntos que los comunes.",
      },
    ],
  },
  {
    id: "calendar",
    emoji: "📅",
    title: "Calendario",
    items: [
      {
        question: "¿Qué muestra el calendario?",
        answer:
          "El calendario muestra tus tareas organizadas por día. Los días marcados con colores tienen tareas programadas. Los puntos rojos indican festivos locales según tu configuración de localización.",
      },
      {
        question: "¿Cómo configuro los festivos de mi ciudad?",
        answer:
          'Ve a "Configuración" (icono de localización en la barra lateral) y selecciona tu país, región y ciudad. El calendario mostrará automáticamente los festivos correspondientes.',
      },
    ],
  },
  {
    id: "admin_general",
    emoji: "⚙️",
    title: "Administración — General",
    adminOnly: true,
    items: [
      {
        question: "¿Cómo añado un nuevo miembro a la familia?",
        answer:
          'Ve a Admin → Miembros y pulsa "Añadir miembro". Introduce su nombre y avatar. El nuevo miembro aparecerá en la pantalla de login.',
      },
      {
        question: "¿Puedo ajustar los puntos de un miembro manualmente?",
        answer:
          'Sí. En Admin → Miembros, pulsa el botón "Ajustar puntos" junto al miembro. Puedes añadir o restar puntos e introducir un motivo para el historial.',
      },
    ],
  },
  {
    id: "admin_tasks",
    emoji: "📋",
    title: "Administración — Tareas",
    adminOnly: true,
    items: [
      {
        question: "¿Cómo creo una tarea recurrente?",
        answer:
          'En Admin → Gestión de Tareas, pulsa "Nueva tarea" y activa la opción "Recurrente". Selecciona los días de la semana y el estado por defecto (pendiente o completada).',
      },
      {
        question: "¿Qué es el estado por defecto de una tarea?",
        answer:
          '"Completada por defecto" es útil para tareas que se asumen siempre hechas (como ir al trabajo) y sólo hay que marcarlas como no completadas en caso excepcional. "Pendiente por defecto" requiere que el miembro la complete activamente.',
      },
      {
        question: "¿Puedo usar el catálogo de tareas?",
        answer:
          'Sí. En Admin → Catálogo de Tareas encontrarás 45+ plantillas organizadas por categoría (hogar, estudio, deporte...). Puedes añadirlas directamente a la familia con un solo clic.',
      },
    ],
  },
  {
    id: "admin_rewards",
    emoji: "🏅",
    title: "Administración — Recompensas",
    adminOnly: true,
    items: [
      {
        question: "¿Cómo apruebo un canje?",
        answer:
          'En Admin → Gestión de Recompensas, en la sección "Solicitudes pendientes", verás todas las peticiones. Pulsa Aprobar o Rechazar. Al aprobar, los puntos se descuentan automáticamente.',
      },
      {
        question: "¿Puedo usar el catálogo de recompensas?",
        answer:
          'Sí. En Admin → Catálogo de Recompensas hay 44+ ideas organizadas en 8 categorías con precios sugeridos. Puedes añadirlas a tu familia con un solo clic.',
      },
    ],
  },
  {
    id: "admin_templates",
    emoji: "📦",
    title: "Administración — Plantillas de temporada",
    adminOnly: true,
    items: [
      {
        question: "¿Qué son las plantillas de temporada?",
        answer:
          'Son paquetes predefinidos de tareas y recompensas adaptados a momentos del año: Vuelta al cole, Verano, Navidades, Exámenes y Año Nuevo. Actívalos desde Admin → Plantillas de temporada.',
      },
    ],
  },
];

export default function HelpClient() {
  const { currentUser } = useAppStore();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";

  const visibleSections = HELP_CONTENT.filter(
    (s) => !s.adminOnly || isAdmin
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return visibleSections;
    const q = query.toLowerCase();
    return visibleSections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [query, visibleSections]);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Ayuda
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Todo lo que necesitas saber sobre FamilyRewards
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca cualquier pregunta..."
          className="pl-9"
        />
      </div>

      {/* Sections */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No se encontraron resultados para &ldquo;{query}&rdquo;
          </CardContent>
        </Card>
      ) : (
        filtered.map((section) => (
          <div key={section.id} className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span>{section.emoji}</span>
              {section.title}
              {section.adminOnly && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full normal-case tracking-normal">
                  Solo admin
                </span>
              )}
            </h2>
            <Card className="shadow-sm divide-y divide-border">
              {section.items.map((item) => {
                const key = `${section.id}:${item.question}`;
                const open = expanded[key];
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-medium text-sm pr-4">
                        {item.question}
                      </span>
                      {open ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {open && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground pt-2">
        ¿Tienes alguna duda que no aparece aquí? Contacta con el administrador de tu familia.
      </p>
    </div>
  );
}
