import type {
  Difficulty,
  GameMode,
  ShortCodeLanguage,
  WordCategory,
} from "./types";

export const MODE_IDS: GameMode[] = ["word", "phrase", "code", "paragraph"];

export const MODE_ICONS: Record<GameMode, string> = {
  word: "Aa",
  phrase: '""',
  code: "</>",
  paragraph: "¶",
};

export const DURATIONS = [30, 60, 120];

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const CATEGORY_IDS: WordCategory[] = [
  "general",
  "frontend",
  "backend",
  "devops",
  "database",
];

export const LANGUAGE_IDS: ShortCodeLanguage[] = [
  "typescript",
  "python",
  "rust",
  "go",
  "sql",
  "bash",
  "c",
];

export const MODES_WITHOUT_DIFFICULTY = new Set<GameMode>(["code"]);
