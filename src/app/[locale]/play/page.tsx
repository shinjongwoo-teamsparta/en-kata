"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "~/i18n/navigation";
import { useTypingGame } from "~/hooks/useTypingGame";
import type {
  Difficulty,
  GameMode,
  GameSettings,
  NamingConvention,
  WordCategory,
} from "~/lib/types";

function PlayContent() {
  const t = useTranslations("play");
  const router = useRouter();
  const searchParams = useSearchParams();

  const settings = useMemo<GameSettings>(
    () => ({
      mode: (searchParams.get("mode") as GameMode) ?? "word",
      duration: Number(searchParams.get("duration") ?? "60"),
      difficulty: (searchParams.get("difficulty") as Difficulty) ?? "medium",
      convention:
        (searchParams.get("convention") as NamingConvention) ?? undefined,
      category: (searchParams.get("category") as WordCategory) ?? undefined,
    }),
    [searchParams],
  );

  const game = useTypingGame(settings);

  // Auto-start on mount
  useEffect(() => {
    if (game.status === "idle") {
      game.start();
    }
  }, [game.status, game.start]);

  // ESC to quit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

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
    <motion.main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
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
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {game.wpm}{" "}
              <span className="text-xs font-normal">{t("wpm")}</span>
            </span>
            <motion.span
              className={`text-lg font-bold ${
                game.timeLeft <= 10
                  ? "text-[var(--color-incorrect)]"
                  : "text-[var(--color-text-bright)]"
              }`}
              animate={
                game.timeLeft <= 10
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={
                game.timeLeft <= 10
                  ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }
                  : { duration: 0.2 }
              }
            >
              {formatTime(game.timeLeft)}
            </motion.span>
          </div>
        </div>

        {/* Naming mode: show the phrase */}
        <AnimatePresence>
          {isNaming && displayText !== currentTarget && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-lg text-[var(--color-accent)]">
                {displayText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing area */}
        <div className="rounded-xl bg-[var(--color-bg-surface)] p-8">
          {/* Current word */}
          <AnimatePresence mode="wait">
            <motion.div
              key={game.currentWordIndex}
              className="flex flex-wrap items-center justify-center gap-0 text-3xl leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          </AnimatePresence>

          {/* Upcoming words */}
          <AnimatePresence mode="wait">
            <motion.div
              key={game.currentWordIndex}
              className="mt-6 flex flex-wrap justify-center gap-3 text-lg text-[var(--color-text-dim)] opacity-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {upcomingWords.map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  {w}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-[var(--color-text-dim)]">
          <span>{t("wordsCompleted", { count: game.completedWords })}</span>
          <button
            onClick={() => router.push("/")}
            className="text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            {t("escToQuit")}
          </button>
        </div>
      </div>
    </motion.main>
  );
}

export default function PlayPage() {
  const t = useTranslations("play");
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <span className="text-[var(--color-text-dim)]">{t("loading")}</span>
        </main>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
