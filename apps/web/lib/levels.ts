export interface Level {
  level: number;
  titleEs: string;
  titleEn: string;
  emoji: string;
  minAchievements: number;
}

export const LEVELS: Level[] = [
  { level: 1, titleEs: "Novato",     titleEn: "Rookie",     emoji: "\u{1F331}", minAchievements: 0 },
  { level: 2, titleEs: "Aprendiz",   titleEn: "Apprentice", emoji: "\u{1F4D7}", minAchievements: 3 },
  { level: 3, titleEs: "Competente", titleEn: "Competent",  emoji: "\u26A1",    minAchievements: 7 },
  { level: 4, titleEs: "Experto",    titleEn: "Expert",     emoji: "\u{1F525}", minAchievements: 12 },
  { level: 5, titleEs: "Maestro",    titleEn: "Master",     emoji: "\u{1F451}", minAchievements: 18 },
  { level: 6, titleEs: "Leyenda",    titleEn: "Legend",      emoji: "\u{1F48E}", minAchievements: 23 },
];

export function getLevelForAchievementCount(count: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (count >= LEVELS[i].minAchievements) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(current: Level): Level | null {
  const idx = LEVELS.findIndex((l) => l.level === current.level);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}
