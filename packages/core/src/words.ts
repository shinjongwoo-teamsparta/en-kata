import wordsData from "../data/words.json" with { type: "json" };
import phrasesData from "../data/phrases.json" with { type: "json" };
import shortCodeData from "../data/short-codes.json" with { type: "json" };
import phraseKoreanData from "../data/phrase-korean.json" with { type: "json" };
import paragraphsData from "../data/paragraphs.json" with { type: "json" };
import type {
  Difficulty,
  GameMode,
  ShortCodeLanguage,
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

export function getWords(
  mode: GameMode,
  difficulty: Difficulty,
  language?: ShortCodeLanguage,
): WordItem[] {
  switch (mode) {
    case "word": {
      const data = wordsData as Record<string, Record<string, string[]>>;
      const words = Object.values(data).flatMap(
        (cat) => cat[difficulty] ?? [],
      );
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
    case "paragraph": {
      const paragraphs =
        (paragraphsData as Record<string, string[]>)[difficulty] ?? [];
      return shuffle(paragraphs).map((p) => ({ display: p, target: p }));
    }
  }
}
