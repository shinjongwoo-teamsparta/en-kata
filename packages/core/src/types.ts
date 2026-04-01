export type GameMode = "word" | "phrase" | "code" | "paragraph";
export type ShortCodeLanguage = "typescript" | "python" | "rust" | "go" | "sql" | "bash" | "c";
export type Difficulty = "easy" | "medium" | "hard";

export type GameStatus = "idle" | "playing" | "finished";

export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number; // seconds
  language?: ShortCodeLanguage;
  showKorean?: boolean;
  backspaceLock?: boolean;
}

export interface GameResult {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number;
  language?: ShortCodeLanguage;
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
  display: string;
  target: string;
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
