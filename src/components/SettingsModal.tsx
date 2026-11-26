import { useState } from 'react';
import { Download, RotateCcw, Upload, X } from 'lucide-react';
import type { PresetId, StudySettings } from '../types.ts';

interface SettingsModalProps {
  settings: StudySettings;
  customOverrideCount: number;
  onUpdateSettings: (patch: Partial<StudySettings>) => void;
  onExportBackup: () => string;
  onImportBackup: (json: string) => boolean;
  onResetOverrides: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  customOverrideCount,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetOverrides,
  onResetProgress,
  onClose,
}: SettingsModalProps) {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const json = onExportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oharae-dojo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('バックアップJSONをダウンロードしました。');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = onImportBackup(importText);
    setMessage(
      ok
        ? '学習データと設定を復元しました。'
        : 'JSONの形式が正しくないため読み込めませんでした。'
    );
    if (ok) setImportText('');
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="設定とバックアップ">
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 className="section-heading" style={{ margin: 0 }}>
            大祓詞テキスト・環境設定
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preset */}
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
              使用する大祓詞の形式（プリセット）
            </div>
            <div className="seg-group" style={{ width: '100%' }}>
              {(['noru', 'maosu'] as PresetId[]).map((pid) => (
                <button
                  key={pid}
                  type="button"
                  className={`seg-btn ${settings.preset === pid ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => onUpdateSettings({ preset: pid })}
                >
                  {pid === 'noru'
                    ? '結び「宣る」標準形（宣読体）'
                    : '神社本庁例文「白す」形（奏上体）'}
                </button>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
              ※ 細かな読み・漢字の違いは「通読・解説」タブの各句にある「ルビ・本文編集」から手元の教本に合わせて調整できます。
            </p>
          </div>

          {settings.preset === 'noru' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13.5,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={settings.includeFramingLines}
                onChange={(e) => onUpdateSettings({ includeFramingLines: e.target.checked })}
              />
              <span>
                宣読体の前後句（「集侍れる人等…」と「神職等大川道に…」）を含める
              </span>
            </label>
          )}

          {/* Backup */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>
              PC・スマホ間のデータ引き継ぎ（バックアップ）
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <button type="button" className="btn btn-sm" onClick={handleDownloadBackup}>
                <Download size={14} />
                <span>進捗・編集内容を書き出す</span>
              </button>
            </div>
            <textarea
              className="text-input"
              rows={3}
              style={{ width: '100%', fontSize: 12 }}
              placeholder="書き出したバックアップJSONをここに貼り付けて復元できます"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm"
              style={{ marginTop: 6 }}
              onClick={handleImport}
              disabled={!importText.trim()}
            >
              <Upload size={14} />
              <span>JSONから復元する</span>
            </button>
          </div>

          {/* Resets */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>リセット</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={customOverrideCount === 0}
                onClick={() => {
                  onResetOverrides();
                  setMessage('カスタム編集された本文・ルビをすべて初期化しました。');
                }}
              >
                <RotateCcw size={14} />
                <span>本文編集を標準に戻す（{customOverrideCount}件）</span>
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ color: 'var(--shu)', borderColor: 'var(--shu)' }}
                onClick={() => {
                  if (window.confirm('学習進捗と7日間チェックをすべてリセットしますか？')) {
                    onResetProgress();
                    setMessage('学習進捗をリセットしました。');
                  }
                }}
              >
                <RotateCcw size={14} />
                <span>学習進捗をリセット</span>
              </button>
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--matsu-soft)',
                color: 'var(--matsu)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
