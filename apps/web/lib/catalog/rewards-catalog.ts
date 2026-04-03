export type RewardCategory =
  | "technology"
  | "travel"
  | "food"
  | "entertainment"
  | "education"
  | "experiences"
  | "freedom"
  | "sports";

export interface CatalogReward {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  emoji: string;
  category: RewardCategory;
  suggestedPoints: number;
  tier: "easy" | "medium" | "hard" | "epic";
}

export const REWARD_CATEGORIES: Record<RewardCategory, { label: string; labelEn: string; emoji: string; color: string }> = {
  technology: { label: "Tecnología", labelEn: "Technology", emoji: "📱", color: "bg-blue-100 text-blue-700" },
  travel: { label: "Viajes", labelEn: "Travel", emoji: "✈️", color: "bg-sky-100 text-sky-700" },
  food: { label: "Gastronomía", labelEn: "Food", emoji: "🍕", color: "bg-orange-100 text-orange-700" },
  entertainment: { label: "Entretenimiento", labelEn: "Entertainment", emoji: "🎮", color: "bg-purple-100 text-purple-700" },
  education: { label: "Educación", labelEn: "Education", emoji: "📚", color: "bg-green-100 text-green-700" },
  experiences: { label: "Experiencias", labelEn: "Experiences", emoji: "🎡", color: "bg-pink-100 text-pink-700" },
  freedom: { label: "Libertad", labelEn: "Freedom", emoji: "🎉", color: "bg-yellow-100 text-yellow-700" },
  sports: { label: "Deporte", labelEn: "Sports", emoji: "⚽", color: "bg-emerald-100 text-emerald-700" },
};

export const REWARDS_CATALOG: CatalogReward[] = [
  // ── Tecnología ──────────────────────────────────────────────
  { id: "rc1",  title: "Teléfono nuevo",        titleEn: "New phone",          description: "El último modelo de smartphone",               descriptionEn: "Latest smartphone model",                   emoji: "📱", category: "technology",   suggestedPoints: 5000,  tier: "epic" },
  { id: "rc2",  title: "Tablet",                titleEn: "Tablet",             description: "iPad o Android",                               descriptionEn: "iPad or Android tablet",                     emoji: "📲", category: "technology",   suggestedPoints: 8000,  tier: "epic" },
  { id: "rc3",  title: "Auriculares",           titleEn: "Headphones",         description: "Auriculares inalámbricos",                     descriptionEn: "Wireless headphones",                        emoji: "🎧", category: "technology",   suggestedPoints: 2500,  tier: "hard" },
  { id: "rc4",  title: "Videojuego nuevo",      titleEn: "New video game",     description: "Un juego para la consola que elijas",          descriptionEn: "A game for your console of choice",          emoji: "🕹️", category: "technology",  suggestedPoints: 1200,  tier: "hard" },
  { id: "rc5",  title: "Funda para el móvil",   titleEn: "Phone case",         description: "Elige el diseño que más te guste",             descriptionEn: "Choose your favorite design",                emoji: "📱", category: "technology",   suggestedPoints: 300,   tier: "easy" },
  { id: "rc6",  title: "Mes de streaming",      titleEn: "Streaming month",    description: "Netflix, Disney+ o la plataforma que prefieras",descriptionEn: "Netflix, Disney+ or your preferred platform",emoji: "📺", category: "technology",   suggestedPoints: 600,   tier: "medium" },
  { id: "rc7",  title: "Ordenador portátil",    titleEn: "Laptop",             description: "Portátil para estudiar o trabajar",            descriptionEn: "Laptop for studying or work",                emoji: "💻", category: "technology",   suggestedPoints: 12000, tier: "epic" },
  { id: "rc8",  title: "Smartwatch",            titleEn: "Smartwatch",         description: "Reloj inteligente",                            descriptionEn: "Smart watch",                                emoji: "⌚", category: "technology",   suggestedPoints: 3500,  tier: "epic" },

  // ── Viajes ──────────────────────────────���────────────────────
  { id: "rc9",  title: "Viaje de fin de semana",titleEn: "Weekend getaway",    description: "Escapada en familia",                          descriptionEn: "Family weekend trip",                        emoji: "✈️", category: "travel",       suggestedPoints: 10000, tier: "epic" },
  { id: "rc10", title: "Excursión de un día",   titleEn: "Day trip",           description: "Visita a un lugar especial cerca de casa",     descriptionEn: "Visit a special place nearby",               emoji: "🚗", category: "travel",       suggestedPoints: 1500,  tier: "hard" },
  { id: "rc11", title: "Parque de atracciones", titleEn: "Theme park",         description: "Un día en un parque de atracciones",           descriptionEn: "A day at a theme park",                      emoji: "🎢", category: "travel",       suggestedPoints: 2000,  tier: "hard" },
  { id: "rc12", title: "Parque acuático",       titleEn: "Water park",         description: "Diversión con agua para el verano",            descriptionEn: "Summer water fun",                           emoji: "🏊", category: "travel",       suggestedPoints: 1500,  tier: "hard" },
  { id: "rc13", title: "Vacaciones de verano",  titleEn: "Summer vacation",    description: "Destino por acordar en familia",               descriptionEn: "Destination to be agreed by the family",     emoji: "🏖️", category: "travel",      suggestedPoints: 20000, tier: "epic" },
  { id: "rc14", title: "Visita al zoo",         titleEn: "Zoo visit",          description: "Pasar el día en el zoo o safari",              descriptionEn: "Day at the zoo or safari park",              emoji: "🦁", category: "travel",       suggestedPoints: 800,   tier: "medium" },

  // ── Gastronomía ──────────────────────────────────────────────
  { id: "rc15", title: "Pizza para cenar",      titleEn: "Pizza dinner",       description: "Pedimos pizza la noche que elijas",            descriptionEn: "Order pizza on your chosen night",           emoji: "🍕", category: "food",         suggestedPoints: 300,   tier: "easy" },
  { id: "rc16", title: "Hamburguesa",           titleEn: "Burger night",       description: "Tu hamburguesa favorita",                      descriptionEn: "Your favorite burger",                        emoji: "🍔", category: "food",         suggestedPoints: 250,   tier: "easy" },
  { id: "rc17", title: "Cena en restaurante",   titleEn: "Restaurant dinner",  description: "Elegir el restaurante para cenar",             descriptionEn: "Choose the restaurant for dinner",           emoji: "🍽️", category: "food",        suggestedPoints: 800,   tier: "medium" },
  { id: "rc18", title: "Helado",                titleEn: "Ice cream",          description: "Helado en la heladería",                       descriptionEn: "Ice cream at the ice cream parlor",          emoji: "🍦", category: "food",         suggestedPoints: 100,   tier: "easy" },
  { id: "rc19", title: "Tarta de cumpleaños",   titleEn: "Birthday cake",      description: "Tu tarta favorita",                            descriptionEn: "Your favorite cake",                          emoji: "🎂", category: "food",         suggestedPoints: 400,   tier: "easy" },
  { id: "rc20", title: "Desayuno especial",     titleEn: "Special breakfast",  description: "Desayuno de domingo con lo que más te guste",  descriptionEn: "Sunday breakfast with your favorites",       emoji: "🥞", category: "food",         suggestedPoints: 200,   tier: "easy" },
  { id: "rc21", title: "Sushi",                 titleEn: "Sushi night",        description: "Pedido de sushi a domicilio",                  descriptionEn: "Sushi delivery",                              emoji: "🍱", category: "food",         suggestedPoints: 600,   tier: "medium" },

  // ── Entretenimiento ───────────────────────���──────────────────
  { id: "rc22", title: "Noche de juegos",       titleEn: "Game night",         description: "Una noche de juegos de mesa en familia",       descriptionEn: "Board game night with the family",           emoji: "🎲", category: "entertainment",suggestedPoints: 150,   tier: "easy" },
  { id: "rc23", title: "Cine",                  titleEn: "Cinema",             description: "Ir al cine a ver la peli que elijas",          descriptionEn: "Go to the cinema to see the movie you choose",emoji: "🎬", category: "entertainment",suggestedPoints: 500,   tier: "medium" },
  { id: "rc24", title: "Concierto",             titleEn: "Concert",            description: "Entradas para un concierto",                   descriptionEn: "Tickets for a concert",                       emoji: "🎵", category: "entertainment",suggestedPoints: 2000,  tier: "hard" },
  { id: "rc25", title: "Tarde de videojuegos",  titleEn: "Gaming afternoon",   description: "Una tarde libre para jugar sin límite",        descriptionEn: "Free afternoon to game without limits",      emoji: "🎮", category: "entertainment",suggestedPoints: 200,   tier: "easy" },
  { id: "rc26", title: "Juego de mesa nuevo",   titleEn: "New board game",     description: "Elegir un juego de mesa para la familia",      descriptionEn: "Choose a new board game for the family",     emoji: "♟️", category: "entertainment",suggestedPoints: 700,   tier: "medium" },
  { id: "rc27", title: "Maratón de series",     titleEn: "Series marathon",    description: "Elegir la serie y verla todo el fin de semana",descriptionEn: "Choose a series and watch it all weekend",   emoji: "📺", category: "entertainment",suggestedPoints: 300,   tier: "easy" },

  // ── Educación ─────────────────────────��──────────────────────
  { id: "rc28", title: "Libro favorito",        titleEn: "Favorite book",      description: "Elegir cualquier libro",                       descriptionEn: "Choose any book",                            emoji: "📖", category: "education",    suggestedPoints: 300,   tier: "easy" },
  { id: "rc29", title: "Curso online",          titleEn: "Online course",      description: "Curso de algo que quieras aprender",           descriptionEn: "Course about something you want to learn",   emoji: "🎓", category: "education",    suggestedPoints: 1500,  tier: "hard" },
  { id: "rc30", title: "Material escolar",      titleEn: "School supplies",    description: "Mochila, estuche u objetos escolares",         descriptionEn: "Backpack, pencil case or school items",      emoji: "🎒", category: "education",    suggestedPoints: 800,   tier: "medium" },
  { id: "rc31", title: "Taller o actividad",    titleEn: "Workshop",           description: "Clases de algo que te guste",                  descriptionEn: "Classes in something you enjoy",             emoji: "🎨", category: "education",    suggestedPoints: 2000,  tier: "hard" },

  // ── Experiencias ─────────────────────────��───────────────────
  { id: "rc32", title: "Karting",               titleEn: "Go-kart",            description: "Una sesión de karting",                        descriptionEn: "A go-kart session",                          emoji: "🏎️", category: "experiences",  suggestedPoints: 1000,  tier: "hard" },
  { id: "rc33", title: "Escalada",              titleEn: "Climbing",           description: "Sesión de escalada en rocódromo",              descriptionEn: "Climbing session at a climbing wall",        emoji: "🧗", category: "experiences",   suggestedPoints: 600,   tier: "medium" },
  { id: "rc34", title: "Escape room",           titleEn: "Escape room",        description: "Una sala de escape en familia",                descriptionEn: "A family escape room",                        emoji: "🔐", category: "experiences",   suggestedPoints: 1500,  tier: "hard" },
  { id: "rc35", title: "Paintball",             titleEn: "Paintball",          description: "Tarde de paintball",                           descriptionEn: "Paintball afternoon",                         emoji: "🎯", category: "experiences",   suggestedPoints: 1200,  tier: "hard" },
  { id: "rc36", title: "Bowling",               titleEn: "Bowling",            description: "Partidas de bowling",                          descriptionEn: "Bowling games",                               emoji: "🎳", category: "experiences",   suggestedPoints: 400,   tier: "easy" },

  // ── Libertad ─────────────────────────────────────────────────
  { id: "rc37", title: "Tarde libre de tareas", titleEn: "Chores-free afternoon",description: "Un día sin deberes ni responsabilidades",     descriptionEn: "A day without homework or responsibilities", emoji: "🎉", category: "freedom",      suggestedPoints: 200,   tier: "easy" },
  { id: "rc38", title: "Dormir hasta tarde",    titleEn: "Sleep in",           description: "Sin horario un día de fin de semana",          descriptionEn: "No schedule one weekend day",                emoji: "😴", category: "freedom",      suggestedPoints: 150,   tier: "easy" },
  { id: "rc39", title: "Elegir la cena",        titleEn: "Choose dinner",      description: "Decidir el menú de la cena",                   descriptionEn: "Decide the dinner menu",                      emoji: "🍽️", category: "freedom",     suggestedPoints: 100,   tier: "easy" },
  { id: "rc40", title: "Día sin pantalla para los papás", titleEn: "No-screen day for parents", description: "Papás sin móvil durante el día", descriptionEn: "Parents without phones for a day",       emoji: "📵", category: "freedom",      suggestedPoints: 500,   tier: "medium" },

  // ── Deporte ────────────────────────��─────────────────────────
  { id: "rc41", title: "Bicicleta nueva",       titleEn: "New bicycle",        description: "Una bici de montaña o ciudad",                 descriptionEn: "A mountain or city bike",                    emoji: "🚲", category: "sports",       suggestedPoints: 8000,  tier: "epic" },
  { id: "rc42", title: "Material deportivo",    titleEn: "Sports equipment",   description: "Zapatillas, ropa deportiva o equipamiento",    descriptionEn: "Sneakers, sportswear or equipment",          emoji: "👟", category: "sports",       suggestedPoints: 1200,  tier: "hard" },
  { id: "rc43", title: "Partido de fútbol",     titleEn: "Football match",     description: "Entradas para ver un partido",                 descriptionEn: "Tickets to watch a match",                   emoji: "⚽", category: "sports",       suggestedPoints: 1500,  tier: "hard" },
  { id: "rc44", title: "Sesión de surf",        titleEn: "Surf lesson",        description: "Clase de surf o paddle surf",                  descriptionEn: "Surf or paddleboard lesson",                 emoji: "🏄", category: "sports",       suggestedPoints: 800,   tier: "medium" },
];
