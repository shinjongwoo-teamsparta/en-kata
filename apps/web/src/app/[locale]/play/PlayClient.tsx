"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "~/i18n/navigation";
import { useTypingGame } from "~/hooks/useTypingGame";
import { useKeyboardSound } from "~/hooks/useKeyboardSound";
import { useSession } from "next-auth/react";
import { incrementPlayCount } from "../_components/SignupNudge";
import { useSettingsStore } from "~/stores/useSettingsStore";
import { useGameResultStore } from "~/stores/useGameResultStore";

export default function PlayClient() {
  const t = useTranslations("play");
  const router = useRouter();
  const getGameSettings = useSettingsStore((s) => s.getGameSettings);
  const settings = getGameSettings();

  const { playKeySound, playErrorSound, playCompleteSound } = useKeyboardSound();
  const game = useTypingGame(settings, {
    onCorrectKey: playKeySound,
    onIncorrectKey: playErrorSound,
    onWordComplete: playCompleteSound,
  });

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
  const { data: session } = useSession();
  const setGameResult = useGameResultStore((s) => s.setResult);
  useEffect(() => {
    if (game.status === "finished" && game.result) {
      if (!session?.user) {
        incrementPlayCount();
      }
      setGameResult(game.result);
      router.push("/result");
    }
  }, [game.status, game.result, router, session, setGameResult]);

  const currentTarget = game.currentWord?.target ?? "";

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
              className={`text-lg font-bold ${game.timeLeft <= 10
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


        {/* Korean translation */}
        {settings.showKorean && game.currentWord?.korean && (
          <div className="rounded-lg bg-[var(--color-bg-surface)] px-5 py-3 text-center">
            <p className="text-sm text-[var(--color-text)]">
              {game.currentWord?.korean}
            </p>
          </div>
        )}

        {/* Typing area */}
        <div className="rounded-xl bg-[var(--color-bg-surface)] p-8">
          {/* Current word */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={game.currentWordIndex}
              className="flex flex-wrap items-center justify-center gap-0 text-3xl leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {(() => {
                const words: { char: string; idx: number }[][] = [];
                let current: { char: string; idx: number }[] = [];
                currentTarget.split("").forEach((char, i) => {
                  if (char === " " && current.length > 0) {
                    current.push({ char, idx: i });
                    words.push(current);
                    current = [];
                  } else {
                    current.push({ char, idx: i });
                  }
                });
                if (current.length > 0) words.push(current);

                return words.map((word, wi) => (
                  <span key={wi} className="inline-flex whitespace-nowrap">
                    {word.map(({ char, idx }) => {
                      let colorClass = "text-[var(--color-text-dim)]";
                      let bgClass = "";
                      if (idx < game.currentCharIndex) {
                        const isCorrect = game.charStates[idx] === "correct";
                        colorClass = isCorrect
                          ? "text-[var(--color-correct)]"
                          : "text-[var(--color-incorrect)]";
                        if (char === " " && !isCorrect) {
                          bgClass = "bg-[var(--color-incorrect)]/30 rounded-sm";
                        }
                      }
                      const isCursor = idx === game.currentCharIndex;
                      return (
                        <span
                          key={idx}
                          className={`relative inline-block ${colorClass} ${bgClass} ${isCursor
                              ? "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:animate-pulse after:bg-[var(--color-cursor)]"
                              : ""
                            }`}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      );
                    })}
                  </span>
                ));
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Upcoming words */}
          <AnimatePresence mode="popLayout">
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
