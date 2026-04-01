"use client";

import { useRef, useEffect } from "react";
import type { CharState, GameMode } from "@en-kata/core";
import { CanvasRenderer } from "./CanvasRenderer";

interface CanvasTypingAreaProps {
  text: string;
  currentCharIndex: number;
  charStates: CharState[];
  completedWords: number;
  mode: GameMode;
  effect: boolean;
  onCorrectKey?: () => void;
  onIncorrectKey?: () => void;
  onWordComplete?: () => void;
}

export default function CanvasTypingArea({
  text,
  currentCharIndex,
  charStates,
  completedWords,
  mode,
  effect,
  onCorrectKey,
  onIncorrectKey,
  onWordComplete,
}: CanvasTypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const prevCharIndex = useRef(0);
  const prevCompletedWords = useRef(0);
  const hadTypoInWord = useRef(false);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas, mode, effect);
    rendererRef.current = renderer;

    // Wait for fonts to load before starting
    document.fonts.ready.then(() => {
      const container = containerRef.current;
      if (!container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      renderer.resize(rect.width, 200, dpr); // initial height, will auto-adjust
      renderer.setText(text);
      renderer.start();
    });

    return () => {
      renderer.stop();
      rendererRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle text changes (new paragraph)
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !text) return;

    document.fonts.ready.then(() => {
      renderer.setText(text);
      prevCharIndex.current = 0;
    });
  }, [text]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const renderer = rendererRef.current;
      if (!renderer) return;

      const dpr = window.devicePixelRatio || 1;
      const width = entry.contentRect.width;
      const height = renderer.getRequiredHeight();
      renderer.resize(width, height, dpr);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update state and trigger effects
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.updateState(currentCharIndex, charStates);

    // Detect correct/incorrect keystrokes
    if (currentCharIndex > prevCharIndex.current) {
      const lastTypedIndex = currentCharIndex - 1;
      if (charStates[lastTypedIndex] === "correct") {
        renderer.onCorrectKey();
        onCorrectKey?.();
      } else if (charStates[lastTypedIndex] === "incorrect") {
        renderer.onIncorrectKey();
        hadTypoInWord.current = true;
        onIncorrectKey?.();
      }
    }

    prevCharIndex.current = currentCharIndex;
  }, [currentCharIndex, charStates, onCorrectKey, onIncorrectKey]);

  // Detect word completion via completedWords counter
  useEffect(() => {
    if (completedWords > prevCompletedWords.current) {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.onWordComplete(!hadTypoInWord.current);
      }
      hadTypoInWord.current = false;
      onWordComplete?.();
    }
    prevCompletedWords.current = completedWords;
  }, [completedWords, onWordComplete]);

  return (
    <div ref={containerRef} className="w-full rounded-xl bg-[var(--color-bg-surface)]">
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ borderRadius: "inherit" }}
      />
    </div>
  );
}
