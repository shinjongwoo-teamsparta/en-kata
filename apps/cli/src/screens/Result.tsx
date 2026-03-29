import React from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { GameResult, GameSettings } from "@en-kata/core";

interface ResultProps {
  result: GameResult;
  settings: GameSettings;
  onRetry: () => void;
  onMenu: () => void;
}

export function Result({ result, settings, onRetry, onMenu }: ResultProps) {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.return) {
      onRetry();
    } else if (key.escape) {
      onMenu();
    } else if (input === "q") {
      exit();
    }
  });

  // Sort mistakes by count (descending)
  const mistakes = Object.entries(result.mistakeMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Simple WPM sparkline
  const timeline = result.wpmTimeline;
  const maxWpm = Math.max(...timeline.map((t) => t.wpm), 1);
  const barChars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const spark = timeline
    .map((t) => {
      const idx = Math.min(
        Math.floor((t.wpm / maxWpm) * (barChars.length - 1)),
        barChars.length - 1,
      );
      return barChars[idx];
    })
    .join("");

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Results
        </Text>
      </Box>

      <Box marginBottom={1} gap={1}>
        <Text dimColor>
          {settings.mode} · {settings.difficulty} · {settings.duration}s
        </Text>
      </Box>

      {/* Stats */}
      <Box flexDirection="column" gap={0}>
        <Box gap={2}>
          <Box width={20}>
            <Text>WPM: </Text>
            <Text bold color="green">
              {result.wpm}
            </Text>
          </Box>
          <Box width={20}>
            <Text>CPM: </Text>
            <Text bold color="green">
              {result.cpm}
            </Text>
          </Box>
        </Box>
        <Box gap={2}>
          <Box width={20}>
            <Text>Accuracy: </Text>
            <Text bold color={result.accuracy >= 90 ? "green" : result.accuracy >= 70 ? "yellow" : "red"}>
              {result.accuracy}%
            </Text>
          </Box>
          <Box width={20}>
            <Text>Words: </Text>
            <Text bold color="green">
              {result.completedWords}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* WPM Timeline */}
      {timeline.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>WPM over time:</Text>
          <Text color="cyan">{spark}</Text>
        </Box>
      )}

      {/* Mistakes */}
      {mistakes.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Most missed:</Text>
          <Box gap={1}>
            {mistakes.map(([char, count]) => (
              <Text key={char} color="red">
                {char === " " ? "⎵" : char}
                <Text dimColor>(x{count})</Text>
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Actions */}
      <Box marginTop={1}>
        <Text dimColor>
          Enter retry · Esc menu · q quit
        </Text>
      </Box>
    </Box>
  );
}
