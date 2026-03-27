"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameResult, GameSettings, GameStatus, WordItem } from "~/lib/types";
import { getWords } from "~/lib/words";

interface TypingGameState {
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
  // Per-character state for current display
  charStates: ("correct" | "incorrect" | "pending")[];
}

export function useTypingGame(settings: GameSettings) {
  const [state, setState] = useState<TypingGameState>(() => {
    const words = getWords(
      settings.mode,
      settings.difficulty,
      settings.convention,
      settings.category,
    );
    return {
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
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const correctCharsRef = useRef(0);

  const currentWord = state.words[state.currentWordIndex];

  // Calculate WPM
  const calculateWpm = useCallback((chars: number, seconds: number): number => {
    if (seconds === 0) return 0;
    return Math.round((chars / 5) / (seconds / 60));
  }, []);

  // Start the game
  const start = useCallback(() => {
    const words = getWords(
      settings.mode,
      settings.difficulty,
      settings.convention,
      settings.category,
    );
    correctCharsRef.current = 0;
    startTimeRef.current = Date.now();

    setState({
      status: "playing",
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
    });
  }, [settings]);

  // End the game
  const finish = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "finished" }));
  }, []);

  // Timer
  useEffect(() => {
    if (state.status !== "playing") return;

    timerRef.current = setInterval(() => {
      setState((prev) => {
        const newElapsed = prev.elapsed + 1;
        const newTimeLeft = settings.duration - newElapsed;
        const wpm = calculateWpm(correctCharsRef.current, newElapsed);

        const newTimeline = [
          ...prev.wpmTimeline,
          { second: newElapsed, wpm },
        ];

        if (newTimeLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return {
            ...prev,
            status: "finished" as const,
            elapsed: newElapsed,
            timeLeft: 0,
            wpmTimeline: newTimeline,
          };
        }

        return {
          ...prev,
          elapsed: newElapsed,
          timeLeft: newTimeLeft,
          wpmTimeline: newTimeline,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, settings.duration, calculateWpm]);

  // Handle key input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state.status !== "playing" || !currentWord) return;

      // Ignore IME composition events
      if (e.isComposing || e.keyCode === 229) return;

      // Ignore modifier keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setState((prev) => {
          if (prev.currentCharIndex === 0) return prev;
          const newCharStates = [...prev.charStates];
          newCharStates.pop();
          return {
            ...prev,
            currentCharIndex: prev.currentCharIndex - 1,
            input: prev.input.slice(0, -1),
            charStates: newCharStates,
          };
        });
        return;
      }

      // Only process single character keys
      if (e.key.length !== 1) return;
      e.preventDefault();

      setState((prev) => {
        const currentTarget = prev.words[prev.currentWordIndex]?.target;
        if (!currentTarget) return prev;
        const charIndex = prev.currentCharIndex;
        const expectedChar = currentTarget[charIndex];
        const isCorrect = e.key === expectedChar;
        const newCharStates = [...prev.charStates];

        newCharStates[charIndex] = isCorrect ? "correct" : "incorrect";

        const newMistakeMap = { ...prev.mistakeMap };
        if (!isCorrect && expectedChar) {
          newMistakeMap[expectedChar] = (newMistakeMap[expectedChar] ?? 0) + 1;
        }

        const newCorrectChars = isCorrect
          ? prev.correctChars + 1
          : prev.correctChars;
        if (isCorrect) {
          correctCharsRef.current = newCorrectChars;
        }

        const newCharIndex = charIndex + 1;
        const newTotalKeystrokes = prev.totalKeystrokes + 1;

        // Word completed
        if (newCharIndex >= currentTarget.length) {
          const nextWordIndex = prev.currentWordIndex + 1;

          // If we run out of words, get more
          if (nextWordIndex >= prev.words.length) {
            const moreWords = getWords(
              settings.mode,
              settings.difficulty,
              settings.convention,
              settings.category,
            );
            return {
              ...prev,
              words: [...prev.words, ...moreWords],
              currentWordIndex: nextWordIndex,
              currentCharIndex: 0,
              input: "",
              correctChars: newCorrectChars,
              totalKeystrokes: newTotalKeystrokes,
              mistakeMap: newMistakeMap,
              completedWords: prev.completedWords + 1,
              charStates: [],
            };
          }

          return {
            ...prev,
            currentWordIndex: nextWordIndex,
            currentCharIndex: 0,
            input: "",
            correctChars: newCorrectChars,
            totalKeystrokes: newTotalKeystrokes,
            mistakeMap: newMistakeMap,
            completedWords: prev.completedWords + 1,
            charStates: [],
          };
        }

        return {
          ...prev,
          currentCharIndex: newCharIndex,
          input: prev.input + e.key,
          correctChars: newCorrectChars,
          totalKeystrokes: newTotalKeystrokes,
          mistakeMap: newMistakeMap,
          charStates: newCharStates,
        };
      });
    },
    [state.status, currentWord, settings],
  );

  // Keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Build result
  const result: GameResult | null =
    state.status === "finished"
      ? {
          mode: settings.mode,
          difficulty: settings.difficulty,
          duration: state.elapsed,
          convention: settings.convention,
          wpm: calculateWpm(state.correctChars, state.elapsed),
          cpm: state.elapsed > 0 ? Math.round(state.correctChars / (state.elapsed / 60)) : 0,
          accuracy:
            state.totalKeystrokes > 0
              ? Math.round((state.correctChars / state.totalKeystrokes) * 100)
              : 0,
          totalChars: state.totalKeystrokes,
          correctChars: state.correctChars,
          totalWords: state.currentWordIndex + 1,
          completedWords: state.completedWords,
          mistakeMap: state.mistakeMap,
          wpmTimeline: state.wpmTimeline,
        }
      : null;

  return {
    status: state.status,
    currentWord,
    currentWordIndex: state.currentWordIndex,
    currentCharIndex: state.currentCharIndex,
    charStates: state.charStates,
    words: state.words,
    timeLeft: state.timeLeft,
    elapsed: state.elapsed,
    wpm: calculateWpm(state.correctChars, state.elapsed),
    completedWords: state.completedWords,
    result,
    start,
    finish,
  };
}
