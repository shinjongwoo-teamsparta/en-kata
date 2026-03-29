export type GameMode = "word" | "phrase" | "code" | "variableName";
export type ShortCodeLanguage = "typescript" | "python" | "rust" | "go" | "sql" | "bash" | "c";
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
  language?: ShortCodeLanguage;
  showKorean?: boolean;
  backspaceLock?: boolean;
}

export interface GameResult {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number;
  convention?: NamingConvention;
  language?: ShortCodeLanguage;
  category?: WordCategory;
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
  korean?: string; // Korean translation
}

export type CharState = "correct" | "incorrect" | "pending";

export interface TypingGameState {
  status: GameStatus;
  words: WordItem[];
  currentWordIndex: number;
  currentCharIndex: number;
  input: string;
  timeLeft: number;
  elapsed: number;
  correctChars: number;
  totalKeystrokes: number;
  mistakeMap: Record<string, number>;
  wpmTimeline: { second: number; wpm: number }[];
  completedWords: number;
  charStates: CharState[];
}
