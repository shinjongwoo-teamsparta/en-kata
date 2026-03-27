export type GameMode = "word" | "symbol" | "variableName";
export type Difficulty = "easy" | "medium" | "hard";
export type NamingConvention = "camelCase" | "snake_case" | "kebab-case" | "PascalCase";
export type WordCategory = "general" | "frontend" | "backend" | "devops" | "database";
export type GameStatus = "idle" | "playing" | "finished";

export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number; // seconds
  convention?: NamingConvention;
  category?: WordCategory;
  showHint?: boolean;
}

export interface GameResult {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number;
  convention?: NamingConvention;
  wpm: number;
  cpm: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  totalWords: number;
  completedWords: number;
  mistakeMap: Record<string, number>;
  wpmTimeline: { second: number; wpm: number }[];
}

export interface WordItem {
  display: string; // what to show (for variableName mode, shows the phrase)
  target: string; // what the user must type
  definition?: string; // vocabulary definition
  example?: string; // usage example
}
