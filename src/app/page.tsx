"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  Difficulty,
  GameMode,
  NamingConvention,
  WordCategory,
} from "~/lib/types";

const MODES: { id: GameMode; label: string; desc: string; icon: string }[] = [
  {
    id: "word",
    label: "Word",
    desc: "SW engineering vocabulary",
    icon: "Aa",
  },
  {
    id: "symbol",
    label: "Symbol",
    desc: "Code symbols & operators",
    icon: "{}",
  },
  {
    id: "naming",
    label: "Naming",
    desc: "camelCase, snake_case, kebab-case",
    icon: "xY",
  },
];

const DURATIONS = [30, 60, 120];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CONVENTIONS: { id: NamingConvention; label: string }[] = [
  { id: "camelCase", label: "camelCase" },
  { id: "snake_case", label: "snake_case" },
  { id: "kebab-case", label: "kebab-case" },
];
const CATEGORIES: { id: WordCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "devops", label: "DevOps" },
  { id: "database", label: "Database" },
];

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>("word");
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [convention, setConvention] = useState<NamingConvention>("camelCase");
  const [category, setCategory] = useState<WordCategory>("general");

  const handleStart = () => {
    const params = new URLSearchParams({
      mode,
      duration: duration.toString(),
      difficulty,
    });
    if (mode === "naming") params.set("convention", convention);
    if (mode === "word") params.set("category", category);
    router.push(`/play?${params.toString()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-10">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--color-text-bright)]">
            en-kata
          </h1>
          <p className="mt-2 text-[var(--color-text-dim)]">
            typing practice for software engineers
          </p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm text-[var(--color-text-dim)]">mode</label>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  mode === m.id
                    ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <div
                  className={`text-xl font-bold ${
                    mode === m.id
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {m.icon}
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--color-text-bright)]">
                  {m.label}
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-text-dim)]">
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <label className="text-sm text-[var(--color-text-dim)]">
            duration
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
            difficulty
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
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Category (Word mode only) */}
        {mode === "word" && (
          <div className="space-y-3">
            <label className="text-sm text-[var(--color-text-dim)]">
              category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    category === c.id
                      ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Convention (Naming mode only) */}
        {mode === "naming" && (
          <div className="space-y-3">
            <label className="text-sm text-[var(--color-text-dim)]">
              convention
            </label>
            <div className="flex gap-3">
              {CONVENTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConvention(c.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    convention === c.id
                      ? "border-[var(--color-accent)] bg-[var(--color-bg-surface)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)]"
                  }`}
                >
                  {c.label}
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
          Start Typing
        </button>
      </div>
    </main>
  );
}
