"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "~/i18n/navigation";
import { useTypingGame } from "~/hooks/useTypingGame";
import { useKeyboardSound } from "~/hooks/useKeyboardSound";
import { useSession } from "next-auth/react";
import { incrementPlayCount } from "../../_components/SignupNudge";
import { useSettingsStore } from "~/stores/useSettingsStore";
import { useGameResultStore } from "~/stores/useGameResultStore";
import CanvasTypingArea from "./CanvasTypingArea";

export default function CanvasPlayClient() {
  const t = useTranslations("play");
  const router = useRouter();
  const getGameSettings = useSettingsStore((s) => s.getGameSettings);
  const effect = useSettingsStore((s) => s.effect);
  const settings = getGameSettings();

  const { playKeySound, playErrorSound, playCompleteSound } =
    useKeyboardSound();
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
              {settings.mode} · {settings.difficulty}
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

        {/* Canvas typing area */}
        <CanvasTypingArea
          text={currentTarget}
          currentCharIndex={game.currentCharIndex}
          charStates={game.charStates}
          completedWords={game.completedWords}
          mode={settings.mode}
          effect={effect}
        />

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
