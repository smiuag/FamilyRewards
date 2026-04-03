import type { CatalogTask } from "./tasks-catalog";
import type { CatalogReward } from "./rewards-catalog";

export interface SeasonTemplate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  tasks: Omit<CatalogTask, "id">[];
  rewards: Omit<CatalogReward, "id">[];
}

export const SEASON_TEMPLATES: SeasonTemplate[] = [
  {
    id: "back_to_school",
    title: "Vuelta al cole",
    description: "Pack perfecto para el inicio del curso escolar",
    emoji: "🎒",
    color: "bg-blue-50 border-blue-200",
    tasks: [
      { title: "Hacer los deberes", titleEn: "Do homework", description: "Completar los deberes diarios", descriptionEn: "Complete daily homework", emoji: "✏️", category: "study", suggestedPoints: 30, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"], suggestedTime: "17:00" },
      { title: "Ordenar la mochila", titleEn: "Pack school bag", description: "Preparar el material para el día siguiente", descriptionEn: "Prepare materials for next day", emoji: "🎒", category: "study", suggestedPoints: 5, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri"] },
      { title: "Leer 20 minutos", titleEn: "Read 20 minutes", description: "Lectura diaria", descriptionEn: "Daily reading", emoji: "📖", category: "study", suggestedPoints: 15, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri"] },
      { title: "Levantarse a la hora", titleEn: "Wake up on time", description: "Sin alarma repetida", descriptionEn: "Without snooze", emoji: "⏰", category: "personal", suggestedPoints: 10, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"] },
    ],
    rewards: [
      { title: "Material escolar", titleEn: "School supplies", description: "Mochila nueva o material", descriptionEn: "New bag or supplies", emoji: "🎒", category: "education", suggestedPoints: 800, tier: "medium" },
      { title: "Libro favorito", titleEn: "Favorite book", description: "El libro que elijas", descriptionEn: "Your book of choice", emoji: "📖", category: "education", suggestedPoints: 300, tier: "easy" },
    ],
  },
  {
    id: "summer",
    title: "Verano",
    description: "Tareas y recompensas para disfrutar el verano en familia",
    emoji: "☀️",
    color: "bg-yellow-50 border-yellow-200",
    tasks: [
      { title: "Protector solar", titleEn: "Apply sunscreen", description: "Ponerse crema solar antes de salir", descriptionEn: "Apply sunscreen before going out", emoji: "🌞", category: "personal", suggestedPoints: 5, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
      { title: "Ejercicio matutino", titleEn: "Morning exercise", description: "30 minutos de actividad física", descriptionEn: "30 minutes of physical activity", emoji: "🏃", category: "sports", suggestedPoints: 20, difficulty: "medium", suggestedDays: ["mon","wed","fri"] },
      { title: "Leer un libro de verano", titleEn: "Read a summer book", description: "Avanzar en la lectura de verano", descriptionEn: "Progress on summer reading", emoji: "📚", category: "study", suggestedPoints: 20, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
      { title: "Ayudar en casa", titleEn: "Help at home", description: "Tarea del hogar a elegir", descriptionEn: "Choose a household task", emoji: "🏠", category: "home", suggestedPoints: 15, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
    ],
    rewards: [
      { title: "Parque acuático", titleEn: "Water park", description: "Día de piscinas y toboganes", descriptionEn: "Day of pools and slides", emoji: "🏊", category: "travel", suggestedPoints: 1500, tier: "hard" },
      { title: "Helado especial", titleEn: "Special ice cream", description: "Heladería a elegir", descriptionEn: "Ice cream parlor of choice", emoji: "🍦", category: "food", suggestedPoints: 100, tier: "easy" },
      { title: "Excursión de un día", titleEn: "Day trip", description: "Visita a un lugar especial", descriptionEn: "Visit a special place", emoji: "🚗", category: "travel", suggestedPoints: 1500, tier: "hard" },
    ],
  },
  {
    id: "christmas",
    title: "Navidades",
    description: "Tareas y recompensas especiales para la temporada navideña",
    emoji: "🎄",
    color: "bg-red-50 border-red-200",
    tasks: [
      { title: "Decorar el árbol", titleEn: "Decorate the tree", description: "Participar en la decoración navideña", descriptionEn: "Help with Christmas decorations", emoji: "🎄", category: "family", suggestedPoints: 25, difficulty: "easy" },
      { title: "Preparar la carta a los Reyes", titleEn: "Write wish list", description: "Escribir y decorar la carta", descriptionEn: "Write and decorate the wish list", emoji: "📝", category: "family", suggestedPoints: 20, difficulty: "easy" },
      { title: "Hacer un regalo casero", titleEn: "Make a homemade gift", description: "Crear un regalo con tus manos", descriptionEn: "Create a handmade gift", emoji: "🎁", category: "family", suggestedPoints: 40, difficulty: "medium" },
      { title: "Llamar para felicitar", titleEn: "Call to wish well", description: "Llamar a familiares para felicitarles", descriptionEn: "Call family members to wish them well", emoji: "📞", category: "family", suggestedPoints: 15, difficulty: "easy" },
    ],
    rewards: [
      { title: "Juego de mesa navideño", titleEn: "Christmas board game", description: "Un juego nuevo para jugar en familia", descriptionEn: "A new game to play together", emoji: "🎲", category: "entertainment", suggestedPoints: 700, tier: "medium" },
      { title: "Noche de películas navideñas", titleEn: "Christmas movie night", description: "Maratón de películas con palomitas", descriptionEn: "Movie marathon with popcorn", emoji: "🎬", category: "entertainment", suggestedPoints: 200, tier: "easy" },
      { title: "Cena especial de Nochebuena", titleEn: "Christmas Eve dinner", description: "Elegir el menú de Nochebuena", descriptionEn: "Choose the Christmas Eve menu", emoji: "🍽️", category: "food", suggestedPoints: 500, tier: "medium" },
    ],
  },
  {
    id: "exam_season",
    title: "Época de exámenes",
    description: "Motiva el estudio durante los períodos de exámenes",
    emoji: "📝",
    color: "bg-purple-50 border-purple-200",
    tasks: [
      { title: "Sesión de estudio 2h", titleEn: "2h study session", description: "Estudiar concentrado sin distracciones", descriptionEn: "Study focused without distractions", emoji: "📚", category: "study", suggestedPoints: 50, difficulty: "hard", suggestedDays: ["mon","tue","wed","thu","fri"] },
      { title: "Repasar apuntes", titleEn: "Review notes", description: "Repasar los apuntes del día", descriptionEn: "Review today's notes", emoji: "📓", category: "study", suggestedPoints: 20, difficulty: "medium" },
      { title: "Sin pantallas al estudiar", titleEn: "No screens while studying", description: "Móvil apagado durante el estudio", descriptionEn: "Phone off during study time", emoji: "📵", category: "personal", suggestedPoints: 15, difficulty: "medium" },
      { title: "Dormir 8 horas", titleEn: "Sleep 8 hours", description: "Acostarse a la hora para rendir", descriptionEn: "Bedtime on schedule for peak performance", emoji: "😴", category: "personal", suggestedPoints: 10, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"] },
    ],
    rewards: [
      { title: "Tarde libre tras el examen", titleEn: "Free afternoon after exam", description: "Tarde de relax cuando acabes un examen", descriptionEn: "Relaxing afternoon after each exam", emoji: "🎉", category: "freedom", suggestedPoints: 200, tier: "easy" },
      { title: "Pizza de celebración", titleEn: "Celebration pizza", description: "Pizza si superas el examen", descriptionEn: "Pizza if you pass the exam", emoji: "🍕", category: "food", suggestedPoints: 300, tier: "easy" },
      { title: "Curso o taller especial", titleEn: "Special course", description: "Aprender algo que te guste", descriptionEn: "Learn something you enjoy", emoji: "🎓", category: "education", suggestedPoints: 2000, tier: "epic" },
    ],
  },
  {
    id: "new_year",
    title: "Año Nuevo",
    description: "Nuevos propósitos y metas para empezar el año",
    emoji: "🎆",
    color: "bg-indigo-50 border-indigo-200",
    tasks: [
      { title: "Ejercicio diario", titleEn: "Daily exercise", description: "30 minutos de actividad física", descriptionEn: "30 minutes of physical activity", emoji: "🏃", category: "sports", suggestedPoints: 20, difficulty: "medium", suggestedDays: ["mon","wed","fri"] },
      { title: "Meditación matutina", titleEn: "Morning meditation", description: "10 minutos de mindfulness", descriptionEn: "10 minutes of mindfulness", emoji: "🧘", category: "personal", suggestedPoints: 15, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
      { title: "Leer antes de dormir", titleEn: "Read before sleep", description: "20 minutos de lectura nocturna", descriptionEn: "20 minutes of evening reading", emoji: "📖", category: "study", suggestedPoints: 10, difficulty: "easy", suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
    ],
    rewards: [
      { title: "Actividad nueva a elegir", titleEn: "New activity of choice", description: "Probar algo que nunca hayas hecho", descriptionEn: "Try something you've never done", emoji: "✨", category: "experiences", suggestedPoints: 1500, tier: "hard" },
      { title: "Cena de celebración", titleEn: "Celebration dinner", description: "Restaurante a elegir", descriptionEn: "Restaurant of choice", emoji: "🍽️", category: "food", suggestedPoints: 800, tier: "medium" },
    ],
  },
];
