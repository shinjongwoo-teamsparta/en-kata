"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import type { GameResult } from "~/lib/types";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const result = useMemo<GameResult | null>(() => {
    const data = searchParams.get("data");
    if (!data) return null;
    try {
      return JSON.parse(decodeURIComponent(data)) as GameResult;
    } catch {
      return null;
    }
  }, [searchParams]);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-dim)]">No result data found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[var(--color-primary)] hover:underline"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  // Top 5 mistakes
  const topMistakes = Object.entries(result.mistakeMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const statCards = [
    {
      label: "WPM",
      value: result.wpm,
      color: "var(--color-primary)",
      large: true,
    },
    {
      label: "CPM",
      value: result.cpm,
      color: "var(--color-accent)",
      large: false,
    },
    {
      label: "Accuracy",
      value: `${result.accuracy}%`,
      color:
        result.accuracy >= 95
          ? "var(--color-correct)"
          : result.accuracy >= 80
            ? "var(--color-warning)"
            : "var(--color-incorrect)",
      large: false,
    },
    {
      label: "Words",
      value: result.completedWords,
      color: "var(--color-text)",
      large: false,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-bright)]">
            Result
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            {result.mode}
            {result.convention ? ` · ${result.convention}` : ""} ·{" "}
            {result.difficulty} · {result.duration}s
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl bg-[var(--color-bg-surface)] p-5 text-center ${
                s.large ? "col-span-1" : ""
              }`}
            >
              <div
                className={`font-bold ${s.large ? "text-4xl" : "text-2xl"}`}
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-dim)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* WPM Timeline */}
        {result.wpmTimeline.length > 1 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5">
            <h2 className="mb-3 text-sm text-[var(--color-text-dim)]">
              WPM over time
            </h2>
            <div className="flex h-32 items-end gap-px">
              {result.wpmTimeline.map((point, i) => {
                const maxWpm = Math.max(
                  ...result.wpmTimeline.map((p) => p.wpm),
                  1,
                );
                const height = (point.wpm / maxWpm) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-[var(--color-primary)] opacity-70 transition-all hover:opacity-100"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.second}s: ${point.wpm} WPM`}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--color-text-dim)]">
              <span>0s</span>
              <span>{result.duration}s</span>
            </div>
          </div>
        )}

        {/* Top Mistakes */}
        {topMistakes.length > 0 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5">
            <h2 className="mb-3 text-sm text-[var(--color-text-dim)]">
              Most missed characters
            </h2>
            <div className="flex gap-3">
              {topMistakes.map(([char, count]) => (
                <div
                  key={char}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  <span className="text-lg font-bold text-[var(--color-incorrect)]">
                    {char === " " ? "␣" : char}
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)]">
                    ×{count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              const params = new URLSearchParams({
                mode: result.mode,
                duration: result.duration.toString(),
                difficulty: result.difficulty,
              });
              if (result.convention)
                params.set("convention", result.convention);
              router.push(`/play?${params.toString()}`);
            }}
            className="flex-1 rounded-lg bg-[var(--color-primary)] py-3 font-bold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg border border-[var(--color-border)] py-3 font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            Change Settings
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <span className="text-[var(--color-text-dim)]">Loading...</span>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
