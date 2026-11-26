import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Eye,
  EyeOff,
  PenTool,
  RotateCcw,
  Undo2,
  Volume2,
} from 'lucide-react';
import type { FontSize, MasteryStatus, Phrase, PhraseProgress, RubyMode, Section } from '../types.ts';
import {
  compareWrittenText,
  isKanjiAnswerMatch,
  type WrittenComparisonResult,
} from '../utils/kanaCompare.ts';
import { getPhraseKanaText, getPhrasePlainText, isPunctuationToken } from '../utils/rubyParser.ts';
import { RubyText } from './RubyText.tsx';

interface WriteViewProps {
  sections: Section[];
  progress: Record<string, PhraseProgress>;
  rubyMode: RubyMode;
  fontSize: FontSize;
  onGradePhrase: (phraseId: string, status: MasteryStatus) => void;
  onPlayPhrase: (phrase: Phrase) => void;
}

type WriteMode = 'key-kanji' | 'full-dictation' | 'handwriting';

export function WriteView({
  sections,
  progress,
  rubyMode,
  fontSize,
  onGradePhrase,
  onPlayPhrase,
}: WriteViewProps) {
  const [scope, setScope] = useState<string>('all');
  const [mode, setMode] = useState<WriteMode>('key-kanji');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mode 1: Key-kanji inline fill-in
  const [blankInputs, setBlankInputs] = useState<Record<number, string>>({});
  const [blankGraded, setBlankGraded] = useState(false);
  const [showRubyCueInBlanks, setShowRubyCueInBlanks] = useState(true);

  // Mode 2: Full phrase dictation / 書き下し
  const [fullInput, setFullInput] = useState('');
  const [fullResult, setFullResult] = useState<WrittenComparisonResult | null>(null);
  const [showTranslationCue, setShowTranslationCue] = useState(true);
  const [showKanaCue, setShowKanaCue] = useState(false);
  const [ignorePunct, setIgnorePunct] = useState(true);
  const [tolerateVariants, setTolerateVariants] = useState(true);

  // Mode 3: Handwriting Canvas (IME-free)
  const [hwCue, setHwCue] = useState<'kana' | 'translation' | 'none'>('kana');
  const [hwRevealed, setHwRevealed] = useState(false);
  const [penSize, setPenSize] = useState<number>(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);

  const targetPhrases = useMemo(() => {
    const allItems = sections.flatMap((section) =>
      section.phrases.map((phrase) => ({ section, phrase }))
    );
    if (scope === 'weak') {
      return allItems.filter((item) => {
        const p = progress[item.phrase.id];
        return p?.status === 'shaky' || p?.isWeakBookmarked;
      });
    }
    if (scope !== 'all') {
      return allItems.filter((item) => item.section.id === scope);
    }
    return allItems;
  }, [sections, scope, progress]);

  const safeIdx = Math.min(currentIndex, Math.max(0, targetPhrases.length - 1));
  const currentItem = targetPhrases[safeIdx];

  const resetInputsForPhrase = useCallback(() => {
    setBlankInputs({});
    setBlankGraded(false);
    setFullInput('');
    setFullResult(null);
    setShowKanaCue(false);
    setHwRevealed(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      historyRef.current = [];
    }
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    resetInputsForPhrase();
  }, [scope, mode, resetInputsForPhrase]);

  const goPrev = () => {
    if (safeIdx > 0) {
      setCurrentIndex(safeIdx - 1);
      resetInputsForPhrase();
    }
  };

  const goNext = () => {
    if (safeIdx + 1 < targetPhrases.length) {
      setCurrentIndex(safeIdx + 1);
      resetInputsForPhrase();
    }
  };

  const handleRecordAndNext = (status: MasteryStatus) => {
    if (!currentItem) return;
    onGradePhrase(currentItem.phrase.id, status);
    if (safeIdx + 1 < targetPhrases.length) {
      setCurrentIndex(safeIdx + 1);
      resetInputsForPhrase();
    }
  };

  // Mode 1: Blank token indices
  const keyIndices = useMemo(() => {
    if (!currentItem) return [];
    const list: number[] = [];
    currentItem.phrase.tokens.forEach((tok, idx) => {
      if (!isPunctuationToken(tok) && tok.isKey) list.push(idx);
    });
    if (list.length === 0) {
      // Fallback: pick kanji tokens with ruby
      currentItem.phrase.tokens.forEach((tok, idx) => {
        if (!isPunctuationToken(tok) && tok.ruby) list.push(idx);
      });
    }
    return list;
  }, [currentItem]);

  const blankSummary = useMemo(() => {
    if (!currentItem || !blankGraded) return null;
    let correct = 0;
    for (const idx of keyIndices) {
      const tok = currentItem.phrase.tokens[idx];
      if (isKanjiAnswerMatch(tok.text, blankInputs[idx] ?? '', tolerateVariants)) {
        correct++;
      }
    }
    const pct = keyIndices.length > 0 ? Math.round((correct / keyIndices.length) * 100) : 100;
    return { correct, total: keyIndices.length, pct };
  }, [currentItem, blankGraded, keyIndices, blankInputs, tolerateVariants]);

  // Mode 3: Canvas drawing handlers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 40) historyRef.current.shift();

    const pt = getCanvasPoint(e);
    ctx.strokeStyle =
      document.documentElement.getAttribute('data-theme') === 'sumi' ? '#ede8dc' : '#1e1c1a';
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    drawingRef.current = true;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  const handleCanvasUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const last = historyRef.current.pop();
    if (ctx && last) {
      ctx.putImageData(last, 0, 0);
    }
  };

  const handleCanvasClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <select
          className="select-input"
          aria-label="出題範囲"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">全段すべて</option>
          <option value="weak">苦手フレーズのみ</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.title}
            </option>
          ))}
        </select>

        <div className="seg-group" aria-label="書き下しテスト形式">
          <button
            type="button"
            className={`seg-btn ${mode === 'key-kanji' ? 'active' : ''}`}
            onClick={() => setMode('key-kanji')}
          >
            漢字穴埋め記述
          </button>
          <button
            type="button"
            className={`seg-btn ${mode === 'full-dictation' ? 'active' : ''}`}
            onClick={() => setMode('full-dictation')}
          >
            1句まるごと入力
          </button>
          <button
            type="button"
            className={`seg-btn ${mode === 'handwriting' ? 'active' : ''}`}
            onClick={() => setMode('handwriting')}
          >
            手書きパッド（筆記対策）
          </button>
        </div>
      </div>

      {targetPhrases.length === 0 || !currentItem ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontWeight: 600, marginBottom: 10 }}>対象の苦手フレーズがありません</p>
          <button type="button" className="btn btn-primary" onClick={() => setScope('all')}>
            全段で練習する
          </button>
        </div>
      ) : (
        <div className="card">
          {/* Header & Pager */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill-badge shu">{currentItem.section.title}</span>
              <span className="pill-badge">
                {safeIdx + 1} / {targetPhrases.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onPlayPhrase(currentItem.phrase)}
              >
                <Volume2 size={15} />
                <span>音声を聴く</span>
              </button>
              <button type="button" className="btn btn-sm" onClick={goPrev} disabled={safeIdx === 0}>
                <ChevronLeft size={16} />
                <span>前へ</span>
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={goNext}
                disabled={safeIdx + 1 >= targetPhrases.length}
              >
                <span>次へ</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div
              className="progress-fill"
              style={{ width: `${Math.round(((safeIdx + 1) / targetPhrases.length) * 100)}%` }}
            />
          </div>

          {/* MODE 1: KEY KANJI FILL-IN */}
          {mode === 'key-kanji' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span className="muted">
                  空欄に当てはまる漢字を入力して「採点する」を押してください。
                </span>
                <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <input
                      type="checkbox"
                      checked={showRubyCueInBlanks}
                      onChange={(e) => setShowRubyCueInBlanks(e.target.checked)}
                    />
                    <span>ふりがなヒント</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <input
                      type="checkbox"
                      checked={tolerateVariants}
                      onChange={(e) => setTolerateVariants(e.target.checked)}
                    />
                    <span>旧字体許容</span>
                  </label>
                </div>
              </div>

              <div
                className={`norito-text size-${fontSize}`}
                style={{
                  padding: '20px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  lineHeight: 2.6,
                  marginBottom: 14,
                }}
              >
                {currentItem.phrase.tokens.map((tok, idx) => {
                  const isBlank = keyIndices.includes(idx);
                  if (!isBlank) {
                    return <span key={idx}>{tok.text}</span>;
                  }
                  const val = blankInputs[idx] ?? '';
                  const isCorrect =
                    blankGraded && isKanjiAnswerMatch(tok.text, val, tolerateVariants);
                  const isWrong = blankGraded && !isCorrect;
                  const widthCh = Math.max(3.5, Array.from(tok.text).length * 1.65);

                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        verticalAlign: 'middle',
                        margin: '0 3px',
                      }}
                    >
                      {showRubyCueInBlanks && tok.ruby && (
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 11,
                            lineHeight: 1.1,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {tok.ruby}
                        </span>
                      )}
                      <input
                        type="text"
                        className={`write-inline-input ${
                          isCorrect ? 'correct' : isWrong ? 'wrong' : ''
                        }`}
                        style={{ width: `${widthCh}em` }}
                        value={val}
                        onChange={(e) => {
                          setBlankGraded(false);
                          setBlankInputs((prev) => ({ ...prev, [idx]: e.target.value }));
                        }}
                        aria-label={tok.ruby ? `${tok.ruby}の漢字` : '漢字入力'}
                      />
                      {isWrong && (
                        <span
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: 'var(--shu)',
                            lineHeight: 1.2,
                          }}
                        >
                          正: {tok.text}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              <div className="muted" style={{ marginBottom: 14 }}>
                意味：{currentItem.phrase.translation}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setBlankGraded(true)}
                >
                  <CheckCircle2 size={16} />
                  <span>採点する</span>
                </button>
                <button type="button" className="btn" onClick={resetInputsForPhrase}>
                  <RotateCcw size={15} />
                  <span>クリア</span>
                </button>

                {blankSummary && (
                  <span
                    className={`pill-badge ${blankSummary.pct === 100 ? 'matsu' : 'shu'}`}
                  >
                    結果：{blankSummary.correct} / {blankSummary.total} 問正解（{blankSummary.pct}%）
                  </span>
                )}
              </div>

              {blankSummary && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    style={{ borderColor: 'var(--shu)', color: 'var(--shu)' }}
                    onClick={() => handleRecordAndNext('shaky')}
                  >
                    苦手に登録して次へ
                  </button>
                  <button
                    type="button"
                    className="btn btn-matsu"
                    onClick={() => handleRecordAndNext('mastered')}
                  >
                    書けた！覚えた！次へ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: FULL PHRASE DICTATION / 書き下し */}
          {mode === 'full-dictation' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowTranslationCue((v) => !v)}
                >
                  {showTranslationCue ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showTranslationCue ? '現代語訳ヒント ON' : '現代語訳ヒント OFF'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowKanaCue((v) => !v)}
                >
                  {showKanaCue ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showKanaCue ? 'ふりがな表示 ON' : 'ふりがなだけ見る'}</span>
                </button>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
                  <input
                    type="checkbox"
                    checked={ignorePunct}
                    onChange={(e) => setIgnorePunct(e.target.checked)}
                  />
                  <span>句読点を無視</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
                  <input
                    type="checkbox"
                    checked={tolerateVariants}
                    onChange={(e) => setTolerateVariants(e.target.checked)}
                  />
                  <span>旧字体許容</span>
                </label>
              </div>

              {(showTranslationCue || showKanaCue) && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-subtle)',
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                >
                  {showKanaCue && (
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 17,
                        marginBottom: showTranslationCue ? 6 : 0,
                      }}
                    >
                      <strong>読み：</strong>
                      {getPhraseKanaText(currentItem.phrase, 'historical')}
                    </div>
                  )}
                  {showTranslationCue && (
                    <div className="muted">
                      <strong>現代語訳：</strong>
                      {currentItem.phrase.translation}
                    </div>
                  )}
                </div>
              )}

              <textarea
                className="text-input"
                rows={3}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 18,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
                placeholder="ここに書き下し文を入力してください（音声を聴いてディクテーションもできます）"
                value={fullInput}
                onChange={(e) => {
                  setFullInput(e.target.value);
                  setFullResult(null);
                }}
              />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!fullInput.trim()}
                  onClick={() =>
                    setFullResult(
                      compareWrittenText(
                        getPhrasePlainText(currentItem.phrase),
                        fullInput,
                        { ignorePunctuation: ignorePunct, tolerateVariants }
                      )
                    )
                  }
                >
                  <CheckCircle2 size={16} />
                  <span>採点して答え合わせ</span>
                </button>
                <button type="button" className="btn" onClick={resetInputsForPhrase}>
                  <RotateCcw size={15} />
                  <span>クリア</span>
                </button>
              </div>

              {fullResult && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className={`pill-badge ${fullResult.score >= 85 ? 'matsu' : 'shu'}`}>
                      一致率：{fullResult.score}% {fullResult.isExact ? '（完全一致！）' : ''}
                    </span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      正解の書き下し文（赤＝抜け・誤字）：
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, lineHeight: 1.9 }}>
                      {fullResult.expectedDiff.map((d, i) => (
                        <span key={i} className={`char-match ${d.matched ? 'ok' : 'miss'}`}>
                          {d.char}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      あなたの入力（取消線＝余分・誤字）：
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.8 }}>
                      {fullResult.actualDiff.map((d, i) => (
                        <span
                          key={i}
                          style={
                            d.extra
                              ? {
                                  color: 'var(--shu)',
                                  textDecoration: 'line-through',
                                  fontWeight: 700,
                                }
                              : undefined
                          }
                        >
                          {d.char}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ borderColor: 'var(--shu)', color: 'var(--shu)' }}
                      onClick={() => handleRecordAndNext('shaky')}
                    >
                      苦手・もう一度
                    </button>
                    <button
                      type="button"
                      className="btn btn-matsu"
                      onClick={() => handleRecordAndNext('mastered')}
                    >
                      書けた！覚えた！次へ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: IME-FREE HANDWRITING PAD */}
          {mode === 'handwriting' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div className="seg-group" aria-label="手がかり表示">
                  <button
                    type="button"
                    className={`seg-btn ${hwCue === 'kana' ? 'active' : ''}`}
                    onClick={() => setHwCue('kana')}
                  >
                    ふりがなを手がかり
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${hwCue === 'translation' ? 'active' : ''}`}
                    onClick={() => setHwCue('translation')}
                  >
                    現代語訳のみ
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${hwCue === 'none' ? 'active' : ''}`}
                    onClick={() => setHwCue('none')}
                  >
                    音声のみ
                  </button>
                </div>

                <div className="seg-group" aria-label="ペンの太さ">
                  {[2, 4, 7].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`seg-btn ${penSize === sz ? 'active' : ''}`}
                      onClick={() => setPenSize(sz)}
                    >
                      {sz === 2 ? '細' : sz === 4 ? '中' : '太'}
                    </button>
                  ))}
                </div>
              </div>

              {hwCue !== 'none' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-subtle)',
                    marginBottom: 12,
                  }}
                >
                  {hwCue === 'kana' ? (
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>
                      {getPhraseKanaText(currentItem.phrase, 'historical')}
                    </div>
                  ) : (
                    <div className="muted">{currentItem.phrase.translation}</div>
                  )}
                </div>
              )}

              <div className="handwrite-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  width={840}
                  height={320}
                  className="handwrite-canvas"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
                <div className="handwrite-watermark">
                  <PenTool size={13} /> 漢字変換なしで指・ペン・マウスで書き取り練習
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <button type="button" className="btn btn-sm" onClick={handleCanvasUndo}>
                  <Undo2 size={14} />
                  <span>1画戻す</span>
                </button>
                <button type="button" className="btn btn-sm" onClick={handleCanvasClear}>
                  <Eraser size={14} />
                  <span>全消し</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setHwRevealed((v) => !v)}
                >
                  {hwRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>{hwRevealed ? 'お手本を隠す' : 'お手本を表示して自己採点'}</span>
                </button>
              </div>

              {hwRevealed && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '16px',
                    borderRadius: 10,
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--shu)' }}>
                    お手本（書き下し文）：
                  </div>
                  <RubyText
                    tokens={currentItem.phrase.tokens}
                    rubyMode={rubyMode}
                    fontSize="lg"
                  />
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button
                      type="button"
                      className="btn"
                      style={{ borderColor: 'var(--shu)', color: 'var(--shu)' }}
                      onClick={() => handleRecordAndNext('shaky')}
                    >
                      書けなかった（× 苦手登録）
                    </button>
                    <button
                      type="button"
                      className="btn btn-matsu"
                      onClick={() => handleRecordAndNext('mastered')}
                    >
                      <CheckCircle2 size={16} />
                      <span>書けた！（○ 次へ）</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
