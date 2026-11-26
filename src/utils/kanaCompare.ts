import type { Phrase } from '../types.ts';
import { isPunctuationToken, katakanaToHiragana, toModernKana } from './rubyParser.ts';

export interface ComparisonSegment {
  char: string;
  matched: boolean;
}

export interface RecitationComparison {
  score: number;
  segments: ComparisonSegment[];
  normalizedSpoken: string;
}

export interface TokenRecitationResult {
  text: string;
  ruby?: string;
  status: 'matched' | 'partial' | 'missed';
  isPunct: boolean;
}

export interface PhraseRecitationEvaluation {
  score: number;
  tokenResults: TokenRecitationResult[];
  matchedCount: number;
  totalCount: number;
  normalizedSpoken: string;
}

export interface WrittenComparisonResult {
  score: number;
  isExact: boolean;
  expectedDiff: Array<{ char: string; matched: boolean }>;
  actualDiff: Array<{ char: string; extra: boolean }>;
}

const KANJI_VARIANT_MAP: ReadonlyArray<readonly [string, string]> = [
  ['國', '国'],
  ['萬', '万'],
  ['豐', '豊'],
  ['賣', '売'],
  ['氣', '気'],
  ['拂', '払'],
  ['淸', '清'],
  ['邊', '辺'],
  ['會', '会'],
  ['燒', '焼'],
  ['斷', '断'],
  ['隱', '隠'],
  ['穗', '穂'],
  ['廣', '広'],
  ['澤', '沢'],
  ['齊', '斉'],
  ['鹽', '塩'],
  ['瀨', '瀬'],
  ['與', '与'],
  ['歸', '帰'],
  ['辭', '辞'],
  ['禮', '礼'],
  ['禱', '祷'],
  ['神', '神'],
];

const SPEECH_HOMOPHONE_MAP: ReadonlyArray<readonly [string, string]> = [
  ['たかまのはら', 'たかまのはら'],
  ['高天の原', 'たかまのはら'],
  ['高天原', 'たかまのはら'],
  ['豊葦原', 'とよあしはら'],
  ['水穂', 'みずほ'],
  ['瑞穂', 'みずほ'],
  ['八百万', 'やおよろず'],
  ['皇御孫命', 'すめみまのみこと'],
  ['瀬織津', 'せおりつ'],
  ['速開都', 'はやあきつ'],
  ['気吹戸主', 'いぶきどぬし'],
  ['伊吹戸主', 'いぶきどぬし'],
  ['気吹戸', 'いぶきど'],
  ['伊吹戸', 'いぶきど'],
  ['速佐須良', 'はやさすら'],
  ['佐久那太理', 'さくなだり'],
  ['大海原', 'おおうなばら'],
  ['大倭日高見', 'おおやまとひだかみ'],
  ['科戸', 'しなど'],
  ['焼鎌', 'やきがま'],
  ['敏鎌', 'とがま'],
  ['根国', 'ねのくに'],
  ['底国', 'そこのくに'],
  ['天つ祝詞', 'あまつのりと'],
  ['太祝詞事', 'ふとのりとごと'],
  ['比売', 'ひめ'],
  ['姫', 'ひめ'],
  ['言う', 'いう'],
  ['云ふ', 'いう'],
  ['云う', 'いう'],
  ['白す', 'もうす'],
  ['申す', 'もうす'],
  ['坐す', 'ます'],
  ['座す', 'ます'],
  ['賜', 'たま'],
  ['奉', 'まつ'],
  ['宣れ', 'のれ'],
  ['乗れ', 'のれ'],
  ['宣る', 'のる'],
  ['乗る', 'のる'],
];

export function normalizeKanjiVariants(text: string): string {
  let out = text;
  for (const [kyu, shin] of KANJI_VARIANT_MAP) {
    if (out.includes(kyu)) out = out.split(kyu).join(shin);
  }
  return out;
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
 * Normalize speech recognition output or expected text for Shinto homophones + kana.
 */
export function normalizeForSpeechCompare(text: string): string {
  let out = normalizeKanjiVariants(text);
  for (const [from, to] of SPEECH_HOMOPHONE_MAP) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
    }
  }
  return normalizeForCompare(out);
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
 * Character-level comparison against expected reading (kana) and surface kanji.
 */
export function compareRecitation(
  expectedKana: string,
  expectedKanji: string,
  spokenText: string
): RecitationComparison {
  const normKana = normalizeForSpeechCompare(expectedKana);
  const normKanji = normalizeForSpeechCompare(expectedKanji);
  const normSpoken = normalizeForSpeechCompare(spokenText);

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

/**
 * Token-level recitation evaluation for a Phrase against speech recognition output.
 * Matches each substantive token sequentially using both normalized kanji and modern kana readings.
 */
export function comparePhraseRecitation(
  phrase: Phrase,
  spokenText: string
): PhraseRecitationEvaluation {
  const normSpoken = normalizeForSpeechCompare(spokenText);

  const tokenResults: TokenRecitationResult[] = [];
  let weightedMatched = 0;
  let totalWeight = 0;
  let matchedCount = 0;
  let totalCount = 0;

  // Build normalized spoken chunks; match each token sequentially against a sliding window
  let cursor = 0;

  for (const tok of phrase.tokens) {
    if (isPunctuationToken(tok)) {
      tokenResults.push({ text: tok.text, status: 'matched', isPunct: true });
      continue;
    }

    const tokKana = normalizeForSpeechCompare(tok.modernRuby ?? toModernKana(tok.ruby ?? tok.text));
    const tokSurf = normalizeForSpeechCompare(tok.text);
    const candidates = Array.from(new Set([tokKana, tokSurf].filter((s) => s.length > 0)));
    const weight = Math.max(1, tokKana.length);
    totalWeight += weight;
    totalCount++;

    if (!normSpoken || candidates.length === 0) {
      tokenResults.push({ text: tok.text, ruby: tok.ruby, status: 'missed', isPunct: false });
      continue;
    }

    // Search from slightly before cursor so a missed token doesn't lock out later tokens
    const windowStart = Math.max(0, cursor - 3);
    const slice = normSpoken.slice(windowStart);

    let bestRatio = 0;
    let bestAdvance = 0;

    for (const cand of candidates) {
      const exactIdx = slice.indexOf(cand);
      if (exactIdx !== -1) {
        bestRatio = 1;
        bestAdvance = windowStart + exactIdx + cand.length;
        break;
      }
      // Look within a local window (up to cand.length * 3 + 12 chars) for fuzzy/partial match
      const localWindow = slice.slice(0, Math.max(24, cand.length * 4 + 10));
      const matched = computeLcsMatchIndices(cand, localWindow);
      const ratio = matched.size / cand.length;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        if (ratio >= 0.6) {
          // Estimate advance position where last matched char occurred
          bestAdvance = Math.min(normSpoken.length, windowStart + cand.length);
        }
      }
    }

    if (bestRatio >= 0.7) {
      tokenResults.push({ text: tok.text, ruby: tok.ruby, status: 'matched', isPunct: false });
      weightedMatched += weight;
      matchedCount++;
      if (bestAdvance > cursor) cursor = bestAdvance;
    } else if (bestRatio >= 0.4) {
      tokenResults.push({ text: tok.text, ruby: tok.ruby, status: 'partial', isPunct: false });
      weightedMatched += weight * 0.5;
    } else {
      tokenResults.push({ text: tok.text, ruby: tok.ruby, status: 'missed', isPunct: false });
    }
  }

  const score = totalWeight > 0 ? Math.min(100, Math.round((weightedMatched / totalWeight) * 100)) : 0;

  return {
    score,
    tokenResults,
    matchedCount,
    totalCount,
    normalizedSpoken: normSpoken,
  };
}

function normalizeWrittenString(
  text: string,
  ignorePunctuation: boolean,
  tolerateVariants: boolean
): { normalized: string; indexMap: number[] } {
  const chars = Array.from(text);
  const out: string[] = [];
  const indexMap: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (/[\s\u3000]/.test(ch)) continue;
    if (ignorePunctuation && /[、。・「」『』（）(),.!?！？]/.test(ch)) continue;
    if (tolerateVariants) {
      ch = normalizeKanjiVariants(ch);
    }
    out.push(ch);
    indexMap.push(i);
  }

  return { normalized: out.join(''), indexMap };
}

/**
 * Grade a user's written 書き下し文 against expected text, returning character-level diffs.
 */
export function compareWrittenText(
  expected: string,
  actual: string,
  options: { ignorePunctuation?: boolean; tolerateVariants?: boolean } = {}
): WrittenComparisonResult {
  const ignorePunctuation = options.ignorePunctuation ?? true;
  const tolerateVariants = options.tolerateVariants ?? true;

  const expNorm = normalizeWrittenString(expected, ignorePunctuation, tolerateVariants);
  const actNorm = normalizeWrittenString(actual, ignorePunctuation, tolerateVariants);

  const expChars = Array.from(expected);
  const actChars = Array.from(actual);

  if (!expNorm.normalized) {
    return { score: 0, isExact: false, expectedDiff: [], actualDiff: [] };
  }

  const matchedExpNorm = computeLcsMatchIndices(expNorm.normalized, actNorm.normalized);
  const matchedActNorm = computeLcsMatchIndices(actNorm.normalized, expNorm.normalized);

  const expMatchedOrigIndices = new Set<number>();
  matchedExpNorm.forEach((normIdx) => {
    expMatchedOrigIndices.add(expNorm.indexMap[normIdx]);
  });

  const actMatchedOrigIndices = new Set<number>();
  matchedActNorm.forEach((normIdx) => {
    actMatchedOrigIndices.add(actNorm.indexMap[normIdx]);
  });

  const expectedDiff = expChars.map((char, idx) => {
    const isSkippable =
      /[\s\u3000]/.test(char) || (ignorePunctuation && /[、。・「」『』（）(),.!?！？]/.test(char));
    return {
      char,
      matched: isSkippable || expMatchedOrigIndices.has(idx),
    };
  });

  const actualDiff = actChars.map((char, idx) => {
    const isSkippable =
      /[\s\u3000]/.test(char) || (ignorePunctuation && /[、。・「」『』（）(),.!?！？]/.test(char));
    return {
      char,
      extra: !isSkippable && !actMatchedOrigIndices.has(idx),
    };
  });

  const totalLen = expNorm.normalized.length + actNorm.normalized.length;
  const score =
    totalLen > 0
      ? Math.min(100, Math.round(((2 * matchedExpNorm.size) / totalLen) * 100))
      : 0;
  const isExact = expNorm.normalized === actNorm.normalized;

  return { score, isExact, expectedDiff, actualDiff };
}

/**
 * Grade an inline key-kanji blank input against expected token text.
 */
export function isKanjiAnswerMatch(
  expectedTokenText: string,
  userInput: string,
  tolerateVariants = true
): boolean {
  const cleanExp = expectedTokenText.replace(/[\s\u3000]/g, '');
  const cleanAct = userInput.replace(/[\s\u3000]/g, '');
  if (!cleanAct) return false;
  if (tolerateVariants) {
    return normalizeKanjiVariants(cleanExp) === normalizeKanjiVariants(cleanAct);
  }
  return cleanExp === cleanAct;
}
