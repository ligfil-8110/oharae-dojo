import { katakanaToHiragana, toModernKana } from './rubyParser.ts';

export interface ComparisonSegment {
  char: string;
  matched: boolean;
}

export interface RecitationComparison {
  score: number;
  segments: ComparisonSegment[];
  normalizedSpoken: string;
}

/**
 * Normalize Japanese text for recitation matching:
 * strips punctuation/whitespace, converts katakana -> hiragana, and normalizes historical kana.
 */
export function normalizeForCompare(text: string): string {
  const stripped = text.replace(/[\s、。・「」『』（）(),.!?！？\-ー〜～]/g, '');
  const hira = katakanaToHiragana(stripped);
  return toModernKana(hira);
}

/**
 * Compute LCS (Longest Common Subsequence) matched indices on target string against spoken string.
 */
function computeLcsMatchIndices(target: string, spoken: string): Set<number> {
  const n = target.length;
  const m = spoken.length;
  const matchedIndices = new Set<number>();
  if (n === 0 || m === 0) return matchedIndices;

  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

  for (let i = 1; i <= n; i++) {
    const tc = target[i - 1];
    for (let j = 1; j <= m; j++) {
      if (tc === spoken[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = dp[i - 1][j] >= dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
      }
    }
  }

  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (target[i - 1] === spoken[j - 1]) {
      matchedIndices.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matchedIndices;
}

/**
 * Compare user speech recognition output against expected reading (kana) and surface kanji.
 * Japanese SpeechRecognition often emits a mix of kanji and hiragana; we evaluate against
 * expected kana and expected kanji token-by-token and return the best alignment score.
 */
export function compareRecitation(
  expectedKana: string,
  expectedKanji: string,
  spokenText: string
): RecitationComparison {
  const normKana = normalizeForCompare(expectedKana);
  const normKanji = normalizeForCompare(expectedKanji);
  const normSpoken = normalizeForCompare(spokenText);

  if (!normKana) {
    return { score: 0, segments: [], normalizedSpoken: normSpoken };
  }

  if (!normSpoken) {
    return {
      score: 0,
      segments: Array.from(normKana).map((char) => ({ char, matched: false })),
      normalizedSpoken: '',
    };
  }

  const kanaMatches = computeLcsMatchIndices(normKana, normSpoken);
  const kanjiMatches = computeLcsMatchIndices(normKanji, normSpoken);

  const kanaRatio = kanaMatches.size / normKana.length;
  const kanjiRatio = normKanji.length > 0 ? kanjiMatches.size / normKanji.length : 0;

  if (kanjiRatio > kanaRatio) {
    const score = Math.min(100, Math.round(kanjiRatio * 100));
    const segments = Array.from(normKanji).map((char, idx) => ({
      char,
      matched: kanjiMatches.has(idx),
    }));
    return { score, segments, normalizedSpoken: normSpoken };
  }

  const score = Math.min(100, Math.round(kanaRatio * 100));
  const segments = Array.from(normKana).map((char, idx) => ({
    char,
    matched: kanaMatches.has(idx),
  }));
  return { score, segments, normalizedSpoken: normSpoken };
}
