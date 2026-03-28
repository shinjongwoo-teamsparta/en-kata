"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  useKeyboardSound,
  SOUND_PRESET_IDS,
} from "~/hooks/useKeyboardSound";

const themes = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "system", label: "System", icon: "💻" },
  { id: "dark", label: "Dark", icon: "🌙" },
] as const;

const locales = [
  { id: "en" as const, label: "EN" },
  { id: "ko" as const, label: "한국어" },
];

export function SettingsModal() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: session } = useSession();
  const {
    enabled: soundEnabled,
    toggle: toggleSound,
    preset: soundPreset,
    setPreset: setSoundPreset,
  } = useKeyboardSound();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [showKorean, setShowKorean] = useState(false);
  const [backspaceLock, setBackspaceLock] = useState(false);
  useEffect(() => {
    setMounted(true);
    setShowKorean(localStorage.getItem("showKorean") === "true");
    setBackspaceLock(localStorage.getItem("backspaceLock") === "true");
  }, []);

  const toggleKorean = useCallback(() => {
    setShowKorean((prev) => {
      const next = !prev;
      localStorage.setItem("showKorean", String(next));
      return next;
    });
  }, []);

  const toggleBackspaceLock = useCallback(() => {
    setBackspaceLock((prev) => {
      const next = !prev;
      localStorage.setItem("backspaceLock", String(next));
      return next;
    });
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

                {/* Show Korean */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs text-[var(--color-text-dim)]">
                      {t("showKorean")}
                    </label>
                    <p className="text-[10px] text-[var(--color-text-dim)] opacity-60">
                      {t("showKoreanDesc")}
                    </p>
                  </div>
                  <button
                    onClick={toggleKorean}
                    className={`shrink-0 relative h-6 w-10 rounded-full transition-colors ${
                      showKorean
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        showKorean ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Backspace Lock */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs text-[var(--color-text-dim)]">
                      {t("backspaceLock")}
                    </label>
                    <p className="text-[10px] text-[var(--color-text-dim)] opacity-60">
                      {t("backspaceLockDesc")}
                    </p>
                  </div>
                  <button
                    onClick={toggleBackspaceLock}
                    className={`shrink-0 relative h-6 w-10 rounded-full transition-colors ${
                      backspaceLock
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        backspaceLock ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Keyboard Sound */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs text-[var(--color-text-dim)]">
                      {t("keyboardSound")}
                    </label>
                    <p className="text-[10px] text-[var(--color-text-dim)] opacity-60">
                      {t("keyboardSoundDesc")}
                    </p>
                  </div>
                  <button
                    onClick={toggleSound}
                    className={`shrink-0 relative h-6 w-10 rounded-full transition-colors ${
                      soundEnabled
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-border)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        soundEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Preset */}
                {soundEnabled && (
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--color-text-dim)]">
                      {t("soundPreset")}
                    </label>
                    <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                      {SOUND_PRESET_IDS.map((id) => (
                        <button
                          key={id}
                          onClick={() => setSoundPreset(id)}
                          className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
                            soundPreset === id
                              ? "bg-[var(--color-bg-surface)] text-[var(--color-text-bright)]"
                              : "text-[var(--color-text-dim)]"
                          }`}
                        >
                          {t(`soundPresets.${id}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account */}
                <div className="border-t border-[var(--color-border)] pt-4">
                  {session?.user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {session.user.image && (
                          <img
                            src={session.user.image}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        <span className="text-xs text-[var(--color-text-bright)]">
                          {session.user.name}
                        </span>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)]"
                      >
                        {t("signOut")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => signIn("github")}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-hover)]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      {t("signInGithub")}
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
