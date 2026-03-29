import type { GameResult, GameSettings, TypingGameState } from "./types";
import { getWords } from "./words";

export interface EngineCallbacks {
  onCorrectKey?: () => void;
  onIncorrectKey?: () => void;
  onWordComplete?: () => void;
  onStateChange?: (state: Readonly<TypingGameState>) => void;
  onFinish?: (result: GameResult) => void;
}

export class TypingGameEngine {
  private state: TypingGameState;
  private settings: GameSettings;
  private callbacks: EngineCallbacks;
  private timer: ReturnType<typeof setInterval> | null = null;
  private correctCharsAccum = 0;

  constructor(settings: GameSettings, callbacks?: EngineCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks ?? {};

    const words = getWords(
      settings.mode,
      settings.difficulty,
      settings.convention,
      settings.category,
      settings.language,
    );

    this.state = {
      status: "idle",
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      input: "",
      timeLeft: settings.duration,
      elapsed: 0,
      correctChars: 0,
      totalKeystrokes: 0,
      mistakeMap: {},
      wpmTimeline: [],
      completedWords: 0,
      charStates: [],
    };
  }

  private calculateWpm(chars: number, seconds: number): number {
    if (seconds === 0) return 0;
    return Math.round((chars / 5) / (seconds / 60));
  }

  private emit(): void {
    this.callbacks.onStateChange?.(this.state);
  }

  start(): void {
    const words = getWords(
      this.settings.mode,
      this.settings.difficulty,
      this.settings.convention,
      this.settings.category,
      this.settings.language,
    );
    this.correctCharsAccum = 0;

    this.state = {
      status: "playing",
      words,
      currentWordIndex: 0,
      currentCharIndex: 0,
      input: "",
      timeLeft: this.settings.duration,
      elapsed: 0,
      correctChars: 0,
      totalKeystrokes: 0,
      mistakeMap: {},
      wpmTimeline: [],
      completedWords: 0,
      charStates: [],
    };

    this.emit();
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      const newElapsed = this.state.elapsed + 1;
      const newTimeLeft = this.settings.duration - newElapsed;
      const wpm = this.calculateWpm(this.correctCharsAccum, newElapsed);

      this.state = {
        ...this.state,
        elapsed: newElapsed,
        timeLeft: Math.max(newTimeLeft, 0),
        wpmTimeline: [
          ...this.state.wpmTimeline,
          { second: newElapsed, wpm },
        ],
      };

      if (newTimeLeft <= 0) {
        this.state = { ...this.state, status: "finished" };
        this.stopTimer();
        this.emit();
        const result = this.getResult();
        if (result) this.callbacks.onFinish?.(result);
        return;
      }

      this.emit();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  finish(): void {
    this.stopTimer();
    this.state = { ...this.state, status: "finished" };
    this.emit();
    const result = this.getResult();
    if (result) this.callbacks.onFinish?.(result);
  }

  handleKey(key: string): void {
    if (this.state.status !== "playing") return;

    const currentTarget = this.state.words[this.state.currentWordIndex]?.target;
    if (!currentTarget) return;

    if (key === "Backspace") {
      if (this.settings.backspaceLock) return;
      if (this.state.currentCharIndex === 0) return;
      const newCharStates = [...this.state.charStates];
      newCharStates.pop();
      this.state = {
        ...this.state,
        currentCharIndex: this.state.currentCharIndex - 1,
        input: this.state.input.slice(0, -1),
        charStates: newCharStates,
      };
      this.emit();
      return;
    }

    // Only process single character keys
    if (key.length !== 1) return;

    const charIndex = this.state.currentCharIndex;
    const expectedChar = currentTarget[charIndex];
    const isCorrect = key === expectedChar;
    const newCharStates = [...this.state.charStates];

    newCharStates[charIndex] = isCorrect ? "correct" : "incorrect";

    if (isCorrect) {
      this.callbacks.onCorrectKey?.();
    } else {
      this.callbacks.onIncorrectKey?.();
    }

    const newMistakeMap = { ...this.state.mistakeMap };
    if (!isCorrect && expectedChar) {
      newMistakeMap[expectedChar] = (newMistakeMap[expectedChar] ?? 0) + 1;
    }

    const newCorrectChars = isCorrect
      ? this.state.correctChars + 1
      : this.state.correctChars;
    if (isCorrect) {
      this.correctCharsAccum = newCorrectChars;
    }

    const newCharIndex = charIndex + 1;
    const newTotalKeystrokes = this.state.totalKeystrokes + 1;

    // Word completed
    if (newCharIndex >= currentTarget.length) {
      this.callbacks.onWordComplete?.();
      const nextWordIndex = this.state.currentWordIndex + 1;

      let words = this.state.words;
      if (nextWordIndex >= words.length) {
        const moreWords = getWords(
          this.settings.mode,
          this.settings.difficulty,
          this.settings.convention,
          this.settings.category,
          this.settings.language,
        );
        words = [...words, ...moreWords];
      }

      this.state = {
        ...this.state,
        words,
        currentWordIndex: nextWordIndex,
        currentCharIndex: 0,
        input: "",
        correctChars: newCorrectChars,
        totalKeystrokes: newTotalKeystrokes,
        mistakeMap: newMistakeMap,
        completedWords: this.state.completedWords + 1,
        charStates: [],
      };
      this.emit();
      return;
    }

    this.state = {
      ...this.state,
      currentCharIndex: newCharIndex,
      input: this.state.input + key,
      correctChars: newCorrectChars,
      totalKeystrokes: newTotalKeystrokes,
      mistakeMap: newMistakeMap,
      charStates: newCharStates,
    };
    this.emit();
  }

  getState(): Readonly<TypingGameState> {
    return this.state;
  }

  getResult(): GameResult | null {
    if (this.state.status !== "finished") return null;

    const elapsed = this.state.elapsed;
    return {
      mode: this.settings.mode,
      difficulty: this.settings.difficulty,
      duration: elapsed,
      convention: this.settings.convention,
      language: this.settings.language,
      category: this.settings.category,
      wpm: this.calculateWpm(this.state.correctChars, elapsed),
      cpm: elapsed > 0 ? Math.round(this.state.correctChars / (elapsed / 60)) : 0,
      accuracy:
        this.state.totalKeystrokes > 0
          ? Math.round((this.state.correctChars / this.state.totalKeystrokes) * 100)
          : 0,
      totalChars: this.state.totalKeystrokes,
      correctChars: this.state.correctChars,
      totalWords: this.state.currentWordIndex + 1,
      completedWords: this.state.completedWords,
      mistakeMap: this.state.mistakeMap,
      wpmTimeline: this.state.wpmTimeline,
    };
  }

  destroy(): void {
    this.stopTimer();
  }
}
