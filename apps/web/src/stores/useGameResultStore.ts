import { create } from "zustand";
import type { GameResult } from "~/lib/types";

interface GameResultState {
  result: GameResult | null;
  setResult: (result: GameResult) => void;
  clear: () => void;
}

export const useGameResultStore = create<GameResultState>()((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clear: () => set({ result: null }),
}));
