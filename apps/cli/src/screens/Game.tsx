import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { TypingGameEngine } from "@en-kata/core";
import type { GameSettings, GameResult, TypingGameState } from "@en-kata/core";

interface GameProps {
  settings: GameSettings;
  onFinish: (result: GameResult) => void;
  onQuit: () => void;
}

export function Game({ settings, onFinish, onQuit }: GameProps) {
  const { exit } = useApp();
  const engineRef = useRef<TypingGameEngine | null>(null);
  const [state, setState] = useState<TypingGameState | null>(null);
  const finishCallbackRef = useRef(onFinish);
  finishCallbackRef.current = onFinish;

  useEffect(() => {
    const engine = new TypingGameEngine(settings, {
      onStateChange: (s) => setState({ ...s }),
      onFinish: (result) => finishCallbackRef.current(result),
    });
    engineRef.current = engine;
    engine.start();

    return () => engine.destroy();
  }, [settings]);

  useInput((input, key) => {
    if (!engineRef.current) return;

    if (key.escape) {
      engineRef.current.destroy();
      onQuit();
      return;
    }

    if (key.backspace) {
      engineRef.current.handleKey("Backspace");
      return;
    }

    if (input && input.length === 1) {
      engineRef.current.handleKey(input);
    }
  });

  if (!state || state.status === "idle") {
    return (
      <Box padding={1}>
        <Text>Starting...</Text>
      </Box>
    );
  }

  const currentWord = state.words[state.currentWordIndex];
  const target = currentWord?.target ?? "";
  const display = currentWord?.display ?? "";
  const showDisplay = display !== target;

  // Format timer
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // WPM
  const wpm =
    state.elapsed > 0
      ? Math.round((state.correctChars / 5) / (state.elapsed / 60))
      : 0;

  // Upcoming words (next 5)
  const upcoming = state.words
    .slice(state.currentWordIndex + 1, state.currentWordIndex + 6)
    .map((w) => w.target);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Status bar */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text color="cyan" bold>
            {settings.mode}
          </Text>
          <Text dimColor>·</Text>
          <Text dimColor>{settings.difficulty}</Text>
          {settings.category && (
            <>
              <Text dimColor>·</Text>
              <Text dimColor>{settings.category}</Text>
            </>
          )}
          {settings.language && (
            <>
              <Text dimColor>·</Text>
              <Text dimColor>{settings.language}</Text>
            </>
          )}
          {settings.convention && (
            <>
              <Text dimColor>·</Text>
              <Text dimColor>{settings.convention}</Text>
            </>
          )}
        </Box>
        <Box gap={2}>
          <Text color="yellow" bold>
            {wpm} WPM
          </Text>
          <Text color="magenta" bold>
            {timeStr}
          </Text>
        </Box>
      </Box>

      {/* Display hint (for variableName mode) */}
      {showDisplay && (
        <Box marginBottom={1}>
          <Text dimColor>"{display}"</Text>
        </Box>
      )}

      {/* Current word with character coloring */}
      <Box>
        {target.split("").map((char, i) => {
          const charState = state.charStates[i];
          if (i === state.currentCharIndex) {
            // Cursor position
            return (
              <Text key={i} underline bold color="white" backgroundColor="blue">
                {char}
              </Text>
            );
          } else if (charState === "correct") {
            return (
              <Text key={i} color="green">
                {char}
              </Text>
            );
          } else if (charState === "incorrect") {
            return (
              <Text key={i} color="red" strikethrough>
                {char}
              </Text>
            );
          } else {
            return (
              <Text key={i} dimColor>
                {char}
              </Text>
            );
          }
        })}
      </Box>

      {/* Upcoming words */}
      <Box marginTop={1}>
        <Text dimColor>next: {upcoming.join("  ")}</Text>
      </Box>

      {/* Bottom bar */}
      <Box marginTop={1} justifyContent="space-between">
        <Text dimColor>
          Words: {state.completedWords}
        </Text>
        <Text dimColor>Esc to quit</Text>
      </Box>
    </Box>
  );
}
