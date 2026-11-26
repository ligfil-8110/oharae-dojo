import { useEffect, useMemo, useState } from 'react';
import { Award, Check, Eye, Play, RotateCcw, Timer, X } from 'lucide-react';
import type { FontSize, MasteryStatus, Phrase, RubyMode, Section } from '../types.ts';
import { RubyText } from './RubyText.tsx';

interface ExamViewProps {
  sections: Section[];
  rubyMode: RubyMode;
  fontSize: FontSize;
  onRecordResult: (phraseId: string, status: MasteryStatus) => void;
  onReviewMissed: (sectionIds: string[]) => void;
}

type ExamPhase = 'ready' | 'running' | 'finished';

export function ExamView({
  sections,
  rubyMode,
  fontSize,
  onRecordResult,
  onReviewMissed,
}: ExamViewProps) {
  const [phase, setPhase] = useState<ExamPhase>('ready');
  const [selectedPart, setSelectedPart] = useState<'all' | 'zen' | 'kou'>('all');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [results, setResults] = useState<Record<string, 'pass' | 'fail'>>({});

  const examItems = useMemo(() => {
    const filteredSections = sections.filter((s) => {
      if (selectedPart === 'zen') return s.part === '冒頭' || s.part === '前段';
      if (selectedPart === 'kou') return s.part === '後段' || s.part === '結び';
      return true;
    });
    return filteredSections.flatMap((section) =>
      section.phrases.map((phrase) => ({ section, phrase }))
    );
  }, [sections, selectedPart]);

  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => {
      setElapsedSec((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const startExam = () => {
    setIndex(0);
    setRevealed(false);
    setElapsedSec(0);
    setResults({});
    setPhase('running');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  };

  const handleMark = (outcome: 'pass' | 'fail') => {
    const item = examItems[index];
    if (!item) return;

    setResults((prev) => ({ ...prev, [item.phrase.id]: outcome }));
    onRecordResult(item.phrase.id, outcome === 'pass' ? 'mastered' : 'shaky');

    if (index + 1 >= examItems.length) {
      setPhase('finished');
    } else {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  };

  const currentItem = examItems[index];

  const missedItems = useMemo(() => {
    return examItems.filter((item) => results[item.phrase.id] === 'fail');
  }, [examItems, results]);

  const passCount = examItems.filter((i) => results[i.phrase.id] === 'pass').length;
  const accuracy =
    examItems.length > 0 ? Math.round((passCount / examItems.length) * 100) : 0;

  if (phase === 'ready') {
    return (
      <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 className="section-heading" style={{ fontSize: 22 }}>
          大祓詞 通し暗唱・模擬試験
        </h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          本文を見ずに一節ずつ暗唱し、答え合わせをして「言えた（○）」か「詰まった（×）」かを判定します。最後にタイムと正答率・苦手箇所レポートが出ます。
        </p>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>試験範囲を選択</div>
          <div className="seg-group">
            <button
              type="button"
              className={`seg-btn ${selectedPart === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedPart('all')}
            >
              全段通し（{sections.reduce((n, s) => n + s.phrases.length, 0)}句）
            </button>
            <button
              type="button"
              className={`seg-btn ${selectedPart === 'zen' ? 'active' : ''}`}
              onClick={() => setSelectedPart('zen')}
            >
              前段のみ
            </button>
            <button
              type="button"
              className={`seg-btn ${selectedPart === 'kou' ? 'active' : ''}`}
              onClick={() => setSelectedPart('kou')}
            >
              後段・結びのみ
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={startExam}>
          <Play size={16} />
          <span>模擬試験を開始する</span>
        </button>
      </div>
    );
  }

  if (phase === 'running' && currentItem) {
    return (
      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
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
              {index + 1} / {examItems.length}
            </span>
          </div>
          <span className="pill-badge">
            <Timer size={14} />
            <span>{formatTime(elapsedSec)}</span>
          </span>
        </div>

        <div className="progress-track" style={{ marginBottom: 18 }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.round(((index + 1) / examItems.length) * 100)}%` }}
          />
        </div>

        <div
          style={{
            padding: '24px 18px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            minHeight: 150,
            marginBottom: 16,
          }}
        >
          {!revealed ? (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--shu)', marginBottom: 8 }}>
                次の句を声に出して暗唱してください
              </div>
              <div className="muted" style={{ fontSize: 13.5 }}>
                手がかり（前の句の直後）：この段のテーマ「{currentItem.section.title}」
              </div>
            </div>
          ) : (
            <div>
              <RubyText
                tokens={currentItem.phrase.tokens}
                rubyMode={rubyMode}
                fontSize={fontSize}
              />
              <div className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
                {currentItem.phrase.translation}
              </div>
            </div>
          )}
        </div>

        {!revealed ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => setRevealed(true)}
          >
            <Eye size={16} />
            <span>答えを確認する</span>
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              type="button"
              className="btn"
              style={{ borderColor: 'var(--shu)', color: 'var(--shu)' }}
              onClick={() => handleMark('fail')}
            >
              <X size={17} />
              <span>詰まった・間違えた</span>
            </button>
            <button
              type="button"
              className="btn btn-matsu"
              onClick={() => handleMark('pass')}
            >
              <Check size={17} />
              <span>完璧に言えた！</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Finished Summary
  const missedSectionIds = Array.from(new Set(missedItems.map((m) => m.section.id)));

  return (
    <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
        <Award
          size={42}
          style={{ color: accuracy >= 90 ? 'var(--matsu)' : 'var(--kin)', marginBottom: 8 }}
        />
        <h2 className="section-heading" style={{ fontSize: 24 }}>
          模擬試験 結果：正答率 {accuracy}%
        </h2>
        <p className="muted">
          所要時間：{formatTime(elapsedSec)} ／ 正解 {passCount} 句（全 {examItems.length} 句）
        </p>
      </div>

      {missedItems.length > 0 ? (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10, color: 'var(--shu)' }}>
            詰まった箇所（{missedItems.length}句）— 自動的に「苦手」へ記録されました
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missedItems.map(({ section, phrase }: { section: Section; phrase: Phrase }) => (
              <div
                key={phrase.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--shu)', marginBottom: 4 }}>
                  {section.title}
                </div>
                <RubyText tokens={phrase.tokens} rubyMode={rubyMode} fontSize="sm" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: 'var(--matsu-soft)',
            color: 'var(--matsu)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 18,
          }}
        >
          素晴らしい！全句ノーミスで暗唱完了です。
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={startExam}>
          <RotateCcw size={16} />
          <span>もう一度挑戦する</span>
        </button>
        {missedSectionIds.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onReviewMissed(missedSectionIds)}
          >
            <span>詰まった箇所を穴埋め復習する</span>
          </button>
        )}
      </div>
    </div>
  );
}
