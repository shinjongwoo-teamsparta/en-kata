"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import codeData from "@en-kata/core/data/short-codes.json";
import type {
  Difficulty,
  GameMode,
  ShortCodeLanguage,
  WordCategory,
} from "~/lib/types";
import {
  MODE_IDS,
  MODE_ICONS,
  DURATIONS,
  DIFFICULTIES,
  CATEGORY_IDS,
  MODES_WITHOUT_DIFFICULTY,
} from "~/lib/constants";
import { LeaderboardIcon } from "~/lib/icons";
import { useSettingsStore } from "~/stores/useSettingsStore";

const LANGUAGE_IDS = Object.keys(codeData) as ShortCodeLanguage[];
const LANGUAGE_META = codeData as Record<string, { label: string; icon: string; codes: string[] }>;

type StepId = "mode" | "duration" | "difficulty" | "category" | "language";

function getSteps(mode: GameMode): StepId[] {
  const steps: StepId[] = ["mode"];
  if (mode === "word") {
    steps.push("category");
  }
  if (mode === "code") {
    steps.push("language");
  }
  if (!MODES_WITHOUT_DIFFICULTY.has(mode)) {
    steps.push("difficulty");
  }
  steps.push("duration");
  return steps;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function HomePage() {
  const t = useTranslations("home");
  const router = useRouter();

  const store = useSettingsStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [focusIndex, setFocusIndex] = useState(0);

  const steps = useMemo(() => getSteps(store.mode), [store.mode]);
  const currentStep = steps[stepIndex] ?? "mode";
  const isLastStep = stepIndex === steps.length - 1;

  const goNext = useCallback(() => {
    if (!isLastStep) {
      setDirection(1);
      setStepIndex((i) => i + 1);
    }
  }, [isLastStep]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const selectMode = (m: GameMode) => {
    store.setMode(m);
    store.restoreModePrefs(m);
    setDirection(1);
    setStepIndex(1);
  };

  const selectDuration = (d: number) => {
    store.setDuration(d);
    if (isLastStep) {
      handleStart(d);
    } else {
      goNext();
    }
  };

  const selectDifficulty = (d: Difficulty) => {
    store.setDifficulty(d);
    goNext();
  };

  const selectCategory = (c: WordCategory) => {
    store.setCategory(c);
    goNext();
  };

  const selectLanguage = (l: ShortCodeLanguage) => {
    store.setLanguage(l);
    goNext();
  };

  const handleStart = (overrideDuration?: number) => {
    if (overrideDuration != null) {
      store.setDuration(overrideDuration);
    }
    store.saveModePrefs();
    router.push("/play");
  };

  // Options count for the current step
  const currentOptions = useMemo(() => {
    switch (currentStep) {
      case "mode":
        return MODE_IDS;
      case "duration":
        return DURATIONS;
      case "difficulty":
        return DIFFICULTIES;
      case "category":
        return CATEGORY_IDS;
      case "language":
        return LANGUAGE_IDS;
      default:
        return [];
    }
  }, [currentStep]);

  // Reset focus index when step changes, default to currently selected value
  useEffect(() => {
    let idx = 0;
    switch (currentStep) {
      case "mode":
        idx = MODE_IDS.indexOf(store.mode);
        break;
      case "duration":
        idx = DURATIONS.indexOf(store.duration);
        break;
      case "difficulty":
        idx = DIFFICULTIES.indexOf(store.difficulty);
        break;
      case "category":
        idx = CATEGORY_IDS.indexOf(store.category);
        break;
      case "language":
        idx = LANGUAGE_IDS.indexOf(store.language);
        break;
    }
    setFocusIndex(idx >= 0 ? idx : 0);
  }, [currentStep, store.mode, store.duration, store.difficulty, store.category, store.language]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key == "h") {
        e.preventDefault();
        setFocusIndex((i) => (i > 0 ? i - 1 : currentOptions.length - 1));
      } else if (e.key === "ArrowRight" || e.key == "l") {
        e.preventDefault();
        setFocusIndex((i) => (i < currentOptions.length - 1 ? i + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        switch (currentStep) {
          case "mode":
            selectMode(MODE_IDS[focusIndex] ?? "word");
            break;
          case "duration": {
            const selectedDuration = DURATIONS[focusIndex] ?? 60;
            store.setDuration(selectedDuration);
            if (isLastStep) {
              handleStart(selectedDuration);
            } else {
              goNext();
            }
          }
            break;
          case "difficulty":
            selectDifficulty(DIFFICULTIES[focusIndex] ?? "medium");
            break;
          case "category":
            selectCategory(CATEGORY_IDS[focusIndex] ?? "general");
            break;
          case "language":
            selectLanguage(LANGUAGE_IDS[focusIndex] ?? "typescript");
            break;
        }
      } else if (e.key === "Backspace" || e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentOptions, currentStep, focusIndex, isLastStep, goBack]);

  // Summary line showing current selections
  const summaryParts: string[] = [];
  if (stepIndex > 0) summaryParts.push(t(`modes.${store.mode}`));
  if (stepIndex > 1) summaryParts.push(`${store.duration}s`);
  if (
    stepIndex > 2 &&
    steps.includes("difficulty") &&
    steps.indexOf("difficulty") < stepIndex
  ) {
    summaryParts.push(t(`difficulties.${store.difficulty}`));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--color-text-bright)]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[var(--color-text-dim)]">{t("subtitle")}</p>
          <button
            onClick={() => router.push("/leaderboard")}
            className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
          >
            <LeaderboardIcon />
            Leaderboard
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex
                  ? "w-8 bg-[var(--color-primary)]"
                  : i < stepIndex
                    ? "w-4 bg-[var(--color-primary)] opacity-40"
                    : "w-4 bg-[var(--color-border)]"
                }`}
            />
          ))}
        </div>

        {/* Summary breadcrumb */}
        {summaryParts.length > 0 && (
          <div className="mb-6 text-center">
            <span className="text-sm text-[var(--color-text-dim)]">
              {summaryParts.join(" · ")}
            </span>
          </div>
        )}

        {/* Step content */}
        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* Step label */}
              <label className="block text-center text-sm font-medium text-[var(--color-text-dim)]">
                {t(currentStep === "mode" ? "mode" : currentStep)}
              </label>

              {/* Mode step */}
              {currentStep === "mode" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {MODE_IDS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => selectMode(m)}
                      className={`rounded-lg border p-4 text-left transition-all ${focusIndex === i
                          ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                        }`}
                    >
                      <div
                        className={`text-xl font-bold ${focusIndex === i
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
              )}

              {/* Duration step */}
              {currentStep === "duration" && (
                <div className="flex justify-center gap-4">
                  {DURATIONS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => selectDuration(d)}
                      className={`rounded-lg border px-8 py-4 text-lg font-bold transition-all ${focusIndex === i
                          ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                        }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              )}

              {/* Difficulty step */}
              {currentStep === "difficulty" && (
                <div className="flex justify-center gap-4">
                  {DIFFICULTIES.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => selectDifficulty(d)}
                      className={`rounded-lg border px-8 py-4 text-lg font-medium transition-all ${focusIndex === i
                          ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                        }`}
                    >
                      {t(`difficulties.${d}`)}
                    </button>
                  ))}
                </div>
              )}

              {/* Category step */}
              {currentStep === "category" && (
                <div className="flex flex-wrap justify-center gap-3">
                  {CATEGORY_IDS.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => selectCategory(c)}
                      className={`rounded-lg border px-6 py-3 text-sm font-medium transition-all ${focusIndex === i
                          ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                        }`}
                    >
                      {t(`categories.${c}`)}
                    </button>
                  ))}
                </div>
              )}

              {/* Language step */}
              {currentStep === "language" && (
                <div className="flex flex-wrap justify-center gap-3">
                  {LANGUAGE_IDS.map((l, i) => (
                    <button
                      key={l}
                      onClick={() => selectLanguage(l)}
                      className={`flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-medium transition-all ${focusIndex === i
                          ? "border-[var(--color-primary)] bg-[var(--color-bg-surface)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)]"
                        }`}
                    >
                      {LANGUAGE_META[l]?.icon && (
                        <Image src={LANGUAGE_META[l].icon} alt={LANGUAGE_META[l].label} width={20} height={20} />
                      )}
                      {LANGUAGE_META[l]?.label ?? l}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={goBack}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium text-[var(--color-text-dim)] transition-all hover:text-[var(--color-text-bright)] ${stepIndex === 0 ? "invisible" : ""
              }`}
          >
            ← {t("back")}
          </button>

          {isLastStep ? (
            <button
              onClick={() => handleStart()}
              className="rounded-lg bg-[var(--color-primary)] px-10 py-3 text-lg font-bold text-[var(--color-bg)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {t("start")}
            </button>
          ) : (
            // Spacer to keep layout balanced when no start button
            <div />
          )}
        </div>
      </div>
    </main>
  );
}
