import { useMemo, useState } from 'react';
import { RotateCcw, Save, X } from 'lucide-react';
import type { CustomPhraseOverride, Phrase } from '../types.ts';
import { getPhraseTtsText, parseRubyText, serializeTokens } from '../utils/rubyParser.ts';
import { RubyText } from './RubyText.tsx';

interface PhraseEditorModalProps {
  phrase: Phrase;
  existingOverride?: CustomPhraseOverride;
  onSave: (phraseId: string, override: CustomPhraseOverride) => void;
  onReset: (phraseId: string) => void;
  onClose: () => void;
}

export function PhraseEditorModal({
  phrase,
  existingOverride,
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

  const previewTokens = useMemo(
    () => parseRubyText(rawRubyText, phrase.tokens),
    [rawRubyText, phrase.tokens]
  );

  const defaultTts = useMemo(
    () => getPhraseTtsText({ ...phrase, tokens: previewTokens }),
    [phrase, previewTokens]
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(phrase.id, {
      rawRubyText: rawRubyText.trim(),
      translation: translation.trim() || phrase.translation,
      ttsOverride: ttsOverride.trim() || undefined,
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
            本文・ふりがな編集
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

          <label style={{ fontSize: 13, fontWeight: 600 }}>
            読み上げ用ひらがな（任意・空欄なら自動生成）
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
                <span>標準テキストに戻す</span>
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
