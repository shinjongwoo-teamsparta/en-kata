"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { motion } from "framer-motion";

const MODE_LABELS: Record<string, string> = {
  word: "Word",
  phrase: "Phrase",
  shortCode: "Short Code",
  variableName: "Variable Name",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function StatsPage() {
  const t = useTranslations("stats");
  const ct = useTranslations("common");
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const { data: stats, isLoading } = api.gameResult.getStats.useQuery(
    undefined,
    { enabled: !!session?.user },
  );

  if (authStatus === "loading" || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-[var(--color-text-dim)]">{ct("loading")}</span>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-text-dim)]">{t("loginRequired")}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[var(--color-primary)] hover:underline"
          >
            {t("goHome")}
          </button>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  // Build daily WPM data from recentResults
  const dailyMap = new Map<string, { totalWpm: number; count: number }>();
  for (const r of stats.recentResults) {
    const key = formatDate(r.createdAt);
    const entry = dailyMap.get(key) ?? { totalWpm: 0, count: 0 };
    entry.totalWpm += r.wpm;
    entry.count += 1;
    dailyMap.set(key, entry);
  }
  const dailyWpm = Array.from(dailyMap.entries()).map(([date, { totalWpm, count }]) => ({
    date,
    avgWpm: Math.round(totalWpm / count),
  }));

  return (
    <motion.main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-bright)]">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-dim)]">
              {session.user.name}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            ← {t("goHome")}
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5 text-center">
            <div className="text-3xl font-bold text-[var(--color-primary)]">
              {stats.overall.bestWpm}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-dim)]">
              {t("bestWpm")}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5 text-center">
            <div className="text-3xl font-bold text-[var(--color-accent)]">
              {stats.overall.avgWpm}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-dim)]">
              {t("avgWpm")}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5 text-center">
            <div className="text-3xl font-bold text-[var(--color-correct)]">
              {stats.overall.avgAccuracy}%
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-dim)]">
              {t("avgAccuracy")}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5 text-center">
            <div className="text-3xl font-bold text-[var(--color-text-bright)]">
              {stats.overall.totalGames}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-dim)]">
              {t("totalGames")}
            </div>
          </div>
        </div>

        {/* Best WPM per Mode */}
        {stats.bestByMode.length > 0 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5">
            <h2 className="mb-3 text-sm text-[var(--color-text-dim)]">
              {t("bestByMode")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.bestByMode.map((item) => (
                <div
                  key={item.mode}
                  className="rounded-lg border border-[var(--color-border)] p-3 text-center"
                >
                  <div className="text-xs text-[var(--color-text-dim)]">
                    {MODE_LABELS[item.mode] ?? item.mode}
                  </div>
                  <div className="mt-1 text-xl font-bold text-[var(--color-primary)]">
                    {item._max.wpm ?? 0}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-dim)]">
                    {item._count} {t("games")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily WPM Trend */}
        {dailyWpm.length > 1 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5">
            <h2 className="mb-3 text-sm text-[var(--color-text-dim)]">
              {t("wpmTrend")}
            </h2>
            <div className="flex h-40 items-end gap-1">
              {dailyWpm.map((day, i) => {
                const maxWpm = Math.max(...dailyWpm.map((d) => d.avgWpm), 1);
                const height = (day.avgWpm / maxWpm) * 100;
                return (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-[10px] text-[var(--color-text-dim)]">
                      {day.avgWpm}
                    </span>
                    <div
                      className="w-full rounded-t bg-[var(--color-primary)] opacity-70 transition-all hover:opacity-100"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${day.date}: ${day.avgWpm} WPM`}
                    />
                    <span className="text-[10px] text-[var(--color-text-dim)]">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Games */}
        {stats.recentResults.length > 0 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-5">
            <h2 className="mb-3 text-sm text-[var(--color-text-dim)]">
              {t("recentGames")}
            </h2>
            <div className="space-y-2">
              {stats.recentResults.slice(-10).reverse().map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-text-dim)]">
                      {MODE_LABELS[r.mode] ?? r.mode}
                    </span>
                    <span className="font-bold text-[var(--color-primary)]">
                      {r.wpm} WPM
                    </span>
                    <span className="text-[var(--color-text-dim)]">
                      {r.accuracy}%
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-dim)]">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.recentResults.length === 0 && (
          <div className="rounded-xl bg-[var(--color-bg-surface)] p-8 text-center">
            <p className="text-[var(--color-text-dim)]">{t("noData")}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
            >
              {t("startPlaying")}
            </button>
          </div>
        )}
      </div>
    </motion.main>
  );
}
