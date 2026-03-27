"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NamingConvention } from "~/lib/types";

const themes = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "system", label: "System", icon: "💻" },
  { id: "dark", label: "Dark", icon: "🌙" },
] as const;

const locales = [
  { id: "en" as const, label: "EN" },
  { id: "ko" as const, label: "한국어" },
];

const CONVENTION_IDS: NamingConvention[] = [
  "camelCase",
  "snake_case",
  "kebab-case",
  "PascalCase",
];

export function SettingsModal() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [showHint, setShowHint] = useState(false);
  const [convention, setConvention] = useState<NamingConvention>("camelCase");

  useEffect(() => {
    setMounted(true);
    setShowHint(localStorage.getItem("showHint") === "true");
    const saved = localStorage.getItem("namingConvention") as NamingConvention | null;
    if (saved && CONVENTION_IDS.includes(saved)) setConvention(saved);
  }, []);

  const toggleHint = useCallback(() => {
    setShowHint((prev) => {
      const next = !prev;
      localStorage.setItem("showHint", String(next));
      return next;
    });
  }, []);

  const switchConvention = useCallback((next: NamingConvention) => {
    setConvention(next);
    localStorage.setItem("namingConvention", next);
  }, []);

  const switchLocale = (next: "en" | "ko") => {
    if (next !== selectedLocale) {
      setSelectedLocale(next);
      startTransition(() => {
        const qs = searchParams.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        router.replace(href, { locale: next });
      });
    }
  };

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text)]"
        title={t("title")}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-4 top-14 z-50 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-lg"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-bright)]">
                {t("title")}
              </h2>

              <div className="space-y-5">
                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-xs text-[var(--color-text-dim)]">
                    {t("theme")}
                  </label>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                    {themes.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setTheme(th.id)}
                        className={`flex-1 px-2.5 py-1.5 text-sm transition-colors ${
                          mounted && theme === th.id
                            ? "bg-[var(--color-bg-surface)] text-[var(--color-text-bright)]"
                            : "text-[var(--color-text-dim)]"
                        }`}
                      >
                        {th.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locale */}
                <div className="space-y-2">
                  <label className="text-xs text-[var(--color-text-dim)]">
                    {t("language")}
                  </label>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                    {locales.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => switchLocale(l.id)}
                        className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                          selectedLocale === l.id
                            ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                            : "text-[var(--color-text-dim)]"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show Hint */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs text-[var(--color-text-dim)]">
                      {t("showHint")}
                    </label>
                    <p className="text-[10px] text-[var(--color-text-dim)] opacity-60">
                      {t("showHintDesc")}
                    </p>
                  </div>
                  <button
                    onClick={toggleHint}
                    className={`relative h-6 w-10 rounded-full transition-colors ${
                      showHint
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        showHint ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Variable Name Convention */}
                <div className="space-y-2">
                  <label className="text-xs text-[var(--color-text-dim)]">
                    {t("convention")}
                  </label>
                  <select
                    value={convention}
                    onChange={(e) => switchConvention(e.target.value as NamingConvention)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text-bright)] outline-none transition-colors focus:border-[var(--color-accent)]"
                  >
                    {CONVENTION_IDS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
