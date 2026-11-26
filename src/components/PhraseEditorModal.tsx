import { useMemo, useState } from 'react';
import { Play, RotateCcw, Save, Volume2, X } from 'lucide-react';
import type { CustomPhraseOverride, Phrase } from '../types.ts';
import { getPhraseTtsText, parseRubyText, serializeTokens } from '../utils/rubyParser.ts';
import { RubyText } from './RubyText.tsx';

interface PhraseEditorModalProps {
  phrase: Phrase;
  existingOverride?: CustomPhraseOverride;
  defaultAudioRange?: { start: number; end: number };
  onPreviewAudioRange?: (start: number, end: number) => void;
  onSave: (phraseId: string, override: CustomPhraseOverride) => void;
  onReset: (phraseId: string) => void;
  onClose: () => void;
}

export function PhraseEditorModal({
  phrase,
  existingOverride,
  defaultAudioRange,
  onPreviewAudioRange,
  onSave,
  onReset,
  onClose,
}: PhraseEditorModalProps) {
  const [rawRubyText, setRawRubyText] = useState(
    () => existingOverride?.rawRubyText ?? serializeTokens(phrase.tokens)
  );
  const [translation, setTranslation] = useState(
    () => existingOverride?.translation ?? phrase.translation
  );
  const [ttsOverride, setTtsOverride] = useState(
    () => existingOverride?.ttsOverride ?? ''
  );
  const [audioStart, setAudioStart] = useState<string>(() =>
    existingOverride?.audioStart !== undefined
      ? String(existingOverride.audioStart)
      : defaultAudioRange
      ? String(defaultAudioRange.start)
      : ''
  );
  const [audioEnd, setAudioEnd] = useState<string>(() =>
    existingOverride?.audioEnd !== undefined
      ? String(existingOverride.audioEnd)
      : defaultAudioRange
      ? String(defaultAudioRange.end)
      : ''
  );

  const previewTokens = useMemo(
    () => parseRubyText(rawRubyText, phrase.tokens),
    [rawRubyText, phrase.tokens]
  );

  const defaultTts = useMemo(
    () => getPhraseTtsText({ ...phrase, tokens: previewTokens }),
    [phrase, previewTokens]
  );

  const nudgeTime = (setter: React.Dispatch<React.SetStateAction<string>>, delta: number) => {
    setter((prev) => {
      const n = parseFloat(prev);
      const base = Number.isFinite(n) ? n : 0;
      return String(Math.max(0, Math.round((base + delta) * 10) / 10));
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedStart = parseFloat(audioStart);
    const parsedEnd = parseFloat(audioEnd);
    const hasCustomAudio =
      defaultAudioRange &&
      Number.isFinite(parsedStart) &&
      Number.isFinite(parsedEnd) &&
      (Math.abs(parsedStart - defaultAudioRange.start) > 0.01 ||
        Math.abs(parsedEnd - defaultAudioRange.end) > 0.01);

    onSave(phrase.id, {
      rawRubyText: rawRubyText.trim(),
      translation: translation.trim() || phrase.translation,
      ttsOverride: ttsOverride.trim() || undefined,
      audioStart: hasCustomAudio ? Math.round(parsedStart * 10) / 10 : undefined,
      audioEnd: hasCustomAudio ? Math.round(parsedEnd * 10) / 10 : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="本文・ルビ編集">
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3 className="section-heading" style={{ margin: 0 }}>
            本文・ふりがな・音源位置の編集
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          <code>漢字[ふりがな]</code> の形式で自由に書き換えられます（例：<code>短山[みやま]</code> や流派ごとの読み替え）。
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            ルビ付き本文
            <textarea
              className="text-input"
              rows={3}
              style={{ width: '100%', marginTop: 6, lineHeight: 1.6 }}
              value={rawRubyText}
              onChange={(e) => setRawRubyText(e.target.value)}
            />
          </label>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>プレビュー</div>
            <RubyText tokens={previewTokens} rubyMode="historical" fontSize="md" />
          </div>

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            現代語訳・メモ
            <textarea
              className="text-input"
              rows={2}
              style={{ width: '100%', marginTop: 6 }}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
            />
          </label>

          {defaultAudioRange && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  <Volume2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  お手本音源の切り取り位置（秒）
                </span>
                {onPreviewAudioRange && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ai"
                    onClick={() => {
                      const s = parseFloat(audioStart);
                      const e = parseFloat(audioEnd);
                      if (Number.isFinite(s) && Number.isFinite(e) && e > s) {
                        onPreviewAudioRange(s, e);
                      }
                    }}
                  >
                    <Play size={13} />
                    <span>この範囲を試聴</span>
                  </button>
                )}
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>開始秒</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => nudgeTime(setAudioStart, -0.5)}
                    >
                      -0.5
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      className="text-input"
                      style={{ width: 84 }}
                      value={audioStart}
                      onChange={(e) => setAudioStart(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => nudgeTime(setAudioStart, 0.5)}
                    >
                      +0.5
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>終了秒</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => nudgeTime(setAudioEnd, -0.5)}
                    >
                      -0.5
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      className="text-input"
                      style={{ width: 84 }}
                      value={audioEnd}
                      onChange={(e) => setAudioEnd(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => nudgeTime(setAudioEnd, 0.5)}
                    >
                      +0.5
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            TTS読み上げ用ひらがな（任意・空欄なら自動生成）
            <input
              type="text"
              className="text-input"
              style={{ width: '100%', marginTop: 6 }}
              placeholder={defaultTts}
              value={ttsOverride}
              onChange={(e) => setTtsOverride(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            {existingOverride ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  onReset(phrase.id);
                  onClose();
                }}
              >
                <RotateCcw size={14} />
                <span>標準に戻す</span>
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={15} />
                <span>保存する</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
