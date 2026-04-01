import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Difficulty,
  GameMode,
  GameSettings,
  ShortCodeLanguage,
  WordCategory,
} from "~/lib/types";

interface ModePrefs {
  duration?: number;
  difficulty?: Difficulty;
  category?: WordCategory;
  language?: ShortCodeLanguage;
}

export interface SettingsState {
  // Current game settings (selected on home page)
  mode: GameMode;
  duration: number;
  difficulty: Difficulty;
  category: WordCategory;
  language: ShortCodeLanguage;

  // Global toggles (set in SettingsModal)
  showKorean: boolean;
  backspaceLock: boolean;
  effect: boolean;

  // Per-mode cached preferences
  modePrefs: Partial<Record<GameMode, ModePrefs>>;

  // Actions
  setMode: (mode: GameMode) => void;
  setDuration: (duration: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setCategory: (category: WordCategory) => void;
  setLanguage: (language: ShortCodeLanguage) => void;
  setShowKorean: (value: boolean) => void;
  setBackspaceLock: (value: boolean) => void;
  setEffect: (value: boolean) => void;
  toggleShowKorean: () => void;
  toggleBackspaceLock: () => void;
  toggleEffect: () => void;

  /** Save current selections as cached prefs for the active mode */
  saveModePrefs: () => void;

  /** Restore cached prefs when switching mode */
  restoreModePrefs: (mode: GameMode) => void;

  /** Build a GameSettings object for the engine */
  getGameSettings: () => GameSettings;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      mode: "word",
      duration: 60,
      difficulty: "medium",
      category: "general",
      language: "typescript",
      showKorean: false,
      backspaceLock: false,
      effect: false,
      modePrefs: {},

      setMode: (mode) => set({ mode }),
      setDuration: (duration) => set({ duration }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setCategory: (category) => set({ category }),
      setLanguage: (language) => set({ language }),
      setShowKorean: (value) => set({ showKorean: value }),
      setBackspaceLock: (value) => set({ backspaceLock: value }),
      setEffect: (value) => set({ effect: value }),
      toggleShowKorean: () => set((s) => ({ showKorean: !s.showKorean })),
      toggleBackspaceLock: () =>
        set((s) => ({ backspaceLock: !s.backspaceLock })),
      toggleEffect: () =>
        set((s) => ({ effect: !s.effect })),

      saveModePrefs: () => {
        const { mode, duration, difficulty, category, language, modePrefs } = get();
        set({
          modePrefs: {
            ...modePrefs,
            [mode]: { duration, difficulty, category, language },
          },
        });
      },

      restoreModePrefs: (mode) => {
        const prefs = get().modePrefs[mode];
        if (prefs) {
          set({
            ...(prefs.duration != null && { duration: prefs.duration }),
            ...(prefs.difficulty != null && { difficulty: prefs.difficulty }),
            ...(prefs.category != null && { category: prefs.category }),
            ...(prefs.language != null && { language: prefs.language }),
          });
        }
      },

      getGameSettings: () => {
        const s = get();
        return {
          mode: s.mode,
          duration: s.duration,
          difficulty: s.difficulty,
          category: s.mode === "word" ? s.category : undefined,
          language: s.mode === "code" ? s.language : undefined,
          showKorean: s.mode === "phrase" ? s.showKorean : false,
          backspaceLock: s.backspaceLock,
        };
      },
    }),
    {
      name: "en-kata-settings",
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version === 0) {
          if ("canvasRenderer" in state) {
            state.effect = state.canvasRenderer;
            delete state.canvasRenderer;
          }
        }
        return state;
      },
      partialize: (state) => ({
        mode: state.mode,
        duration: state.duration,
        difficulty: state.difficulty,
        category: state.category,
        language: state.language,
        showKorean: state.showKorean,
        backspaceLock: state.backspaceLock,
        effect: state.effect,
        modePrefs: state.modePrefs,
      }),
    },
  ),
);
