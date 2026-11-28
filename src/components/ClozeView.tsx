import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import type {
  ClozeLevel,
  FontSize,
  MasteryStatus,
  Phrase,
  PhraseProgress,
  RubyMode,
  Section,
  WritingMode,
} from '../types.ts';
import { RubyText } from './RubyText.tsx';

interface ClozeViewProps {
  sections: Section[];
  focusSectionIds: string[] | null;
  onlyWeakDefault: boolean;
  progress: Record<string, PhraseProgress>;
  rubyMode: RubyMode;
  writingMode: WritingMode;
  fontSize: FontSize;
  onChangeRubyMode: (mode: RubyMode) => void;
  onChangeWritingMode: (mode: WritingMode) => void;
  onGradePhrase: (phraseId: string, status: MasteryStatus) => void;
  onPlayPhrase: (phrase: Phrase) => void;
}

const LEVEL_LABELS: Record<ClozeLevel, string> = {
  1: 'Lv.1 重要語',
  2: 'Lv.2 半分隠し',
  3: 'Lv.3 頭文字のみ',
  4: 'Lv.4 全隠し',
};

export function ClozeView({
  sections,
  focusSectionIds,
  onlyWeakDefault,
  progress,
  rubyMode,
  writingMode,
  fontSize,
  onChangeRubyMode,
  onChangeWritingMode,
  onGradePhrase,
  onPlayPhrase,
}: ClozeViewProps) {
  const [scope, setScope] = useState<string>(() => {
    if (onlyWeakDefault) return 'weak';
    if (focusSectionIds && focusSectionIds.length > 0) return 'plan';
    return 'all';
  });
  const [level, setLevel] = useState<ClozeLevel>(1);
  const [viewLayout, setViewLayout] = useState<'card' | 'list'>('card');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedTokens, setRevealedTokens] = useState<Set<number>>(new Set());
  const [revealAll, setRevealAll] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (onlyWeakDefault) setScope('weak');
    else if (focusSectionIds && focusSectionIds.length > 0) setScope('plan');
  }, [focusSectionIds, onlyWeakDefault]);

  const targetPhrases = useMemo(() => {
    const allItems: Array<{ section: Section; phrase: Phrase }> = [];
    for (const sec of sections) {
      for (const phrase of sec.phrases) {
        allItems.push({ section: sec, phrase });
      }
    }

    if (scope === 'weak') {
      return allItems.filter((item) => {
        const p = progress[item.phrase.id];
        return p?.status === 'shaky' || p?.isWeakBookmarked;
      });
    }
    if (scope === 'plan' && focusSectionIds && focusSectionIds.length > 0) {
      return allItems.filter((item) => focusSectionIds.includes(item.section.id));
    }
    if (scope !== 'all' && scope !== 'plan') {
      return allItems.filter((item) => item.section.id === scope);
    }
    return allItems;
  }, [sections, scope, focusSectionIds, progress]);

  useEffect(() => {
    setCurrentIndex(0);
    setRevealedTokens(new Set());
    setRevealAll(false);
    setShowHint(false);
  }, [scope, level]);

  const safeIndex = Math.min(currentIndex, Math.max(0, targetPhrases.length - 1));
  const currentItem = targetPhrases[safeIndex];
  const prevItem = safeIndex > 0 ? targetPhrases[safeIndex - 1] : null;
  const currentStatus: MasteryStatus = currentItem
    ? (progress[currentItem.phrase.id]?.status ?? 'unstarted')
    : 'unstarted';
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const resetCardVisibility = useCallback(() => {
    setRevealedTokens(new Set());
    setRevealAll(false);
    setShowHint(false);
  }, []);

  const goPrev = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
      resetCardVisibility();
    }
  }, [safeIndex, resetCardVisibility]);

  const goNext = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (safeIndex + 1 < targetPhrases.length) {
      setCurrentIndex(safeIndex + 1);
      resetCardVisibility();
    }
  }, [safeIndex, targetPhrases.length, resetCardVisibility]);

  const handleGrade = useCallback(
    (status: MasteryStatus) => {
      if (!currentItem) return;
      onGradePhrase(currentItem.phrase.id, status);
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current);
      }
      if (safeIndex + 1 < targetPhrases.length) {
        const nextIdx = safeIndex + 1;
        advanceTimerRef.current = window.setTimeout(() => {
          advanceTimerRef.current = null;
          setCurrentIndex(nextIdx);
          resetCardVisibility();
        }, 180);
      }
    },
    [currentItem, onGradePhrase, safeIndex, targetPhrases.length, resetCardVisibility]
  );

  const handleToggleToken = useCallback((idx: number) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  useEffect(() => {
    if (viewLayout !== 'card' || !currentItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setRevealAll((v) => !v);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === '1') {
        handleGrade('shaky');
      } else if (e.key === '2') {
        handleGrade('learning');
      } else if (e.key === '3') {
        handleGrade('mastered');
      } else if (e.key.toLowerCase() === 'r') {
        onPlayPhrase(currentItem.phrase);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewLayout, currentItem, goPrev, goNext, handleGrade, onPlayPhrase]);

  return (
    <div>
      {/* Controls Toolbar */}
      <div className="toolbar">
        <select
          className="select-input"
          aria-label="出題範囲"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">全段すべて</option>
          {focusSectionIds && focusSectionIds.length > 0 && (
            <option value="plan">選択中の計画範囲</option>
          )}
          <option value="weak">苦手フレーズのみ</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.title}
            </option>
          ))}
        </select>

        <div className="seg-group" aria-label="穴埋めレベル">
          {([1, 2, 3, 4] as ClozeLevel[]).map((lv) => (
            <button
              key={lv}
              type="button"
              className={`seg-btn ${level === lv ? 'active' : ''}`}
              onClick={() => setLevel(lv)}
            >
              {LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>

        <div className="seg-group" aria-label="表示形式">
          <button
            type="button"
            className={`seg-btn ${viewLayout === 'card' ? 'active' : ''}`}
            onClick={() => setViewLayout('card')}
          >
            カード集中
          </button>
          <button
            type="button"
            className={`seg-btn ${viewLayout === 'list' ? 'active' : ''}`}
            onClick={() => setViewLayout('list')}
          >
            一覧チェック
          </button>
        </div>

        <div className="seg-group" aria-label="書字方向">
          <button
            type="button"
            className={`seg-btn ${writingMode === 'horizontal' ? 'active' : ''}`}
            onClick={() => onChangeWritingMode('horizontal')}
          >
            横書き
          </button>
          <button
            type="button"
            className={`seg-btn ${writingMode === 'vertical' ? 'active' : ''}`}
            onClick={() => onChangeWritingMode('vertical')}
          >
            縦書き
          </button>
        </div>

        <div className="seg-group" aria-label="ルビ表示">
          <button
            type="button"
            className={`seg-btn ${rubyMode !== 'off' ? 'active' : ''}`}
            onClick={() => onChangeRubyMode(rubyMode === 'off' ? 'historical' : 'off')}
          >
            {rubyMode === 'off' ? 'ルビOFF' : 'ルビON'}
          </button>
        </div>
      </div>

      {targetPhrases.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 36 }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            対象の苦手フレーズがありません
          </p>
          <p className="muted" style={{ marginBottom: 16 }}>
            通読や穴埋め練習で「苦手マーク」または「もう一度」を選ぶと、ここに自動で集まります。
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setScope('all')}>
            全段で練習する
          </button>
        </div>
      ) : viewLayout === 'card' && currentItem ? (
        <div className="card">
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill-badge shu">{currentItem.section.title}</span>
              <span className="pill-badge">
                {safeIndex + 1} / {targetPhrases.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={goPrev}
                disabled={safeIndex === 0}
              >
                <ChevronLeft size={16} />
                <span>前へ</span>
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={goNext}
                disabled={safeIndex + 1 >= targetPhrases.length}
              >
                <span>次へ</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div
              className="progress-fill"
              style={{ width: `${Math.round(((safeIndex + 1) / targetPhrases.length) * 100)}%` }}
            />
          </div>

          {/* Previous Phrase Context */}
          {prevItem && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-subtle)',
                opacity: 0.72,
                marginBottom: 14,
                fontSize: 13.5,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, marginRight: 8 }}>直前の句：</span>
              <RubyText tokens={prevItem.phrase.tokens} rubyMode="off" fontSize="sm" />
            </div>
          )}

          {/* Main Cloze Stage */}
          <div
            style={{
              padding: '22px 18px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              minHeight: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: writingMode === 'vertical' ? 'flex-start' : 'flex-start',
              overflowX: 'auto',
            }}
          >
            <div
              className={writingMode === 'vertical' ? `vertical-content size-${fontSize}` : ''}
              style={writingMode === 'vertical' ? { maxHeight: 340, width: '100%' } : undefined}
            >
              <RubyText
                tokens={currentItem.phrase.tokens}
                rubyMode={rubyMode}
                clozeLevel={level}
                revealedIndices={revealedTokens}
                revealAll={revealAll}
                onToggleToken={handleToggleToken}
                fontSize={fontSize}
              />
            </div>
          </div>

          {showHint && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--ai-soft)',
                fontSize: 14,
              }}
            >
              <strong>意味のヒント：</strong>
              {currentItem.phrase.translation}
            </div>
          )}

          {/* Reveal & Utility Controls */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <button
              type="button"
              className="btn"
              onClick={() => setRevealAll((v) => !v)}
            >
              {revealAll ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{revealAll ? '再び隠す (Space)' : '答えをすべて見る (Space)'}</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                setRevealedTokens(new Set());
                setRevealAll(false);
              }}
            >
              <RotateCcw size={15} />
              <span>マスクをリセット</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => setShowHint((v) => !v)}
            >
              <HelpCircle size={16} />
              <span>意味ヒント</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => onPlayPhrase(currentItem.phrase)}
            >
              <Volume2 size={16} />
              <span>読み上げ (R)</span>
            </button>
          </div>

          {/* Grading Buttons */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
            }}
          >
            <button
              type="button"
              className={`btn btn-grade-shu ${currentStatus === 'shaky' ? 'selected' : ''}`}
              onClick={() => handleGrade('shaky')}
            >
              <span>1. 苦手・もう一度</span>
            </button>
            <button
              type="button"
              className={`btn btn-grade-kin ${currentStatus === 'learning' ? 'selected' : ''}`}
              onClick={() => handleGrade('learning')}
            >
              <span>2. あやふや</span>
            </button>
            <button
              type="button"
              className={`btn btn-grade-matsu ${currentStatus === 'mastered' ? 'selected' : ''}`}
              onClick={() => handleGrade('mastered')}
            >
              <CheckCircle2 size={16} />
              <span>3. 覚えた！</span>
            </button>
          </div>

          <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            PCショートカット：<code>Space</code> で表示切替 / <code>←</code><code>→</code> で移動 / <code>1</code>・<code>2</code>・<code>3</code> で判定 / <code>R</code> で再生
          </p>
        </div>
      ) : (
        /* List Overview Cloze Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={() => setRevealAll((v) => !v)}>
              {revealAll ? 'すべて隠す' : 'すべて答えを見る'}
            </button>
          </div>
          {targetPhrases.map(({ section, phrase }) => (
            <div key={phrase.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--shu)' }}>
                  {section.title}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onPlayPhrase(phrase)}
                >
                  <Volume2 size={14} />
                  <span>再生</span>
                </button>
              </div>
              <RubyText
                tokens={phrase.tokens}
                rubyMode={rubyMode}
                clozeLevel={level}
                revealAll={revealAll}
                fontSize={fontSize}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
