export {
  MODE_IDS,
  MODE_ICONS,
  DURATIONS,
  DIFFICULTIES,
  CATEGORY_IDS,
  MODES_WITHOUT_DIFFICULTY,
} from "@en-kata/core";

export const THEMES = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "system", label: "System", icon: "💻" },
  { id: "dark", label: "Dark", icon: "🌙" },
] as const;

export const LOCALES = [
  { id: "en" as const, label: "EN" },
  { id: "ko" as const, label: "한국어" },
];
