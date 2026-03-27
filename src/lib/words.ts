import wordsData from "~/data/words.json";
import symbolsData from "~/data/symbols.json";
import namingData from "~/data/naming-phrases.json";
import type {
  Difficulty,
  GameMode,
  NamingConvention,
  WordCategory,
  WordItem,
} from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function toCamelCase(phrase: string): string {
  return phrase
    .split(" ")
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("");
}

function toSnakeCase(phrase: string): string {
  return phrase.split(" ").join("_").toLowerCase();
}

function toKebabCase(phrase: string): string {
  return phrase.split(" ").join("-").toLowerCase();
}

export function convertToConvention(
  phrase: string,
  convention: NamingConvention,
): string {
  switch (convention) {
    case "camelCase":
      return toCamelCase(phrase);
    case "snake_case":
      return toSnakeCase(phrase);
    case "kebab-case":
      return toKebabCase(phrase);
  }
}

export function getWords(
  mode: GameMode,
  difficulty: Difficulty,
  convention?: NamingConvention,
  category?: WordCategory,
): WordItem[] {
  switch (mode) {
    case "word": {
      const cat = category ?? "general";
      const words =
        (wordsData as Record<string, Record<string, string[]>>)[cat]?.[
          difficulty
        ] ?? [];
      return shuffle(words).map((w) => ({ display: w, target: w }));
    }
    case "symbol": {
      const symbols =
        (symbolsData as Record<string, string[]>)[difficulty] ?? [];
      return shuffle(symbols).map((s) => ({ display: s, target: s }));
    }
    case "naming": {
      const phrases =
        (namingData as Record<string, string[]>)[difficulty] ?? [];
      const conv = convention ?? "camelCase";
      return shuffle(phrases).map((p) => ({
        display: p,
        target: convertToConvention(p, conv),
      }));
    }
  }
}
