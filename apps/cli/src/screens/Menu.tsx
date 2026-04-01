import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type {
  GameMode,
  GameSettings,
  Difficulty,
  ShortCodeLanguage,
} from "@en-kata/core";
import {
  MODE_IDS,
  MODE_ICONS,
  DURATIONS,
  DIFFICULTIES,
  LANGUAGE_IDS,
  MODES_WITHOUT_DIFFICULTY,
} from "@en-kata/core";
import { useUpdateCheck } from "../hooks/useUpdateCheck.js";

type Step = "mode" | "sub" | "difficulty" | "duration";

function getSubLabel(mode: GameMode): string | null {
  switch (mode) {
    case "code":
      return "Language";
    default:
      return null;
  }
}

function getSubOptions(mode: GameMode): string[] {
  switch (mode) {
    case "code":
      return [...LANGUAGE_IDS];
    default:
      return [];
  }
}

interface MenuProps {
  onStart: (settings: GameSettings) => void;
}

export function Menu({ onStart }: MenuProps) {
  const { exit } = useApp();
  const update = useUpdateCheck();
  const [mode, setMode] = useState<GameMode>("word");
  const [subIndex, setSubIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [durationIndex, setDurationIndex] = useState(1); // 60s
  const [step, setStep] = useState<Step>("mode");
  const [cursor, setCursor] = useState(0);

  const hasSub = getSubLabel(mode) !== null;
  const hasDifficulty = !MODES_WITHOUT_DIFFICULTY.has(mode);

  function getCurrentOptions(): string[] {
    switch (step) {
      case "mode":
        return MODE_IDS.map((m) => `${MODE_ICONS[m]} ${m}`);
      case "sub":
        return getSubOptions(mode);
      case "difficulty":
        return [...DIFFICULTIES];
      case "duration":
        return DURATIONS.map((d) => `${d}s`);
    }
  }

  function getStepLabel(): string {
    switch (step) {
      case "mode":
        return "Mode";
      case "sub":
        return getSubLabel(mode) ?? "";
      case "difficulty":
        return "Difficulty";
      case "duration":
        return "Duration";
    }
  }

  function startGame(durIdx: number) {
    const subOptions = getSubOptions(mode);
    const settings: GameSettings = {
      mode,
      difficulty,
      duration: DURATIONS[durIdx] ?? 60,
      language: mode === "code" ? (subOptions[subIndex] as ShortCodeLanguage) : undefined,
    };
    onStart(settings);
  }

  function nextStep(overrideMode?: GameMode) {
    const m = overrideMode ?? mode;
    const sub = getSubLabel(m) !== null;
    const diff = !MODES_WITHOUT_DIFFICULTY.has(m);

    if (step === "mode") {
      if (sub) {
        setStep("sub");
        setCursor(0);
      } else if (diff) {
        setStep("difficulty");
        setCursor(DIFFICULTIES.indexOf(difficulty));
      } else {
        setStep("duration");
        setCursor(durationIndex);
      }
    } else if (step === "sub") {
      if (diff) {
        setStep("difficulty");
        setCursor(DIFFICULTIES.indexOf(difficulty));
      } else {
        setStep("duration");
        setCursor(durationIndex);
      }
    } else if (step === "difficulty") {
      setStep("duration");
      setCursor(durationIndex);
    } else {
      // duration → start game (called with explicit duration to avoid stale state)
      startGame(durationIndex);
    }
  }

  function prevStep() {
    if (step === "duration") {
      if (hasDifficulty) {
        setStep("difficulty");
        setCursor(DIFFICULTIES.indexOf(difficulty));
      } else if (hasSub) {
        setStep("sub");
        setCursor(subIndex);
      } else {
        setStep("mode");
        setCursor(MODE_IDS.indexOf(mode));
      }
    } else if (step === "difficulty") {
      if (hasSub) {
        setStep("sub");
        setCursor(subIndex);
      } else {
        setStep("mode");
        setCursor(MODE_IDS.indexOf(mode));
      }
    } else if (step === "sub") {
      setStep("mode");
      setCursor(MODE_IDS.indexOf(mode));
    }
  }

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    const options = getCurrentOptions();
    if (key.leftArrow || input === "h") {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.rightArrow || input === "l") {
      setCursor((c) => Math.min(options.length - 1, c + 1));
    } else if (key.return) {
      // Commit current selection
      if (step === "mode") {
        const selected = MODE_IDS[cursor] ?? "word";
        setMode(selected);
        nextStep(selected);
      } else if (step === "sub") {
        setSubIndex(cursor);
        nextStep();
      } else if (step === "difficulty") {
        setDifficulty(DIFFICULTIES[cursor] ?? "medium");
        nextStep();
      } else if (step === "duration") {
        setDurationIndex(cursor);
        startGame(cursor);
      }
    } else if (key.escape) {
      prevStep();
    }
  });

  const options = getCurrentOptions();

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          en-kata
        </Text>
        <Text dimColor> — Developer Typing Practice</Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold color="yellow">
          {getStepLabel()}
        </Text>
      </Box>

      <Box gap={1}>
        {options.map((opt, i) => (
          <Box key={opt}>
            {i === cursor ? (
              <Text bold color="green">
                {"▸ " + opt}
              </Text>
            ) : (
              <Text dimColor>{"  " + opt}</Text>
            )}
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          ←/→ navigate · Enter select · Esc back · q quit
        </Text>
      </Box>

      {/* Show current selections */}
      <Box marginTop={1} gap={1}>
        <Text dimColor>
          [{mode}]
          {hasSub ? ` [${getSubOptions(mode)[subIndex]}]` : ""}
          {hasDifficulty ? ` [${difficulty}]` : ""}
          {` [${DURATIONS[durationIndex]}s]`}
        </Text>
      </Box>

      {update && (
        <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow" borderLeft={false} borderRight={false} paddingX={1}>
          <Text bold color="yellow">
            Update available: {update.current} → {update.latest}
          </Text>
          <Text bold color="cyan">npm i -g en-kata</Text>
        </Box>
      )}
    </Box>
  );
}
