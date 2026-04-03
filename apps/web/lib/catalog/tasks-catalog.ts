export type TaskCategory =
  | "home"
  | "study"
  | "sports"
  | "family"
  | "personal"
  | "work"
  | "pets"
  | "garden";

export interface CatalogTask {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  emoji: string;
  category: TaskCategory;
  suggestedPoints: number;
  difficulty: "easy" | "medium" | "hard";
  suggestedDays?: string[]; // days of week abbreviations
  suggestedTime?: string;
}

export const TASK_CATEGORIES: Record<TaskCategory, { label: string; labelEn: string; emoji: string; color: string }> = {
  home:     { label: "Hogar",      labelEn: "Home",       emoji: "🏠", color: "bg-orange-100 text-orange-700" },
  study:    { label: "Estudio",    labelEn: "Study",      emoji: "📚", color: "bg-blue-100 text-blue-700" },
  sports:   { label: "Deporte",    labelEn: "Sports",     emoji: "🏃", color: "bg-green-100 text-green-700" },
  family:   { label: "Familia",    labelEn: "Family",     emoji: "👨‍👩‍👧", color: "bg-pink-100 text-pink-700" },
  personal: { label: "Personal",   labelEn: "Personal",   emoji: "🌱", color: "bg-teal-100 text-teal-700" },
  work:     { label: "Trabajo",    labelEn: "Work",       emoji: "💼", color: "bg-slate-100 text-slate-700" },
  pets:     { label: "Mascotas",   labelEn: "Pets",       emoji: "🐾", color: "bg-amber-100 text-amber-700" },
  garden:   { label: "Jardín",     labelEn: "Garden",     emoji: "🌿", color: "bg-lime-100 text-lime-700" },
};

export const TASKS_CATALOG: CatalogTask[] = [
  // ── Hogar ────────────────────────────────────────────────────
  { id: "tc1",  title: "Limpiar la habitación",   titleEn: "Clean bedroom",          description: "Ordenar y pasar el aspirador",           descriptionEn: "Tidy up and vacuum",                emoji: "🛏️", category: "home",     suggestedPoints: 20, difficulty: "medium", suggestedDays: ["sat"] },
  { id: "tc2",  title: "Fregar los platos",        titleEn: "Do the dishes",          description: "Fregar o vaciar el lavavajillas",        descriptionEn: "Wash or empty the dishwasher",      emoji: "🍽️", category: "home",     suggestedPoints: 10, difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
  { id: "tc3",  title: "Poner la lavadora",        titleEn: "Do the laundry",         description: "Meter ropa y poner el programa",         descriptionEn: "Load clothes and start the cycle",  emoji: "🧺", category: "home",     suggestedPoints: 10, difficulty: "easy" },
  { id: "tc4",  title: "Tender la ropa",           titleEn: "Hang clothes",           description: "Tender la colada en el tendedero",       descriptionEn: "Hang laundry on the drying rack",   emoji: "👕", category: "home",     suggestedPoints: 10, difficulty: "easy" },
  { id: "tc5",  title: "Barrer el suelo",          titleEn: "Sweep the floor",        description: "Barrer cocina y salón",                  descriptionEn: "Sweep kitchen and living room",     emoji: "🧹", category: "home",     suggestedPoints: 15, difficulty: "easy" },
  { id: "tc6",  title: "Pasar el aspirador",       titleEn: "Vacuum",                 description: "Aspirar toda la casa",                   descriptionEn: "Vacuum the whole house",             emoji: "🌀", category: "home",     suggestedPoints: 20, difficulty: "medium" },
  { id: "tc7",  title: "Limpiar el baño",          titleEn: "Clean bathroom",         description: "Fregar el lavabo, wáter y ducha",        descriptionEn: "Clean sink, toilet and shower",     emoji: "🚿", category: "home",     suggestedPoints: 30, difficulty: "hard",   suggestedDays: ["sat","sun"] },
  { id: "tc8",  title: "Comprar el pan",           titleEn: "Buy bread",              description: "Ir a la panadería",                      descriptionEn: "Go to the bakery",                  emoji: "🥖", category: "home",     suggestedPoints: 5,  difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
  { id: "tc9",  title: "Hacer la compra",          titleEn: "Grocery shopping",       description: "Lista de la compra completa",            descriptionEn: "Complete grocery shopping",         emoji: "🛒", category: "home",     suggestedPoints: 25, difficulty: "medium" },
  { id: "tc10", title: "Cocinar la cena",          titleEn: "Cook dinner",            description: "Preparar la cena para toda la familia",  descriptionEn: "Prepare dinner for the whole family",emoji: "👨‍🍳", category: "home",   suggestedPoints: 30, difficulty: "hard" },
  { id: "tc11", title: "Poner la mesa",            titleEn: "Set the table",          description: "Preparar la mesa para comer",            descriptionEn: "Set the table for a meal",          emoji: "🥄", category: "home",     suggestedPoints: 5,  difficulty: "easy" },
  { id: "tc12", title: "Sacar la basura",          titleEn: "Take out the trash",     description: "Bajar el cubo a los contenedores",       descriptionEn: "Take the bins down to the containers",emoji: "🗑️",category: "home",    suggestedPoints: 10, difficulty: "easy" },
  { id: "tc13", title: "Limpiar los cristales",    titleEn: "Clean windows",          description: "Limpiar las ventanas y espejos",         descriptionEn: "Clean windows and mirrors",         emoji: "🪟", category: "home",     suggestedPoints: 25, difficulty: "medium" },
  { id: "tc14", title: "Ordenar el salón",         titleEn: "Tidy living room",       description: "Recoger y ordenar el salón",             descriptionEn: "Pick up and tidy the living room",  emoji: "🛋️", category: "home",    suggestedPoints: 15, difficulty: "easy" },

  // ── Estudio ───────────────────────────────────────────────────
  { id: "tc15", title: "Hacer los deberes",        titleEn: "Do homework",            description: "Completar los deberes del día",          descriptionEn: "Complete today's homework",         emoji: "✏️", category: "study",    suggestedPoints: 30, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"], suggestedTime: "17:00" },
  { id: "tc16", title: "Repasar apuntes",          titleEn: "Review notes",           description: "Repasar los apuntes del día",            descriptionEn: "Review today's class notes",        emoji: "📓", category: "study",    suggestedPoints: 20, difficulty: "medium" },
  { id: "tc17", title: "Leer 20 minutos",          titleEn: "Read 20 minutes",        description: "Leer un libro a elegir",                 descriptionEn: "Read a book of your choice",        emoji: "📖", category: "study",    suggestedPoints: 15, difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
  { id: "tc18", title: "Estudiar para el examen",  titleEn: "Study for exam",         description: "Sesión de estudio concentrada",          descriptionEn: "Focused study session",             emoji: "📝", category: "study",    suggestedPoints: 50, difficulty: "hard" },
  { id: "tc19", title: "Practicar inglés",         titleEn: "Practice English",       description: "App de idiomas o ejercicios",            descriptionEn: "Language app or exercises",         emoji: "🌍", category: "study",    suggestedPoints: 20, difficulty: "medium", suggestedDays: ["mon","wed","fri"] },
  { id: "tc20", title: "Ordenar la mochila",       titleEn: "Pack school bag",        description: "Preparar la mochila para el día siguiente",descriptionEn: "Prepare school bag for the next day",emoji: "🎒", category: "study",  suggestedPoints: 5,  difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri"] },
  { id: "tc21", title: "Hacer un proyecto",        titleEn: "Work on a project",      description: "Avanzar en un trabajo o proyecto escolar",descriptionEn: "Progress on a school project",     emoji: "🗂️", category: "study",  suggestedPoints: 40, difficulty: "hard" },

  // ── Deporte ───────────────────────────────────────────────────
  { id: "tc22", title: "Ir al entrenamiento",      titleEn: "Go to training",         description: "Asistir al entrenamiento del equipo",    descriptionEn: "Attend team training",              emoji: "⚽", category: "sports",   suggestedPoints: 25, difficulty: "medium" },
  { id: "tc23", title: "Salir a correr",           titleEn: "Go for a run",           description: "Al menos 20 minutos de carrera",         descriptionEn: "At least 20 minutes of running",    emoji: "🏃", category: "sports",   suggestedPoints: 20, difficulty: "medium", suggestedDays: ["mon","wed","fri"] },
  { id: "tc24", title: "Ejercicio en casa",        titleEn: "Home workout",           description: "Rutina de ejercicios en casa",           descriptionEn: "Home exercise routine",             emoji: "🏋️", category: "sports",   suggestedPoints: 20, difficulty: "medium" },
  { id: "tc25", title: "Ir en bici",              titleEn: "Go cycling",             description: "Salida en bicicleta",                    descriptionEn: "Cycling outing",                    emoji: "🚴", category: "sports",   suggestedPoints: 15, difficulty: "easy" },
  { id: "tc26", title: "Nadar en la piscina",      titleEn: "Swimming",               description: "Sesión de natación",                     descriptionEn: "Swimming session",                  emoji: "🏊", category: "sports",   suggestedPoints: 25, difficulty: "medium" },
  { id: "tc27", title: "Dar un paseo",             titleEn: "Take a walk",            description: "Caminar al menos 30 minutos",            descriptionEn: "Walk for at least 30 minutes",      emoji: "🚶", category: "sports",   suggestedPoints: 10, difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },

  // ── Familia ────────────────────────────────────────────────────
  { id: "tc28", title: "Ayudar a un hermano",      titleEn: "Help a sibling",         description: "Ayudar con deberes o tareas",            descriptionEn: "Help with homework or chores",      emoji: "🤝", category: "family",   suggestedPoints: 20, difficulty: "medium" },
  { id: "tc29", title: "Jugar con los hermanos",   titleEn: "Play with siblings",     description: "Tiempo de juego sin pantallas",          descriptionEn: "Playtime without screens",          emoji: "🎲", category: "family",   suggestedPoints: 15, difficulty: "easy" },
  { id: "tc30", title: "Llamar a los abuelos",     titleEn: "Call grandparents",      description: "Videollamada o llamada a los abuelos",   descriptionEn: "Video call or call grandparents",   emoji: "📞", category: "family",   suggestedPoints: 15, difficulty: "easy",   suggestedDays: ["sun"] },
  { id: "tc31", title: "Cena en familia sin móvil",titleEn: "Family dinner no phones",description: "Cenar juntos sin dispositivos",          descriptionEn: "Dine together without devices",     emoji: "👨‍👩‍👧‍👦", category: "family", suggestedPoints: 20, difficulty: "medium" },

  // ── Personal ──────────────────────────────────────────────────
  { id: "tc32", title: "Levantarse a la hora",     titleEn: "Wake up on time",        description: "Sin repetir la alarma",                  descriptionEn: "Without snoozing the alarm",        emoji: "⏰", category: "personal", suggestedPoints: 10, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"] },
  { id: "tc33", title: "Hacer la cama",            titleEn: "Make the bed",           description: "Hacer la cama antes de desayunar",       descriptionEn: "Make the bed before breakfast",     emoji: "🛏️", category: "personal", suggestedPoints: 5,  difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
  { id: "tc34", title: "Meditar 10 minutos",       titleEn: "Meditate 10 minutes",    description: "Meditación o respiración consciente",    descriptionEn: "Meditation or mindful breathing",   emoji: "🧘", category: "personal", suggestedPoints: 15, difficulty: "easy" },
  { id: "tc35", title: "Sin pantallas 1 hora",     titleEn: "Screen-free 1 hour",     description: "Una hora sin móvil ni tablet",           descriptionEn: "One hour without phone or tablet",  emoji: "📵", category: "personal", suggestedPoints: 15, difficulty: "medium" },
  { id: "tc36", title: "Acostarse a la hora",      titleEn: "Bedtime on schedule",    description: "Cumplir el horario de sueño",            descriptionEn: "Stick to the sleep schedule",       emoji: "😴", category: "personal", suggestedPoints: 10, difficulty: "medium", suggestedDays: ["mon","tue","wed","thu","fri"] },

  // ── Trabajo ───────────────────────────────────────────────────
  { id: "tc37", title: "Ir al trabajo",            titleEn: "Go to work",             description: "Jornada laboral completa",               descriptionEn: "Full work day",                     emoji: "💼", category: "work",     suggestedPoints: 50, difficulty: "hard",   suggestedDays: ["mon","tue","wed","thu","fri"], suggestedTime: "09:00" },
  { id: "tc38", title: "Reunión importante",       titleEn: "Important meeting",      description: "Asistir a una reunión clave",            descriptionEn: "Attend a key meeting",              emoji: "🤝", category: "work",     suggestedPoints: 30, difficulty: "medium" },
  { id: "tc39", title: "Trabajo desde casa",       titleEn: "Work from home",         description: "Jornada completa en remoto",             descriptionEn: "Full remote work day",              emoji: "🏠", category: "work",     suggestedPoints: 40, difficulty: "hard" },

  // ── Mascotas ─────────────────────────────────────────────────
  { id: "tc40", title: "Sacar al perro",           titleEn: "Walk the dog",           description: "Al menos dos paseos diarios",            descriptionEn: "At least two daily walks",          emoji: "🐕", category: "pets",     suggestedPoints: 15, difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },
  { id: "tc41", title: "Limpiar el arenero",       titleEn: "Clean litter box",       description: "Limpiar el arenero del gato",            descriptionEn: "Clean the cat's litter box",        emoji: "🐱", category: "pets",     suggestedPoints: 10, difficulty: "easy" },
  { id: "tc42", title: "Dar de comer a la mascota",titleEn: "Feed the pet",           description: "Comida y agua para la mascota",          descriptionEn: "Food and water for the pet",        emoji: "🐾", category: "pets",     suggestedPoints: 5,  difficulty: "easy",   suggestedDays: ["mon","tue","wed","thu","fri","sat","sun"] },

  // ── Jardín ────────────────────────────────────────────────────
  { id: "tc43", title: "Regar las plantas",        titleEn: "Water the plants",       description: "Regar plantas de interior y exterior",   descriptionEn: "Water indoor and outdoor plants",   emoji: "🌿", category: "garden",   suggestedPoints: 5,  difficulty: "easy",   suggestedDays: ["mon","wed","fri"] },
  { id: "tc44", title: "Cortar el césped",         titleEn: "Mow the lawn",           description: "Cortar el césped del jardín",            descriptionEn: "Mow the garden lawn",               emoji: "🌱", category: "garden",   suggestedPoints: 30, difficulty: "hard",   suggestedDays: ["sat"] },
  { id: "tc45", title: "Limpiar el jardín",        titleEn: "Garden cleanup",         description: "Recoger hojas y limpiar el exterior",    descriptionEn: "Rake leaves and clean outdoors",    emoji: "🍂", category: "garden",   suggestedPoints: 20, difficulty: "medium" },
];
