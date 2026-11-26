import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Play,
  Repeat,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.ts';
import type { FontSize, MasteryStatus, Phrase, RubyMode, Section } from '../types.ts';
import { compareRecitation } from '../utils/kanaCompare.ts';
import { getPhraseKanaText, getPhrasePlainText } from '../utils/rubyParser.ts';
import { RubyText } from './RubyText.tsx';

interface AudioViewProps {
  sections: Section[];
  focusSectionIds: string[] | null;
  rubyMode: RubyMode;
  fontSize: FontSize;
  speechRate: number;
  shadowingPauseSec: number;
  isTtsSupported: boolean;
  isPlaying: boolean;
  isPausedBetween: boolean;
  playingPhraseId: string | null;
  loop: boolean;
  onChangeSpeechRate: (rate: number) => void;
  onChangeShadowingPause: (sec: number) => void;
  onToggleLoop: (loop: boolean) => void;
  onPlayPhrases: (phrases: Phrase[]) => void;
  onStopAudio: () => void;
  onMarkPhraseStatus: (phraseId: string, status: MasteryStatus) => void;
}

export function AudioView({
  sections,
  focusSectionIds,
  rubyMode,
  fontSize,
  speechRate,
  shadowingPauseSec,
  isTtsSupported,
  isPlaying,
  isPausedBetween,
  playingPhraseId,
  loop,
  onChangeSpeechRate,
  onChangeShadowingPause,
  onToggleLoop,
  onPlayPhrases,
  onStopAudio,
  onMarkPhraseStatus,
}: AudioViewProps) {
  const [subMode, setSubMode] = useState<'listen' | 'recite'>('listen');
  const [selectedScope, setSelectedScope] = useState<string>(() =>
    focusSectionIds && focusSectionIds.length === 1 ? focusSectionIds[0] : 'all'
  );
  const [recitePhraseIdx, setRecitePhraseIdx] = useState(0);
  const [hideReciteText, setHideReciteText] = useState(true);

  const rec = useSpeechRecognition();

  const activePhrases = useMemo(() => {
    if (selectedScope === 'all') {
      return sections.flatMap((s) => s.phrases);
    }
    const sec = sections.find((s) => s.id === selectedScope);
    return sec ? sec.phrases : sections.flatMap((s) => s.phrases);
  }, [sections, selectedScope]);

  const safeReciteIdx = Math.min(recitePhraseIdx, Math.max(0, activePhrases.length - 1));
  const currentRecitePhrase = activePhrases[safeReciteIdx];

  const comparison = useMemo(() => {
    if (!currentRecitePhrase) return null;
    const expectedKana = getPhraseKanaText(currentRecitePhrase, 'modern');
    const expectedKanji = getPhrasePlainText(currentRecitePhrase);
    return compareRecitation(expectedKana, expectedKanji, rec.combinedTranscript);
  }, [currentRecitePhrase, rec.combinedTranscript]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <div className="seg-group">
          <button
            type="button"
            className={`seg-btn ${subMode === 'listen' ? 'active' : ''}`}
            onClick={() => setSubMode('listen')}
          >
            聞き流し・シャドーイング
          </button>
          <button
            type="button"
            className={`seg-btn ${subMode === 'recite' ? 'active' : ''}`}
            onClick={() => setSubMode('recite')}
          >
            マイク暗唱チェック
          </button>
        </div>

        <select
          className="select-input"
          value={selectedScope}
          onChange={(e) => {
            setSelectedScope(e.target.value);
            setRecitePhraseIdx(0);
            rec.reset();
          }}
        >
          <option value="all">全段通し</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.title}
            </option>
          ))}
        </select>
      </div>

      {subMode === 'listen' ? (
        <div className="card">
          <h2 className="section-heading">音声読み上げ・シャドーイング</h2>
          <p className="muted" style={{ marginBottom: 14 }}>
            各フレーズごとにポーズ（間隔）を挟んで再生します。移動中の聞き流しや、後に続いて声に出す練習に使えます。
          </p>

          {!isTtsSupported && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--shu-soft)',
                color: 'var(--shu)',
                marginBottom: 14,
                fontSize: 13.5,
              }}
            >
              お使いのブラウザは音声読み上げ（SpeechSynthesis）に対応していません。
            </div>
          )}

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13.5 }}>
              再生速度：<strong>{speechRate.toFixed(1)}x</strong>
              <input
                type="range"
                min={0.6}
                max={1.3}
                step={0.1}
                value={speechRate}
                onChange={(e) => onChangeSpeechRate(parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
            <label style={{ fontSize: 13.5 }}>
              句ごとの間隔（シャドーイング待機）：<strong>{shadowingPauseSec.toFixed(1)}秒</strong>
              <input
                type="range"
                min={0}
                max={3}
                step={0.5}
                value={shadowingPauseSec}
                onChange={(e) => onChangeShadowingPause(parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: 6 }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            {isPlaying ? (
              <button type="button" className="btn btn-primary" onClick={onStopAudio}>
                <Square size={16} />
                <span>停止する</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isTtsSupported}
                onClick={() => onPlayPhrases(activePhrases)}
              >
                <Play size={16} />
                <span>再生開始（{activePhrases.length}句）</span>
              </button>
            )}

            <button
              type="button"
              className="btn"
              style={{
                borderColor: loop ? 'var(--ai)' : undefined,
                background: loop ? 'var(--ai-soft)' : undefined,
                color: loop ? 'var(--ai)' : undefined,
              }}
              onClick={() => onToggleLoop(!loop)}
            >
              <Repeat size={16} />
              <span>{loop ? 'リピート再生 ON' : 'リピート再生 OFF'}</span>
            </button>

            {isPausedBetween && (
              <span className="pill-badge matsu">シャドーイング待機中… 声に出してみましょう</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activePhrases.map((phrase, idx) => {
              const active = playingPhraseId === phrase.id;
              return (
                <div
                  key={phrase.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1px solid ${active ? 'var(--shu)' : 'var(--border)'}`,
                    background: active ? 'var(--shu-soft)' : 'var(--bg-elevated)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <RubyText
                      tokens={phrase.tokens}
                      rubyMode={rubyMode}
                      fontSize={fontSize}
                    />
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                      {phrase.translation}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onPlayPhrases(activePhrases.slice(idx))}
                    title="この句から再生"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <h2 className="section-heading" style={{ margin: 0 }}>
                マイク暗唱チェック
              </h2>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                本文を隠して声に出し、認識結果との一致率をチェックします（{safeReciteIdx + 1} /{' '}
                {activePhrases.length}句）。
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setHideReciteText((v) => !v)}
              >
                {hideReciteText ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{hideReciteText ? '本文を表示' : '本文を隠す'}</span>
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={safeReciteIdx === 0}
                onClick={() => {
                  rec.reset();
                  setRecitePhraseIdx((i) => Math.max(0, i - 1));
                }}
              >
                前の句
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={safeReciteIdx + 1 >= activePhrases.length}
                onClick={() => {
                  rec.reset();
                  setRecitePhraseIdx((i) => Math.min(activePhrases.length - 1, i + 1));
                }}
              >
                次の句
              </button>
            </div>
          </div>

          {!rec.isSupported && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--kin-soft)',
                marginBottom: 14,
                fontSize: 13.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={18} />
              <span>
                このブラウザは Web Speech API の音声認識に非対応です。Chrome / Edge / iOS Safari などをご利用いただくか、「模擬試験」タブの自己採点暗唱をご活用ください。
              </span>
            </div>
          )}

          {currentRecitePhrase && (
            <>
              <div
                style={{
                  padding: '18px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  marginBottom: 14,
                }}
              >
                {hideReciteText ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--shu)', marginBottom: 6 }}>
                      暗唱中（本文非表示）
                    </div>
                    <div className="muted">
                      意味ガイド：{currentRecitePhrase.translation}
                    </div>
                  </div>
                ) : (
                  <RubyText
                    tokens={currentRecitePhrase.tokens}
                    rubyMode={rubyMode}
                    fontSize={fontSize}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {rec.isListening ? (
                  <button type="button" className="btn btn-primary" onClick={rec.stop}>
                    <MicOff size={16} />
                    <span>録音を止める</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ai"
                    disabled={!rec.isSupported}
                    onClick={rec.start}
                  >
                    <Mic size={16} />
                    <span>マイクで暗唱スタート</span>
                  </button>
                )}

                <button type="button" className="btn" onClick={rec.reset}>
                  <RotateCcw size={15} />
                  <span>やり直す</span>
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => onPlayPhrases([currentRecitePhrase])}
                >
                  <Volume2 size={15} />
                  <span>お手本を聞く</span>
                </button>
              </div>

              {rec.error && (
                <div style={{ color: 'var(--shu)', fontSize: 13.5, marginBottom: 10 }}>
                  {rec.error}
                </div>
              )}

              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--bg-subtle)',
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                  音声認識されたテキスト：
                </div>
                <div style={{ minHeight: 28, fontSize: 15 }}>
                  {rec.combinedTranscript || (
                    <span className="muted">ここに読み上げた内容が表示されます…</span>
                  )}
                </div>

                {comparison && rec.combinedTranscript.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-strong)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span
                        className={`pill-badge ${
                          comparison.score >= 80 ? 'matsu' : 'shu'
                        }`}
                      >
                        一致率：{comparison.score}%
                      </span>
                      {comparison.score < 80 && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ color: 'var(--shu)', borderColor: 'var(--shu)' }}
                          onClick={() => onMarkPhraseStatus(currentRecitePhrase.id, 'shaky')}
                        >
                          苦手フレーズに登録する
                        </button>
                      )}
                      {comparison.score >= 80 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-matsu"
                          onClick={() => onMarkPhraseStatus(currentRecitePhrase.id, 'mastered')}
                        >
                          覚えた！に記録
                        </button>
                      )}
                    </div>
                    <div style={{ lineHeight: 2, fontSize: 15 }}>
                      {comparison.segments.map((seg, i) => (
                        <span
                          key={i}
                          className={`char-match ${seg.matched ? 'ok' : 'miss'}`}
                        >
                          {seg.char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
