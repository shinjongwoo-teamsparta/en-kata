"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TypingGameEngine } from "@en-kata/core";
import type { GameResult, GameSettings, TypingGameState, WordItem } from "~/lib/types";

interface TypingGameCallbacks {
  onCorrectKey?: () => void;
  onIncorrectKey?: () => void;
  onWordComplete?: () => void;
}

export function useTypingGame(settings: GameSettings, callbacks?: TypingGameCallbacks) {
  const engineRef = useRef<TypingGameEngine | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const [state, setState] = useState<TypingGameState>(() => {
    const engine = new TypingGameEngine(settings);
    const s = engine.getState();
    engine.destroy();
    return { ...s };
  });

  const initEngine = useCallback(
    (backspaceLock: boolean) => {
      engineRef.current?.destroy();
      const engine = new TypingGameEngine(
        { ...settings, backspaceLock },
        {
          onStateChange: (s) => setState({ ...s }),
          onCorrectKey: () => callbacksRef.current?.onCorrectKey?.(),
          onIncorrectKey: () => callbacksRef.current?.onIncorrectKey?.(),
          onWordComplete: () => callbacksRef.current?.onWordComplete?.(),
        },
      );
      engineRef.current = engine;
      return engine;
    },
    [settings],
  );

  // Keyboard listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (e.isComposing || e.keyCode === 229) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Backspace" || e.key.length === 1) {
        e.preventDefault();
      }
      engineRef.current.handleKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => engineRef.current?.destroy();
  }, []);

  const start = useCallback(() => {
    const backspaceLock = localStorage.getItem("backspaceLock") === "true";
    const engine = initEngine(backspaceLock);
    engine.start();
  }, [initEngine]);

  const finish = useCallback(() => {
    engineRef.current?.finish();
  }, []);

  const currentWord: WordItem | undefined = state.words[state.currentWordIndex];
  const wpm =
    state.elapsed > 0
      ? Math.round((state.correctChars / 5) / (state.elapsed / 60))
      : 0;

  const result: GameResult | null = engineRef.current?.getResult() ?? null;

  return {
    status: state.status,
    currentWord,
    currentWordIndex: state.currentWordIndex,
    currentCharIndex: state.currentCharIndex,
    charStates: state.charStates,
    words: state.words,
    timeLeft: state.timeLeft,
    elapsed: state.elapsed,
    wpm,
    completedWords: state.completedWords,
    result,
    start,
    finish,
  };
}
