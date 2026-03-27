"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import type {
  Difficulty,
  GameMode,
  WordCategory,
} from "~/lib/types";

const MODE_IDS: GameMode[] = ["word", "symbol", "variableName"];
const MODE_ICONS: Record<GameMode, string> = {
  word: "Aa",
  symbol: "{}",
  variableName: "xY",
};

const DURATIONS = [30, 60, 120];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CATEGORY_IDS: WordCategory[] = [
  "general",
  "frontend",
  "backend",
  "devops",
  "database",
];

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>("word");
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [category, setCategory] = useState<WordCategory>("general");
  const handleStart = () => {
    const params = new URLSearchParams({
      mode,
      duration: duration.toString(),
      difficulty,
    });
    if (mode === "variableName") {
      const convention = localStorage.getItem("namingConvention") ?? "camelCase";
      params.set("convention", convention);
    }
    if (mode === "word") params.set("category", category);
    const showHint = localStorage.getItem("showHint") === "true";
    if (mode === "word" && showHint) params.set("showHint", "true");
    router.push(`/play?${params.toString()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-10">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--color-text-bright)]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[var(--color-text-dim)]">{t("subtitle")}</p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm text-[var(--color-text-dim)]">
            {t("mode")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {MODE_IDS.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  mode === m
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <div
                  className={`text-xl font-bold ${
                    mode === m
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {MODE_ICONS[m]}
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--color-text-bright)]">
                  {t(`modes.${m}`)}
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-text-dim)]">
                  {t(`modes.${m}Desc`)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <label className="text-sm text-[var(--color-text-dim)]">
            {t("duration")}
          </label>
          <div className="flex gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all ${
                  duration === d
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <label className="text-sm text-[var(--color-text-dim)]">
            {t("difficulty")}
          </label>
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition-all ${
                  difficulty === d
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]"
                }`}
              >
                {t(`difficulties.${d}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Category (Word mode only) */}
        {mode === "word" && (
          <div className="space-y-3">
            <label className="text-sm text-[var(--color-text-dim)]">
              {t("category")}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_IDS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    category === c
                      ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]"
                  }`}
                >
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full rounded-lg bg-[var(--color-primary)] py-3.5 text-lg font-bold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          {t("start")}
        </button>
      </div>
    </main>
  );
}
