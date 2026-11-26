import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  Play,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react';
import { SEVEN_DAY_PLAN } from '../data/oharaeData.ts';
import type { AppTab, PhraseProgress, Section } from '../types.ts';
import { DAY_MYTH_META, DayMythSvg } from './DayMythSvg.tsx';

interface PlanViewProps {
  sections: Section[];
  progress: Record<string, PhraseProgress>;
  completedDays: number[];
  examDate: string;
  daysUntilExam: number;
  currentRecommendedDay: number;
  stats: {
    total: number;
    mastered: number;
    learning: number;
    shaky: number;
    unstarted: number;
    masteryPercent: number;
    weakPhraseIds: string[];
  };
  onUpdateExamDate: (date: string) => void;
  onToggleDayCompleted: (day: number) => void;
  onJumpToStudy: (tab: AppTab, sectionIds?: string[], onlyWeak?: boolean) => void;
  onPlayDayAudio?: (sectionIds: string[]) => void;
}

export function PlanView({
  sections,
  progress,
  completedDays,
  examDate,
  daysUntilExam,
  currentRecommendedDay,
  stats,
  onUpdateExamDate,
  onToggleDayCompleted,
  onJumpToStudy,
  onPlayDayAudio,
}: PlanViewProps) {
  const [selectedMythDay, setSelectedMythDay] = useState<number>(currentRecommendedDay);
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const todayPlan =
    SEVEN_DAY_PLAN.find((p) => p.day === currentRecommendedDay) ?? SEVEN_DAY_PLAN[0];
  const selectedDayPlan =
    SEVEN_DAY_PLAN.find((p) => p.day === selectedMythDay) ?? SEVEN_DAY_PLAN[0];
  const mythMeta = DAY_MYTH_META[selectedMythDay] ?? DAY_MYTH_META[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Hero Summary Card */}
      <section className="card" style={{ borderLeft: '4px solid var(--shu)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="pill-badge shu">
                {daysUntilExam > 0
                  ? `試験まであと ${daysUntilExam} 日`
                  : daysUntilExam === 0
                  ? '本日が本番！'
                  : '目標日経過'}
              </span>
              <span className="pill-badge">全 {stats.total} フレーズ</span>
            </div>
            <h2 className="section-heading" style={{ fontSize: 22 }}>
              1週間で「大祓詞」を完全暗唱するペース配分
            </h2>
            <p className="muted" style={{ margin: '4px 0 14px' }}>
              前段（第1〜5段）→ 後段（第6〜10段）を5日間で覚え、6日目に苦手潰し、7日目に通し試験を行います。
            </p>

            <div className="progress-track" aria-label="全体の習得率">
              <div className="progress-fill" style={{ width: `${stats.masteryPercent}%` }} />
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginTop: 10,
                fontSize: 13,
              }}
            >
              <span>
                <span className="status-dot mastered" /> 覚えた: <strong>{stats.mastered}</strong>
              </span>
              <span>
                <span className="status-dot learning" /> あやふや: <strong>{stats.learning}</strong>
              </span>
              <span>
                <span className="status-dot shaky" /> 苦手・要復習:{' '}
                <strong style={{ color: 'var(--shu)' }}>{stats.shaky}</strong>
              </span>
              <span>
                <span className="status-dot unstarted" /> 未着手: <strong>{stats.unstarted}</strong>
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minWidth: 220,
            }}
          >
            <label style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              目標日（試験日）
              <input
                type="date"
                className="text-input"
                style={{ display: 'block', width: '100%', marginTop: 4 }}
                value={examDate}
                onChange={(e) => onUpdateExamDate(e.target.value)}
              />
            </label>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onJumpToStudy(todayPlan.recommendedMode, todayPlan.sectionIds, false)
              }
            >
              <Play size={16} />
              <span>Day {todayPlan.day} の学習を始める</span>
            </button>

            {stats.weakPhraseIds.length > 0 && (
              <button
                type="button"
                className="btn"
                style={{ borderColor: 'var(--shu)', color: 'var(--shu)' }}
                onClick={() => onJumpToStudy('cloze', undefined, true)}
              >
                <Flame size={16} />
                <span>苦手フレーズ集中反復（{stats.weakPhraseIds.length}件）</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Mythological Visual Memory Theater */}
      <section className="myth-theater">
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
            <Sparkles size={18} style={{ color: 'var(--kin)' }} />
            <h3 className="section-heading" style={{ margin: 0 }}>
              神話ビジュアル記憶シアター（情景で覚える）
            </h3>
          </div>

          <div className="seg-group" aria-label="シアターの日数選択">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                type="button"
                className={`seg-btn ${selectedMythDay === d ? 'active' : ''}`}
                onClick={() => setSelectedMythDay(d)}
              >
                Day {d}
              </button>
            ))}
          </div>
        </div>

        <div className="myth-stage">
          <DayMythSvg day={selectedMythDay} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--kin)', marginBottom: 4 }}>
            Day {selectedMythDay} ・ {mythMeta.motif}
          </div>
          <h4 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif)', fontSize: 17 }}>
            {mythMeta.sceneTitle}
          </h4>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            {mythMeta.visualStory}
          </p>

          <div className="myth-anchor-row">
            {mythMeta.anchors.map((a) => (
              <span key={a} className="myth-anchor-chip">
                {a}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {onPlayDayAudio && (
              <button
                type="button"
                className="btn btn-sm btn-ai"
                onClick={() => onPlayDayAudio(selectedDayPlan.sectionIds)}
              >
                <Volume2 size={14} />
                <span>この日の範囲を音声で聴く</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onJumpToStudy('read', selectedDayPlan.sectionIds)}
            >
              <span>通読で確認</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => onJumpToStudy('cloze', selectedDayPlan.sectionIds)}
            >
              <Target size={14} />
              <span>この日を穴埋め暗記</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7-Day Curriculum */}
      <section>
        <h3 className="section-heading" style={{ marginBottom: 10 }}>
          7日間カリキュラム
        </h3>
        <div className="grid-2">
          {SEVEN_DAY_PLAN.map((plan) => {
            const targetSections = plan.sectionIds
              .map((id) => sectionMap.get(id))
              .filter((s): s is Section => Boolean(s));
            const targetPhrases = targetSections.flatMap((s) => s.phrases);
            const masteredCount = targetPhrases.filter(
              (p) => progress[p.id]?.status === 'mastered'
            ).length;
            const pct =
              targetPhrases.length > 0
                ? Math.round((masteredCount / targetPhrases.length) * 100)
                : 0;
            const isCompleted = completedDays.includes(plan.day);
            const isToday = plan.day === currentRecommendedDay;

            return (
              <div
                key={plan.day}
                className="card"
                style={{
                  borderColor: isToday ? 'var(--shu)' : undefined,
                  opacity: isCompleted ? 0.85 : 1,
                }}
              >
                <div
                  className="myth-card-banner"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedMythDay(plan.day);
                    window.scrollTo({ top: 140, behavior: 'smooth' });
                  }}
                  title="クリックして神話シアターで拡大表示"
                >
                  <DayMythSvg day={plan.day} compact />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`pill-badge ${isToday ? 'shu' : ''}`}>
                      Day {plan.day}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {plan.subtitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onToggleDayCompleted(plan.day)}
                    title="完了チェックを切り替え"
                    style={{
                      color: isCompleted ? 'var(--matsu)' : 'var(--text-muted)',
                      borderColor: isCompleted ? 'var(--matsu)' : 'var(--border)',
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    <span>{isCompleted ? '完了' : '未完了'}</span>
                  </button>
                </div>

                <h4 style={{ margin: '2px 0 6px', fontFamily: 'var(--font-serif)', fontSize: 16 }}>
                  {plan.title}
                </h4>
                <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
                  {plan.goal}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {masteredCount}/{targetPhrases.length} ({pct}%)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onJumpToStudy('read', plan.sectionIds)}
                  >
                    <span>通読で確認</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      onJumpToStudy(
                        plan.recommendedMode === 'read' ? 'cloze' : plan.recommendedMode,
                        plan.sectionIds
                      )
                    }
                  >
                    <Target size={14} />
                    <span>{plan.day === 7 ? '模擬試験へ' : 'この範囲を暗記'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section Mastery Heatmap */}
      <section className="card">
        <h3 className="section-heading" style={{ marginBottom: 10 }}>
          段落別 習得状況マップ
        </h3>
        <div className="grid-3">
          {sections.map((sec) => {
            const total = sec.phrases.length;
            const mastered = sec.phrases.filter(
              (p) => progress[p.id]?.status === 'mastered'
            ).length;
            const shaky = sec.phrases.filter(
              (p) => progress[p.id]?.status === 'shaky' || progress[p.id]?.isWeakBookmarked
            ).length;

            return (
              <div
                key={sec.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--shu)' }}>
                    {sec.part} ・ Day {sec.recommendedDay}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    {mastered}/{total} 習得
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 14.5 }}>
                  {sec.title}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  {sec.phrases.map((ph) => {
                    const st = progress[ph.id]?.status ?? 'unstarted';
                    return (
                      <span
                        key={ph.id}
                        className={`status-dot ${st}`}
                        title={`${ph.id}: ${st}`}
                      />
                    );
                  })}
                  {shaky > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--shu)', fontWeight: 600 }}>
                      （苦手 {shaky}）
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onJumpToStudy('read', [sec.id])}
                  >
                    読む
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onJumpToStudy('cloze', [sec.id])}
                  >
                    穴埋め
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
