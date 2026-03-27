"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useTypingGame } from "~/hooks/useTypingGame";
import type {
  Difficulty,
  GameMode,
  GameSettings,
  NamingConvention,
  WordCategory,
} from "~/lib/types";

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const settings = useMemo<GameSettings>(() => ({
    mode: (searchParams.get("mode") as GameMode) ?? "word",
    duration: Number(searchParams.get("duration") ?? "60"),
    difficulty: (searchParams.get("difficulty") as Difficulty) ?? "medium",
    convention: (searchParams.get("convention") as NamingConvention) ?? undefined,
    category: (searchParams.get("category") as WordCategory) ?? undefined,
  }), [searchParams]);

  const game = useTypingGame(settings);

  // Auto-start on mount
  useEffect(() => {
    if (game.status === "idle") {
      game.start();
    }
  }, [game.status, game.start]);

  // Navigate to result when finished
  useEffect(() => {
    if (game.status === "finished" && game.result) {
      const encoded = encodeURIComponent(JSON.stringify(game.result));
      router.push(`/result?data=${encoded}`);
    }
  }, [game.status, game.result, router]);

  const currentTarget = game.currentWord?.target ?? "";
  const displayText = game.currentWord?.display ?? "";
  const isNaming = settings.mode === "naming";

  // Get upcoming words for preview
  const upcomingWords = game.words
    .slice(game.currentWordIndex + 1, game.currentWordIndex + 8)
    .map((w) => w.target);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Top bar: timer, WPM, mode */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-[var(--color-text-dim)]">
              {settings.mode}
              {settings.convention ? ` · ${settings.convention}` : ""}
              {settings.category ? ` · ${settings.category}` : ""}
            </span>
            <span className="text-[var(--color-text-dim)]">
              {settings.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[var(--color-primary)] text-lg font-bold">
              {game.wpm} <span className="text-xs font-normal">WPM</span>
            </span>
            <span
              className={`text-lg font-bold ${
                game.timeLeft <= 10
                  ? "text-[var(--color-incorrect)]"
                  : "text-[var(--color-text-bright)]"
              }`}
            >
              {formatTime(game.timeLeft)}
            </span>
          </div>
        </div>

        {/* Naming mode: show the phrase */}
        {isNaming && displayText !== currentTarget && (
          <div className="text-center">
            <span className="text-lg text-[var(--color-accent)]">
              {displayText}
            </span>
          </div>
        )}

        {/* Typing area */}
        <div className="rounded-xl bg-[var(--color-bg-surface)] p-8">
          {/* Current word */}
          <div className="flex flex-wrap items-center justify-center gap-0 text-3xl leading-relaxed">
            {currentTarget.split("").map((char, i) => {
              let colorClass = "text-[var(--color-text-dim)]";
              if (i < game.currentCharIndex) {
                colorClass =
                  game.charStates[i] === "correct"
                    ? "text-[var(--color-correct)]"
                    : "text-[var(--color-incorrect)]";
              }
              const isCursor = i === game.currentCharIndex;

              return (
                <span
                  key={i}
                  className={`relative inline-block ${colorClass} ${
                    isCursor
                      ? "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:animate-pulse after:bg-[var(--color-cursor)]"
                      : ""
                  }`}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </div>

          {/* Upcoming words */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-lg text-[var(--color-text-dim)] opacity-40">
            {upcomingWords.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-[var(--color-text-dim)]">
          <span>{game.completedWords} words completed</span>
          <button
            onClick={() => router.push("/")}
            className="text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            esc to quit
          </button>
        </div>
      </div>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <span className="text-[var(--color-text-dim)]">Loading...</span>
        </main>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
