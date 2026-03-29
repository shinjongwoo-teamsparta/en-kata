"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import type { GameMode, Difficulty } from "~/lib/types";

const MODES: GameMode[] = ["word", "phrase", "code", "variableName"];
const DIFFICULTIES: (Difficulty | "all")[] = ["all", "easy", "medium", "hard"];
const DURATIONS: (number | "all")[] = ["all", 30, 60, 120];
const PERIODS = ["all", "month", "week"] as const;

function formatDate(date: Date | string) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const ct = useTranslations("common");
  const router = useRouter();
  const { data: session } = useSession();

  const [mode, setMode] = useState<GameMode>("word");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [duration, setDuration] = useState<number | "all">("all");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("all");

  const { data: leaderboard, isLoading } =
    api.gameResult.getLeaderboard.useQuery({
      mode,
      difficulty: difficulty === "all" ? undefined : difficulty,
      duration: duration === "all" ? undefined : duration,
      period,
      limit: 20,
    });

  return (
    <motion.main
      className="flex min-h-screen flex-col items-center justify-start px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-bright)]">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-dim)]">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            &larr; {t("goHome")}
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Mode */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                }`}
              >
                {t(`modes.${m}`)}
              </button>
            ))}
          </div>

          {/* Difficulty + Duration + Period */}
          <div className="flex gap-2">
            {/* Difficulty */}
            <div className="flex flex-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {t(`difficulties.${d}`)}
                </button>
              ))}
            </div>

            {/* Duration */}
            <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    duration === d
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {t(`durations.${String(d)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-dim)]"
                }`}
              >
                {t(`periods.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-xl bg-[var(--color-bg-surface)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_1fr_4.5rem_4.5rem_4rem] gap-2 border-b border-[var(--color-border)] px-4 py-3 text-xs font-medium text-[var(--color-text-dim)]">
            <span>{t("rank")}</span>
            <span>{t("player")}</span>
            <span className="text-right">{t("wpm")}</span>
            <span className="text-right">{t("accuracy")}</span>
            <span className="text-right">{t("date")}</span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-dim)]">
              {ct("loading")}
            </div>
          )}

          {/* Empty */}
          {!isLoading && leaderboard?.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-dim)]">
              {t("empty")}
            </div>
          )}

          {/* Rows */}
          {leaderboard?.map((entry, i) => {
            const isCurrentUser =
              session?.user && entry.userId === (session.user as { id?: string }).id;
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`grid grid-cols-[3rem_1fr_4.5rem_4.5rem_4rem] gap-2 px-4 py-3 text-sm ${
                  isCurrentUser
                    ? "bg-[var(--color-primary)]/10"
                    : i % 2 === 0
                      ? ""
                      : "bg-[var(--color-bg)]/30"
                } ${i < (leaderboard?.length ?? 0) - 1 ? "border-b border-[var(--color-border)]/50" : ""}`}
              >
                {/* Rank */}
                <span
                  className={`font-bold ${
                    entry.rank === 1
                      ? "text-yellow-500"
                      : entry.rank === 2
                        ? "text-gray-400"
                        : entry.rank === 3
                          ? "text-amber-600"
                          : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {entry.rank === 1
                    ? "1st"
                    : entry.rank === 2
                      ? "2nd"
                      : entry.rank === 3
                        ? "3rd"
                        : entry.rank}
                </span>

                {/* Player */}
                <div className="flex items-center gap-2 overflow-hidden">
                  {entry.userImage && (
                    <img
                      src={entry.userImage}
                      alt=""
                      className="h-5 w-5 shrink-0 rounded-full"
                    />
                  )}
                  <span
                    className={`truncate ${
                      isCurrentUser
                        ? "font-semibold text-[var(--color-primary)]"
                        : "text-[var(--color-text-bright)]"
                    }`}
                  >
                    {entry.userName}
                    {isCurrentUser && (
                      <span className="ml-1 text-xs text-[var(--color-primary)]">
                        ({t("you")})
                      </span>
                    )}
                  </span>
                </div>

                {/* WPM */}
                <span className="text-right font-bold text-[var(--color-primary)]">
                  {entry.wpm}
                </span>

                {/* Accuracy */}
                <span className="text-right text-[var(--color-text-dim)]">
                  {entry.accuracy.toFixed(1)}%
                </span>

                {/* Date */}
                <span className="text-right text-xs text-[var(--color-text-dim)]">
                  {formatDate(entry.createdAt)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.main>
  );
}
