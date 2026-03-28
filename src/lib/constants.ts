import type {
  Difficulty,
  GameMode,
  NamingConvention,
  WordCategory,
} from "~/lib/types";

export const THEMES = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "system", label: "System", icon: "💻" },
  { id: "dark", label: "Dark", icon: "🌙" },
] as const;

export const LOCALES = [
  { id: "en" as const, label: "EN" },
  { id: "ko" as const, label: "한국어" },
];

export const MODE_IDS: GameMode[] = ["word", "phrase", "code", "variableName"];

export const MODE_ICONS: Record<GameMode, string> = {
  word: "Aa",
  phrase: '""',
  code: "</>",
  variableName: "xY",
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

export const CONVENTION_IDS: NamingConvention[] = [
  "camelCase",
  "snake_case",
  "kebab-case",
  "PascalCase",
];

export const MODES_WITHOUT_DIFFICULTY = new Set<GameMode>(["code", "variableName"]);
