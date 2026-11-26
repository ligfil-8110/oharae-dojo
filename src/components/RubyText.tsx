import type { ClozeLevel, FontSize, RubyMode, Token } from '../types.ts';
import { getTokenRuby, isPunctuationToken } from '../utils/rubyParser.ts';

interface RubyTextProps {
  tokens: Token[];
  rubyMode: RubyMode;
  clozeLevel?: 0 | ClozeLevel;
  revealedIndices?: Set<number>;
  revealAll?: boolean;
  onToggleToken?: (index: number) => void;
  fontSize?: FontSize;
  className?: string;
}

function shouldHideToken(
  token: Token,
  index: number,
  substantivePosition: number,
  clozeLevel: 0 | ClozeLevel
): boolean {
  if (clozeLevel === 0 || isPunctuationToken(token)) return false;

  if (clozeLevel === 1) {
    return token.isKey === true;
  }

  if (clozeLevel === 2) {
    // Hide every other substantive token plus key terms
    return token.isKey === true || substantivePosition % 2 === 0;
  }

  if (clozeLevel === 3) {
    // Keep only the very first token's initial cue; hide the rest
    return index > 0;
  }

  // Level 4: hide everything except punctuation
  return true;
}

export function RubyText({
  tokens,
  rubyMode,
  clozeLevel = 0,
  revealedIndices,
  revealAll = false,
  onToggleToken,
  fontSize = 'md',
  className = '',
}: RubyTextProps) {
  let substantivePos = -1;

  return (
    <span className={`norito-text size-${fontSize} ${className}`}>
      {tokens.map((tok, idx) => {
        const isPunct = isPunctuationToken(tok);
        if (!isPunct) substantivePos++;

        const hiddenByLevel = shouldHideToken(tok, idx, substantivePos, clozeLevel);
        const isRevealed = revealAll || (revealedIndices?.has(idx) ?? false);

        if (clozeLevel === 3 && idx === 0 && !revealAll && !isRevealed) {
          // Show only first character as cue + mask remainder of first token
          const chars = Array.from(tok.text);
          const firstChar = chars[0] ?? '';
          const restLen = Math.max(1, chars.length - 1);
          return (
            <span key={idx}>
              <span>{firstChar}</span>
              {chars.length > 1 && (
                <button
                  type="button"
                  className="cloze-blank"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleToken?.(idx);
                  }}
                  title="タップして表示"
                >
                  {'□'.repeat(Math.min(4, restLen))}
                </button>
              )}
            </span>
          );
        }

        if (hiddenByLevel && !isRevealed) {
          const placeholderLen = Math.max(1, Math.min(5, Array.from(tok.text).length));
          const maskText = clozeLevel === 4 ? '＿'.repeat(placeholderLen) : '□'.repeat(placeholderLen);
          return (
            <button
              key={idx}
              type="button"
              className="cloze-blank"
              onClick={(e) => {
                e.stopPropagation();
                onToggleToken?.(idx);
              }}
              title="タップして答えを表示"
            >
              {maskText}
            </button>
          );
        }

        const ruby = getTokenRuby(tok, rubyMode);
        const revealedStyle = hiddenByLevel && isRevealed ? 'cloze-revealed' : '';

        if (ruby) {
          return (
            <ruby
              key={idx}
              className={revealedStyle}
              onClick={
                hiddenByLevel && onToggleToken
                  ? (e) => {
                      e.stopPropagation();
                      onToggleToken(idx);
                    }
                  : undefined
              }
            >
              {tok.text}
              <rp>(</rp>
              <rt>{ruby}</rt>
              <rp>)</rp>
            </ruby>
          );
        }

        return (
          <span
            key={idx}
            className={revealedStyle}
            onClick={
              hiddenByLevel && onToggleToken
                ? (e) => {
                    e.stopPropagation();
                    onToggleToken(idx);
                  }
                : undefined
            }
          >
            {tok.text}
          </span>
        );
      })}
    </span>
  );
}
