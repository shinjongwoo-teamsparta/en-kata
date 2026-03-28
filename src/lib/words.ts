import wordsData from "~/data/words.json";
import phrasesData from "~/data/phrases.json";
import shortCodeData from "~/data/short-codes.json";
import namingData from "~/data/naming-phrases.json";
import phraseKoreanData from "~/data/phrase-korean.json";
import type {
  Difficulty,
  GameMode,
  NamingConvention,
  ShortCodeLanguage,
  WordCategory,
  WordItem,
} from "./types";

const phraseKorean = phraseKoreanData as Record<string, string>;

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

function toPascalCase(phrase: string): string {
  return phrase
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
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
    case "PascalCase":
      return toPascalCase(phrase);
  }
}

export function getWords(
  mode: GameMode,
  difficulty: Difficulty,
  convention?: NamingConvention,
  category?: WordCategory,
  language?: ShortCodeLanguage,
): WordItem[] {
  switch (mode) {
    case "word": {
      const cat = category ?? "general";
      const words =
        (wordsData as Record<string, Record<string, string[]>>)[cat]?.[
          difficulty
        ] ?? [];
      return shuffle(words).map((w) => ({
        display: w,
        target: w,
      }));
    }
    case "phrase": {
      const phrases =
        (phrasesData as Record<string, string[]>)[difficulty] ?? [];
      return shuffle(phrases).map((p) => ({ display: p, target: p, korean: phraseKorean[p] }));
    }
    case "code": {
      const lang = language ?? "typescript";
      const langData =
        (shortCodeData as Record<string, { codes: string[] }>)[lang];
      const symbols = langData?.codes ?? [];
      return shuffle(symbols).map((s) => ({ display: s, target: s }));
    }
    case "variableName": {
      const phrases = namingData as string[];
      const conv = convention ?? "camelCase";
      return shuffle(phrases).map((p) => ({
        display: p,
        target: convertToConvention(p, conv),
      }));
    }
  }
}
