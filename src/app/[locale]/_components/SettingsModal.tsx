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
import { THEMES, LOCALES } from "~/lib/constants";
import { GearIcon, GitHubIcon } from "~/lib/icons";

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
        <GearIcon />
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
                    {THEMES.map((th) => (
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
                    {LOCALES.map((l) => (
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
                      <GitHubIcon />
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
