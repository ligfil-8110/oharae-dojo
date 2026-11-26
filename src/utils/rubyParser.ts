import type { Phrase, RubyMode, Token } from '../types.ts';

/**
 * Exact historical-to-modern kana mappings for classical words appearing in 大祓詞.
 * Ordered longest-first so compound words (e.g. おほはらへ, ゆふかぜ) resolve cleanly
 * without corrupting word-initial は-row syllables like はら (原) or はや (速).
 */
const HISTORICAL_KANA_MAP: ReadonlyArray<readonly [string, string]> = [
  ['おほうなばら', 'おおうなばら'],
  ['おほやまと', 'おおやまと'],
  ['おほはらへ', 'おおはらえ'],
  ['おほかはぢ', 'おおかわじ'],
  ['やほよろづ', 'やおよろず'],
  ['やほあひ', 'やおあい'],
  ['やしほぢ', 'やしおじ'],
  ['おほつべ', 'おおつべ'],
  ['おほふね', 'おおふね'],
  ['あらしほ', 'あらしお'],
  ['はやかは', 'はやかわ'],
  ['かむづま', 'かむずま'],
  ['かむつどへ', 'かむつどえ'],
  ['かむはらひ', 'かむはらい'],
  ['こととひ', 'こととい'],
  ['たひらけく', 'たいらけく'],
  ['たひら', 'たいら'],
  ['いはくら', 'いわくら'],
  ['いはね', 'いわね'],
  ['いはと', 'いわと'],
  ['やへぐも', 'やえぐも'],
  ['やほぢ', 'やおじ'],
  ['ゆふかぜ', 'ゆうかぜ'],
  ['ゆふべ', 'ゆうべ'],
  ['ゆふひ', 'ゆうひ'],
  ['けふ', 'きょう'],
  ['いは', 'いわ'],
  ['いほり', 'いおり'],
  ['おほ', 'おお'],
  ['まをす', 'もうす'],
  ['はらへ', 'はらえ'],
  ['はらひ', 'はらい'],
  ['はらふ', 'はらう'],
  ['たまひ', 'たまい'],
  ['つどへ', 'つどえ'],
  ['つかへ', 'つかえ'],
  ['あやま', 'あやま'],
  ['をし', 'おし'],
  ['をちかた', 'おちかた'],
  ['をか', 'おか'],
  ['をる', 'おる'],
  ['すゑ', 'すえ'],
  ['いふ', 'いう'],
  ['しほ', 'しお'],
  ['ゐ', 'い'],
  ['ゑ', 'え'],
  ['を', 'お'],
  ['ぢ', 'じ'],
  ['づ', 'ず'],
];

/**
 * Convert historical kana orthography (歴史的仮名遣い) used in 大祓詞 into
 * modern phonetic hiragana while keeping genuine initial は-row syllables intact.
 */
export function toModernKana(historical: string): string {
  if (!historical) return '';
  let result = historical;
  for (const [from, to] of HISTORICAL_KANA_MAP) {
    if (result.includes(from)) {
      result = result.split(from).join(to);
    }
  }
  return result;
}

/**
 * Convert katakana characters to hiragana for uniform comparison and TTS.
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Parse inline ruby notation `漢字[ふりがな]` into structured Token objects.
 * Supports plain text segments, punctuation, and optional `*` prefix before a ruby group
 * to mark key memorization words.
 */
export function parseRubyText(input: string, existingTokens?: Token[]): Token[] {
  const existingKeyMap = new Map<string, boolean>();
  if (existingTokens) {
    for (const tok of existingTokens) {
      if (tok.isKey) {
        existingKeyMap.set(tok.text, true);
      }
    }
  }

  const tokens: Token[] = [];
  const pattern = /(\*?)([\u4E00-\u9FFF々ヶ]+)\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      const plain = input.slice(lastIndex, match.index);
      pushPlainTokens(tokens, plain);
    }

    const hasStar = match[1] === '*';
    const text = match[2];
    const ruby = match[3].trim();
    const modernRuby = toModernKana(ruby);
    const isKey = hasStar || existingKeyMap.get(text) === true;

    tokens.push({
      text,
      ruby,
      modernRuby,
      tts: modernRuby,
      isKey,
    });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    pushPlainTokens(tokens, input.slice(lastIndex));
  }

  return tokens;
}

function pushPlainTokens(target: Token[], plain: string): void {
  // Split punctuation into separate tokens so cloze masking preserves delimiters
  const parts = plain.split(/([、。・「」\s]+)/).filter((p) => p.length > 0);
  for (const part of parts) {
    const clean = part.replace(/\*/g, '');
    if (!clean) continue;
    target.push({ text: clean });
  }
}

/**
 * Serialize Token[] back to user-editable `漢字[ふりがな]` text.
 */
export function serializeTokens(tokens: Token[]): string {
  return tokens
    .map((tok) => (tok.ruby ? `${tok.text}[${tok.ruby}]` : tok.text))
    .join('');
}

/**
 * Return the displayed ruby string for a token under the given RubyMode.
 */
export function getTokenRuby(token: Token, rubyMode: RubyMode): string | undefined {
  if (rubyMode === 'off' || !token.ruby) return undefined;
  if (rubyMode === 'modern') {
    return token.modernRuby ?? toModernKana(token.ruby);
  }
  return token.ruby;
}

/**
 * Return the plain kanji+kana surface string of a phrase (without ruby).
 */
export function getPhrasePlainText(phrase: Phrase): string {
  return phrase.tokens.map((t) => t.text).join('');
}

/**
 * Return the full phonetic hiragana reading of a phrase (for display or comparison).
 */
export function getPhraseKanaText(phrase: Phrase, mode: 'historical' | 'modern' = 'modern'): string {
  return phrase.tokens
    .map((t) => {
      if (t.ruby) {
        return mode === 'historical' ? t.ruby : (t.modernRuby ?? toModernKana(t.ruby));
      }
      return mode === 'historical' ? t.text : toModernKana(t.text);
    })
    .join('');
}

/**
 * Generate a clean Japanese TTS reading string with natural pauses at punctuation.
 */
export function getPhraseTtsText(phrase: Phrase, override?: string): string {
  if (override && override.trim().length > 0) {
    return katakanaToHiragana(override.trim());
  }
  return phrase.tokens
    .map((t) => {
      if (t.text === '・') return '、';
      if (t.tts) return t.tts;
      if (t.ruby) return t.modernRuby ?? toModernKana(t.ruby);
      return toModernKana(t.text);
    })
    .join('');
}

/**
 * Check whether a token is punctuation/whitespace (should never be masked in cloze).
 */
export function isPunctuationToken(token: Token): boolean {
  return /^[、。・「」\s]+$/.test(token.text);
}
