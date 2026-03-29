"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { GitHubIcon } from "~/lib/icons";

const PLAY_COUNT_KEY = "guestPlayCount";
const NUDGE_DISMISSED_KEY = "nudgeDismissedAt";

const SOFT_THRESHOLD = 3;
const MEDIUM_THRESHOLD = 5;
const STRONG_THRESHOLD = 10;

function getPlayCount(): number {
  try {
    return parseInt(localStorage.getItem(PLAY_COUNT_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementPlayCount(): void {
  try {
    const count = getPlayCount() + 1;
    localStorage.setItem(PLAY_COUNT_KEY, String(count));
  } catch {
    // localStorage unavailable
  }
}

type Tier = "soft" | "medium" | "strong" | null;

function getTier(count: number): Tier {
  if (count >= STRONG_THRESHOLD) return "strong";
  if (count >= MEDIUM_THRESHOLD) return "medium";
  if (count >= SOFT_THRESHOLD) return "soft";
  return null;
}

function wasDismissedRecently(): boolean {
  try {
    const dismissed = localStorage.getItem(NUDGE_DISMISSED_KEY);
    if (!dismissed) return false;
    const elapsed = Date.now() - parseInt(dismissed, 10);
    return elapsed < 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function SignInButton({ size }: { size: "sm" | "md" | "lg" }) {
  const t = useTranslations("result.signupNudge");
  const cls = {
    sm: "gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium",
    md: "gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold",
    lg: "gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-3 text-sm font-bold w-full",
  }[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => signIn("github")}
        className={`inline-flex items-center justify-center text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-hover)] ${cls}`}
      >
        <GitHubIcon width={size === "sm" ? 14 : 16} height={size === "sm" ? 14 : 16} />
        {t("signIn")}
      </button>
    </div>
  );
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-3 space-y-1.5 text-left">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-xs text-[var(--color-text)]">
          <span className="mt-px text-[var(--color-primary)]">&#10003;</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

export function SignupNudge() {
  const t = useTranslations("result.signupNudge");
  const [tier, setTier] = useState<Tier>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (wasDismissedRecently()) {
      setDismissed(true);
      return;
    }
    const count = getPlayCount();
    setTier(getTier(count));
  }, []);

  if (!tier || dismissed) return null;

  const count = getPlayCount();

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(NUDGE_DISMISSED_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable
    }
  };

  // Soft: card with title + description
  if (tier === "soft") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 text-center"
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-bright)]">
          {t("softTitle")}
        </h3>
        <p className="mt-1.5 text-xs text-[var(--color-text-dim)]">
          {t("softDesc")}
        </p>
        <div className="mt-4">
          <SignInButton size="sm" />
        </div>
      </motion.div>
    );
  }

  // Medium: card with title + description + feature list
  if (tier === "medium") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-surface)] p-5"
      >
        <h3 className="text-center text-sm font-bold text-[var(--color-text-bright)]">
          {t("mediumTitle", { count })}
        </h3>
        <p className="mt-1.5 text-center text-xs text-[var(--color-text-dim)]">
          {t("mediumDesc")}
        </p>
        <FeatureList
          features={[t("mediumFeature1"), t("mediumFeature2"), t("mediumFeature3")]}
        />
        <div className="mt-4 flex flex-col items-center gap-2">
          <SignInButton size="md" />
          <button
            onClick={handleDismiss}
            className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            {t("dismiss")}
          </button>
        </div>
      </motion.div>
    );
  }

  // Strong: modal overlay with feature list
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h3 className="text-center text-base font-bold text-[var(--color-text-bright)]">
            {t("strongTitle", { count })}
          </h3>
          <p className="mt-2 text-center text-xs text-[var(--color-text-dim)]">
            {t("strongDesc")}
          </p>
          <FeatureList
            features={[t("strongFeature1"), t("strongFeature2"), t("strongFeature3")]}
          />
          <div className="mt-5 flex flex-col items-center gap-2">
            <SignInButton size="lg" />
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              {t("dismiss")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
