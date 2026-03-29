"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { SignupNudge } from "../_components/SignupNudge";
import { useGameResultStore } from "~/stores/useGameResultStore";

function ResultContent() {
  const t = useTranslations("result");
  const router = useRouter();
  const result = useGameResultStore((s) => s.result);

  // Auto-save result for logged-in users
  const { data: session } = useSession();
  const saveResult = api.gameResult.save.useMutation();
  const hasSaved = useRef(false);

  useEffect(() => {
    if (result && session?.user && !hasSaved.current) {
      hasSaved.current = true;
      saveResult.mutate(result);
    }
  }, [result, session]);

  const navigateToRetry = useCallback(() => {
    if (!result) return;
    router.push("/play");
  }, [result, router]);

  // Enter to restart
  useEffect(() => {
    if (!result) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        navigateToRetry();
      } else if (e.key === "Escape") {
        router.push("/");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [result, navigateToRetry]);

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-dim)]">{t("noData")}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[var(--color-primary)] hover:underline"
          >
            {t("goBack")}
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
      label: t("stats.wpm"),
      value: result.wpm,
      color: "var(--color-primary)",
      large: true,
    },
    {
      label: t("stats.cpm"),
      value: result.cpm,
      color: "var(--color-accent)",
      large: false,
    },
    {
      label: t("stats.accuracy"),
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
      label: t("stats.words"),
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
            {t("title")}
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
              {t("wpmOverTime")}
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
              {t("mostMissed")}
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
            onClick={navigateToRetry}
            className="flex-1 rounded-lg bg-[var(--color-primary)] py-3 font-bold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {t("tryAgain")}
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-lg border border-[var(--color-border)] py-3 font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-hover)]"
          >
            {t("changeSettings")}
          </button>
        </div>

        {/* Enter hint */}
        <p className="text-center text-xs text-[var(--color-text-dim)]">
          {t("pressEnter")}
        </p>

        {/* Saved indicator / Stats link */}
        {session?.user && (
          <div className="text-center">
            {saveResult.isSuccess && (
              <span className="text-xs text-[var(--color-correct)]">
                {t("saved")}
              </span>
            )}
            <button
              onClick={() => router.push("/stats")}
              className="ml-3 text-xs text-[var(--color-primary)] hover:underline"
            >
              {t("viewStats")}
            </button>
          </div>
        )}

        {/* Signup nudge for non-logged-in users */}
        {!session?.user && <SignupNudge />}
      </div>
    </main>
  );
}

export default function ResultPage() {
  return <ResultContent />;
}
