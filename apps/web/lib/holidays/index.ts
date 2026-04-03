export interface Holiday {
  date: string; // "MM-DD" or "YYYY-MM-DD" for fixed date, or computed
  name: string;
  nameEn: string;
  type: "national" | "regional" | "school";
  emoji: string;
}

export interface Region {
  code: string;
  name: string;
  country: string;
}

export const COUNTRIES = [
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
];

export const REGIONS: Region[] = [
  // España
  { code: "ES-MD", name: "Madrid",      country: "ES" },
  { code: "ES-CT", name: "Cataluña",    country: "ES" },
  { code: "ES-AN", name: "Andalucía",   country: "ES" },
  { code: "ES-VC", name: "Valencia",    country: "ES" },
  { code: "ES-PV", name: "País Vasco",  country: "ES" },
  { code: "ES-GA", name: "Galicia",     country: "ES" },
  { code: "ES-CL", name: "Castilla y León", country: "ES" },
  { code: "ES-CM", name: "Castilla-La Mancha", country: "ES" },
  { code: "ES-CN", name: "Canarias",    country: "ES" },
  { code: "ES-IB", name: "Baleares",    country: "ES" },
  // México
  { code: "MX-CDMX", name: "Ciudad de México", country: "MX" },
  { code: "MX-JAL",  name: "Jalisco",          country: "MX" },
  { code: "MX-NL",   name: "Nuevo León",       country: "MX" },
  // Argentina
  { code: "AR-BA",   name: "Buenos Aires",     country: "AR" },
  { code: "AR-CBA",  name: "Córdoba",          country: "AR" },
];

// Fixed date holidays by country (MM-DD format)
const HOLIDAYS_ES: Holiday[] = [
  { date: "01-01", name: "Año Nuevo",                  nameEn: "New Year's Day",          type: "national", emoji: "🎆" },
  { date: "01-06", name: "Reyes Magos",                nameEn: "Epiphany",                type: "national", emoji: "👑" },
  { date: "05-01", name: "Día del Trabajador",         nameEn: "Labor Day",               type: "national", emoji: "🔨" },
  { date: "08-15", name: "Asunción de la Virgen",      nameEn: "Assumption of Mary",      type: "national", emoji: "⛪" },
  { date: "10-12", name: "Fiesta Nacional de España",  nameEn: "National Day of Spain",   type: "national", emoji: "🇪🇸" },
  { date: "11-01", name: "Todos los Santos",           nameEn: "All Saints' Day",         type: "national", emoji: "🕯️" },
  { date: "12-06", name: "Día de la Constitución",     nameEn: "Constitution Day",        type: "national", emoji: "📜" },
  { date: "12-08", name: "Inmaculada Concepción",      nameEn: "Immaculate Conception",   type: "national", emoji: "⛪" },
  { date: "12-25", name: "Navidad",                    nameEn: "Christmas Day",           type: "national", emoji: "🎄" },
  // Semana Santa (approximate — moveable feast, shown as fixed approximation)
  { date: "04-18", name: "Viernes Santo",              nameEn: "Good Friday",             type: "national", emoji: "✝️" },
];

const HOLIDAYS_ES_MD: Holiday[] = [
  { date: "05-02", name: "Fiesta de la Comunidad de Madrid", nameEn: "Community of Madrid Day", type: "regional", emoji: "🏛️" },
  { date: "11-09", name: "Almudena",                         nameEn: "Almudena",                type: "regional", emoji: "⛪" },
];

const HOLIDAYS_ES_CT: Holiday[] = [
  { date: "09-11", name: "Diada Nacional de Catalunya",      nameEn: "Catalan National Day",    type: "regional", emoji: "🎗️" },
  { date: "12-26", name: "Sant Esteve",                      nameEn: "St. Stephen's Day",       type: "regional", emoji: "⛪" },
];

const HOLIDAYS_ES_AN: Holiday[] = [
  { date: "02-28", name: "Día de Andalucía",                 nameEn: "Andalusia Day",           type: "regional", emoji: "🌻" },
];

const HOLIDAYS_ES_VC: Holiday[] = [
  { date: "03-19", name: "San José (Fallas)",                nameEn: "St. Joseph's Day",        type: "regional", emoji: "🎆" },
  { date: "10-09", name: "Día de la Comunitat Valenciana",   nameEn: "Valencian Community Day", type: "regional", emoji: "🎗️" },
];

const HOLIDAYS_MX: Holiday[] = [
  { date: "01-01", name: "Año Nuevo",                        nameEn: "New Year's Day",          type: "national", emoji: "🎆" },
  { date: "02-05", name: "Día de la Constitución",           nameEn: "Constitution Day",        type: "national", emoji: "📜" },
  { date: "03-21", name: "Natalicio de Benito Juárez",       nameEn: "Benito Juárez's Birthday",type: "national", emoji: "🇲🇽" },
  { date: "05-01", name: "Día del Trabajador",               nameEn: "Labor Day",               type: "national", emoji: "🔨" },
  { date: "09-16", name: "Día de la Independencia",          nameEn: "Independence Day",        type: "national", emoji: "🇲🇽" },
  { date: "11-02", name: "Día de Muertos",                   nameEn: "Day of the Dead",         type: "national", emoji: "💀" },
  { date: "11-20", name: "Revolución Mexicana",              nameEn: "Revolution Day",          type: "national", emoji: "⚔️" },
  { date: "12-25", name: "Navidad",                          nameEn: "Christmas Day",           type: "national", emoji: "🎄" },
];

const HOLIDAYS_AR: Holiday[] = [
  { date: "01-01", name: "Año Nuevo",                        nameEn: "New Year's Day",          type: "national", emoji: "🎆" },
  { date: "03-24", name: "Día de la Memoria",                nameEn: "Day of Remembrance",      type: "national", emoji: "🕊️" },
  { date: "04-02", name: "Día del Veterano",                 nameEn: "Veterans Day",            type: "national", emoji: "🎗️" },
  { date: "05-01", name: "Día del Trabajador",               nameEn: "Labor Day",               type: "national", emoji: "🔨" },
  { date: "05-25", name: "Día de la Patria",                 nameEn: "National Day",            type: "national", emoji: "🇦🇷" },
  { date: "07-09", name: "Día de la Independencia",          nameEn: "Independence Day",        type: "national", emoji: "🇦🇷" },
  { date: "08-17", name: "Paso a la Inmortalidad - San Martín", nameEn: "San Martín Day",       type: "national", emoji: "⚔️" },
  { date: "10-12", name: "Día del Respeto a la Diversidad",  nameEn: "Diversity Day",           type: "national", emoji: "🌍" },
  { date: "12-25", name: "Navidad",                          nameEn: "Christmas Day",           type: "national", emoji: "🎄" },
];

export function getHolidaysForMonth(
  year: number,
  month: number, // 0-indexed
  country: string,
  region?: string
): Map<string, Holiday[]> {
  const result = new Map<string, Holiday[]>();

  let national: Holiday[] = [];
  let regional: Holiday[] = [];

  if (country === "ES") national = HOLIDAYS_ES;
  else if (country === "MX") national = HOLIDAYS_MX;
  else if (country === "AR") national = HOLIDAYS_AR;

  if (region === "ES-MD") regional = HOLIDAYS_ES_MD;
  else if (region === "ES-CT") regional = HOLIDAYS_ES_CT;
  else if (region === "ES-AN") regional = HOLIDAYS_ES_AN;
  else if (region === "ES-VC") regional = HOLIDAYS_ES_VC;

  const allHolidays = [...national, ...regional];

  for (const holiday of allHolidays) {
    const [mm, dd] = holiday.date.split("-").map(Number);
    if (mm - 1 === month) {
      const key = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      const existing = result.get(key) ?? [];
      result.set(key, [...existing, holiday]);
    }
  }

  return result;
}

export function getHolidayForDate(
  dateStr: string, // "YYYY-MM-DD"
  country: string,
  region?: string
): Holiday | undefined {
  const [, mm, dd] = dateStr.split("-");
  const monthDay = `${mm}-${dd}`;

  let national: Holiday[] = [];
  let regional: Holiday[] = [];

  if (country === "ES") national = HOLIDAYS_ES;
  else if (country === "MX") national = HOLIDAYS_MX;
  else if (country === "AR") national = HOLIDAYS_AR;

  if (region === "ES-MD") regional = HOLIDAYS_ES_MD;
  else if (region === "ES-CT") regional = HOLIDAYS_ES_CT;
  else if (region === "ES-AN") regional = HOLIDAYS_ES_AN;
  else if (region === "ES-VC") regional = HOLIDAYS_ES_VC;

  return [...regional, ...national].find((h) => h.date === monthDay);
}
