import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Drum,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Square,
  Volume2,
} from 'lucide-react';
import {
  AUDIO_CREDIT,
  AUDIO_MARKERS,
  PHRASE_AUDIO_TIMESTAMPS,
} from '../data/audioTimestamps.ts';
import type { LoopRange } from '../hooks/useAudioTrack.ts';
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
  isTtsPlaying: boolean;
  isTtsPausedBetween: boolean;
  ttsPlayingPhraseId: string | null;
  ttsLoop: boolean;
  realAudio: {
    isPlaying: boolean;
    hasStarted: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    activePhraseId: string | null;
    loopRange: LoopRange | null;
    error: string | null;
    playFull: (skipDrum?: boolean) => void;
    playRange: (start: number, end: number, options?: { loop?: boolean; label?: string }) => void;
    playPhrase: (phraseId: string, loop?: boolean) => boolean;
    playSection: (section: Section, loop?: boolean) => boolean;
    togglePlayPause: () => void;
    stop: () => void;
    seek: (sec: number) => void;
    skipBy: (deltaSec: number) => void;
    setPlaybackRate: (rate: number) => void;
    clearLoop: () => void;
  };
  onChangeSpeechRate: (rate: number) => void;
  onChangeShadowingPause: (sec: number) => void;
  onToggleTtsLoop: (loop: boolean) => void;
  onPlayTtsPhrases: (phrases: Phrase[]) => void;
  onStopTts: () => void;
  onPlaySamplePhrase: (phrase: Phrase) => void;
  onMarkPhraseStatus: (phraseId: string, status: MasteryStatus) => void;
}

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.15, 1.25];

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function AudioView({
  sections,
  focusSectionIds,
  rubyMode,
  fontSize,
  speechRate,
  shadowingPauseSec,
  isTtsSupported,
  isTtsPlaying,
  isTtsPausedBetween,
  ttsPlayingPhraseId,
  ttsLoop,
  realAudio,
  onChangeSpeechRate,
  onChangeShadowingPause,
  onToggleTtsLoop,
  onPlayTtsPhrases,
  onStopTts,
  onPlaySamplePhrase,
  onMarkPhraseStatus,
}: AudioViewProps) {
  const [subMode, setSubMode] = useState<'real' | 'recite' | 'tts'>('real');
  const [selectedScope, setSelectedScope] = useState<string>(() =>
    focusSectionIds && focusSectionIds.length === 1 ? focusSectionIds[0] : 'all'
  );
  const [recitePhraseIdx, setRecitePhraseIdx] = useState(0);
  const [hideReciteText, setHideReciteText] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  const phraseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rec = useSpeechRecognition();

  useEffect(() => {
    if (subMode !== 'real' || !autoScroll || !realAudio.activePhraseId) return;
    const el = phraseRefs.current[realAudio.activePhraseId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [subMode, autoScroll, realAudio.activePhraseId]);

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
            className={`seg-btn ${subMode === 'real' ? 'active' : ''}`}
            onClick={() => setSubMode('real')}
          >
            お手本奉唱（実音源）
          </button>
          <button
            type="button"
            className={`seg-btn ${subMode === 'recite' ? 'active' : ''}`}
            onClick={() => setSubMode('recite')}
          >
            マイク暗唱チェック
          </button>
          <button
            type="button"
            className={`seg-btn ${subMode === 'tts' ? 'active' : ''}`}
            onClick={() => setSubMode('tts')}
          >
            TTSシャドーイング
          </button>
        </div>

        {subMode !== 'real' && (
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
        )}
      </div>

      {subMode === 'real' ? (
        <>
          {/* Real Recording Controller Card */}
          <div className="card" style={{ borderLeft: '4px solid var(--shu)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 10,
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span className="pill-badge shu">本物の神職奉唱音源</span>
                  <span className="pill-badge">全 {formatClock(realAudio.duration)}</span>
                </div>
                <h2 className="section-heading" style={{ margin: 0 }}>
                  {AUDIO_CREDIT}
                </h2>
              </div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                <span>再生位置に自動追従</span>
              </label>
            </div>

            {realAudio.error && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: 'var(--shu-soft)',
                  color: 'var(--shu)',
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                {realAudio.error}
              </div>
            )}

            {/* Quick Start Buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onStopTts();
                  realAudio.playFull(true);
                }}
              >
                <Play size={16} />
                <span>高天原〜冒頭から再生（0:31〜）</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onStopTts();
                  realAudio.playFull(false);
                }}
              >
                <Drum size={16} />
                <span>太鼓から通して聴く（0:00〜）</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onStopTts();
                  realAudio.playRange(AUDIO_MARKERS.chantStart, AUDIO_MARKERS.zenEnd, {
                    loop: false,
                  });
                }}
              >
                <span>前段のみ（第1〜5段）</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onStopTts();
                  realAudio.playRange(AUDIO_MARKERS.kouStart, AUDIO_MARKERS.chantEnd, {
                    loop: false,
                  });
                }}
              >
                <span>後段のみ（第6〜10段）</span>
              </button>
            </div>

            {/* Seek & Transport */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--bg-subtle)',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, minWidth: 38 }}>
                  {formatClock(realAudio.currentTime)}
                </span>
                <input
                  type="range"
                  className="audio-seek"
                  min={0}
                  max={realAudio.duration || 377}
                  step={0.5}
                  value={realAudio.currentTime}
                  onChange={(e) => realAudio.seek(parseFloat(e.target.value))}
                  aria-label="再生位置シークバー"
                />
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)', minWidth: 38 }}>
                  {formatClock(realAudio.duration)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ai"
                    onClick={() => {
                      onStopTts();
                      realAudio.togglePlayPause();
                    }}
                  >
                    {realAudio.isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    <span>{realAudio.isPlaying ? '一時停止' : '再生'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => realAudio.skipBy(-5)}
                  >
                    <RotateCcw size={14} />
                    <span>-5秒</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => realAudio.skipBy(5)}
                  >
                    <RotateCw size={14} />
                    <span>+5秒</span>
                  </button>
                  {realAudio.hasStarted && (
                    <button type="button" className="btn btn-sm" onClick={realAudio.stop}>
                      <Square size={14} />
                      <span>停止</span>
                    </button>
                  )}
                </div>

                <div className="seg-group" aria-label="再生速度">
                  {SPEED_OPTIONS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`seg-btn ${realAudio.playbackRate === spd ? 'active' : ''}`}
                      onClick={() => realAudio.setPlaybackRate(spd)}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {realAudio.loopRange && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'var(--ai-soft)',
                  color: 'var(--ai)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span>
                  <Repeat size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  リピート再生中：{realAudio.loopRange.label}
                </span>
                <button type="button" className="btn btn-sm" onClick={realAudio.clearLoop}>
                  ループ解除
                </button>
              </div>
            )}
          </div>

          {/* Synchronized Section & Phrase List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sections.map((sec) => {
              const hasRealAudio = sec.phrases.some((p) => Boolean(PHRASE_AUDIO_TIMESTAMPS[p.id]));
              return (
                <div key={sec.id} className="card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      paddingBottom: 10,
                      borderBottom: '1px solid var(--border)',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <span className="pill-badge shu" style={{ marginRight: 8 }}>
                        {sec.part}
                      </span>
                      <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 16 }}>
                        {sec.title}
                      </strong>
                    </div>

                    {hasRealAudio && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            onStopTts();
                            realAudio.playSection(sec, false);
                          }}
                        >
                          <Play size={14} />
                          <span>この段を再生</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            borderColor:
                              realAudio.loopRange?.label === sec.title ? 'var(--ai)' : undefined,
                            color: realAudio.loopRange?.label === sec.title ? 'var(--ai)' : undefined,
                          }}
                          onClick={() => {
                            onStopTts();
                            realAudio.playSection(sec, true);
                          }}
                        >
                          <Repeat size={14} />
                          <span>この段をリピート</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.phrases.map((phrase) => {
                      const ts = PHRASE_AUDIO_TIMESTAMPS[phrase.id];
                      const active = realAudio.activePhraseId === phrase.id;

                      return (
                        <div
                          key={phrase.id}
                          ref={(el) => {
                            phraseRefs.current[phrase.id] = el;
                          }}
                          onClick={() => {
                            if (ts) {
                              onStopTts();
                              realAudio.playPhrase(phrase.id, false);
                            }
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: `1.5px solid ${active ? 'var(--shu)' : 'var(--border)'}`,
                            background: active ? 'var(--shu-soft)' : 'var(--bg-elevated)',
                            cursor: ts ? 'pointer' : 'default',
                            transition: 'background 0.15s ease, border-color 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 10,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <RubyText
                                tokens={phrase.tokens}
                                rubyMode={rubyMode}
                                fontSize={fontSize}
                              />
                              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
                                {phrase.translation}
                              </div>
                            </div>
                            {ts && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: 4,
                                  flexShrink: 0,
                                }}
                              >
                                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                                  {formatClock(ts.start)}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  title="この句だけリピート"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStopTts();
                                    realAudio.playPhrase(phrase.id, true);
                                  }}
                                >
                                  <Repeat size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : subMode === 'tts' ? (
        <div className="card">
          <h2 className="section-heading">TTSシャドーイング（句ごとポーズ付き）</h2>
          <p className="muted" style={{ marginBottom: 14 }}>
            端末の音声合成で各フレーズごとに間隔を空けて読み上げます。ゆっくり後に続いて声に出す練習に便利です。
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
              お使いのブラウザは音声合成（SpeechSynthesis）に対応していません。
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
            {isTtsPlaying ? (
              <button type="button" className="btn btn-primary" onClick={onStopTts}>
                <Square size={16} />
                <span>停止する</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isTtsSupported}
                onClick={() => {
                  realAudio.stop();
                  onPlayTtsPhrases(activePhrases);
                }}
              >
                <Play size={16} />
                <span>再生開始（{activePhrases.length}句）</span>
              </button>
            )}

            <button
              type="button"
              className="btn"
              style={{
                borderColor: ttsLoop ? 'var(--ai)' : undefined,
                background: ttsLoop ? 'var(--ai-soft)' : undefined,
                color: ttsLoop ? 'var(--ai)' : undefined,
              }}
              onClick={() => onToggleTtsLoop(!ttsLoop)}
            >
              <Repeat size={16} />
              <span>{ttsLoop ? 'リピート再生 ON' : 'リピート再生 OFF'}</span>
            </button>

            {isTtsPausedBetween && (
              <span className="pill-badge matsu">シャドーイング待機中… 声に出してみましょう</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activePhrases.map((phrase, idx) => {
              const active = ttsPlayingPhraseId === phrase.id;
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
                    onClick={() => {
                      realAudio.stop();
                      onPlayTtsPhrases(activePhrases.slice(idx));
                    }}
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
                  onClick={() => onPlaySamplePhrase(currentRecitePhrase)}
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
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px dashed var(--border-strong)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span
                        className={`pill-badge ${comparison.score >= 80 ? 'matsu' : 'shu'}`}
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
