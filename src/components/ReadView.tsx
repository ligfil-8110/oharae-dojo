import { useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Edit3,
  Eye,
  EyeOff,
  Lightbulb,
  Play,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import type {
  FontSize,
  Phrase,
  PhraseProgress,
  RubyMode,
  Section,
  WritingMode,
} from '../types.ts';
import { DayMythSvg } from './DayMythSvg.tsx';
import { RubyText } from './RubyText.tsx';

interface ReadViewProps {
  sections: Section[];
  focusSectionIds: string[] | null;
  onClearFocus: () => void;
  writingMode: WritingMode;
  rubyMode: RubyMode;
  fontSize: FontSize;
  progress: Record<string, PhraseProgress>;
  playingPhraseId: string | null;
  isPlaying: boolean;
  onChangeWritingMode: (mode: WritingMode) => void;
  onChangeRubyMode: (mode: RubyMode) => void;
  onChangeFontSize: (size: FontSize) => void;
  onPlaySection: (section: Section) => void;
  onPlayAllVisible: (sections: Section[]) => void;
  onPlayPhrase: (phrase: Phrase) => void;
  onStopAudio: () => void;
  onToggleWeak: (phraseId: string) => void;
  onEditPhrase: (phrase: Phrase) => void;
}

export function ReadView({
  sections,
  focusSectionIds,
  onClearFocus,
  writingMode,
  rubyMode,
  fontSize,
  progress,
  playingPhraseId,
  isPlaying,
  onChangeWritingMode,
  onChangeRubyMode,
  onChangeFontSize,
  onPlaySection,
  onPlayAllVisible,
  onPlayPhrase,
  onStopAudio,
  onToggleWeak,
  onEditPhrase,
}: ReadViewProps) {
  const [showTranslations, setShowTranslations] = useState(true);
  const [showFlowMap, setShowFlowMap] = useState(false);
  const [showMythVisuals, setShowMythVisuals] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleSections =
    focusSectionIds && focusSectionIds.length > 0
      ? sections.filter((s) => focusSectionIds.includes(s.id))
      : sections;

  const handleWheelVerticalScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (writingMode !== 'vertical' || !scrollContainerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      // In vertical-rl, scrolling left reveals later text
      scrollContainerRef.current.scrollLeft -= e.deltaY;
    }
  };

  return (
    <div>
      {/* Controls Toolbar */}
      <div className="toolbar">
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

        <div className="seg-group" aria-label="ふりがな設定">
          <button
            type="button"
            className={`seg-btn ${rubyMode === 'historical' ? 'active' : ''}`}
            onClick={() => onChangeRubyMode('historical')}
          >
            歴史的ルビ
          </button>
          <button
            type="button"
            className={`seg-btn ${rubyMode === 'modern' ? 'active' : ''}`}
            onClick={() => onChangeRubyMode('modern')}
          >
            現代仮名
          </button>
          <button
            type="button"
            className={`seg-btn ${rubyMode === 'off' ? 'active' : ''}`}
            onClick={() => onChangeRubyMode('off')}
          >
            ルビOFF
          </button>
        </div>

        <div className="seg-group" aria-label="文字サイズ">
          {(['sm', 'md', 'lg'] as FontSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              className={`seg-btn ${fontSize === sz ? 'active' : ''}`}
              onClick={() => onChangeFontSize(sz)}
            >
              {sz === 'sm' ? '小' : sz === 'md' ? '中' : '大'}
            </button>
          ))}
        </div>

        {writingMode === 'horizontal' && (
          <>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowTranslations((v) => !v)}
            >
              {showTranslations ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>{showTranslations ? '現代語訳 ON' : '現代語訳 OFF'}</span>
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowMythVisuals((v) => !v)}
            >
              <Sparkles size={15} />
              <span>{showMythVisuals ? '神話ビジュアル ON' : '神話ビジュアル OFF'}</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowFlowMap((v) => !v)}
        >
          <Lightbulb size={15} />
          <span>全体の流れ図</span>
        </button>

        {isPlaying ? (
          <button type="button" className="btn btn-sm btn-primary" onClick={onStopAudio}>
            <Square size={14} />
            <span>読み上げ停止</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-ai"
            onClick={() => onPlayAllVisible(visibleSections)}
          >
            <Play size={14} />
            <span>表示範囲を通し再生</span>
          </button>
        )}

        {focusSectionIds && (
          <button type="button" className="btn btn-sm" onClick={onClearFocus}>
            全段を表示
          </button>
        )}
      </div>

      {/* Narrative Flow Diagram */}
      {showFlowMap && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--ai)' }}>
          <h3 className="section-heading" style={{ fontSize: 16 }}>
            意味のつながりで覚える「大祓詞」全体構造
          </h3>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)' }}>
              <strong style={{ color: 'var(--shu)' }}>【前段】なぜ大祓を行うのか（第1〜5段）</strong>
              <ol style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13.5 }}>
                <li>神議りと天孫への委任（高天原→豊葦原水穂国）</li>
                <li>荒ぶる神や岩木草を鎮めて天孫降臨</li>
                <li>大倭日高見国に瑞の御殿を造営</li>
                <li>天の益人たちが天つ罪・国つ罪を犯す</li>
                <li>天つ宮事（金木・菅麻）を整え太祝詞事を宣る</li>
              </ol>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-subtle)' }}>
              <strong style={{ color: 'var(--ai)' }}>【後段・結び】どうやって罪が消えるのか（第6〜10段）</strong>
              <ol style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13.5 }} start={6}>
                <li>天つ神・国つ神が雲霧を分けてお聞きになる</li>
                <li>4つの比喩（科戸の風・朝夕の霧・大船・焼鎌の敏鎌）</li>
                <li>祓戸四神①②：瀬織津比売（川→海）→ 速開都比売（呑む）</li>
                <li>祓戸四神③④：気吹戸主（根国へ放つ）→ 速佐須良比売（消す）</li>
                <li>罪はなくなり清められたことを宣る／白す</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Reading Mode */}
      {writingMode === 'vertical' ? (
        <div>
          <p className="muted" style={{ marginBottom: 8 }}>
            ※ 縦書きモード：マウスホイールまたは横スワイプで右から左へ読み進めます。各文をタップすると音声再生できます。
          </p>
          <div
            ref={scrollContainerRef}
            className="vertical-scroll-frame"
            onWheel={handleWheelVerticalScroll}
          >
            <div className={`vertical-content size-${fontSize}`}>
              {visibleSections.map((sec) => (
                <span key={sec.id} style={{ marginLeft: 24 }}>
                  <span className="vertical-section-title">{sec.title}</span>
                  {sec.phrases.map((phrase) => (
                    <span
                      key={phrase.id}
                      className={`vertical-phrase ${
                        playingPhraseId === phrase.id ? 'playing' : ''
                      }`}
                      onClick={() => onPlayPhrase(phrase)}
                      title="クリックしてこの句を読み上げ"
                    >
                      <RubyText
                        tokens={phrase.tokens}
                        rubyMode={rubyMode}
                        fontSize={fontSize}
                      />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Horizontal Cards Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visibleSections.map((sec, secIdx) => {
            const prevSec = secIdx > 0 ? visibleSections[secIdx - 1] : null;
            const showDayBanner =
              showMythVisuals &&
              (!prevSec || prevSec.recommendedDay !== sec.recommendedDay);

            return (
              <article key={sec.id} className="card">
                {showDayBanner && (
                  <div className="myth-card-banner">
                    <DayMythSvg day={sec.recommendedDay} compact />
                  </div>
                )}
                <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                  flexWrap: 'wrap',
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="pill-badge shu">{sec.part}</span>
                    <span className="pill-badge">Day {sec.recommendedDay}</span>
                  </div>
                  <h3 className="section-heading" style={{ margin: 0 }}>
                    {sec.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onPlaySection(sec)}
                >
                  <Volume2 size={15} />
                  <span>この段を再生</span>
                </button>
              </div>

              {showTranslations && (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 14,
                    fontSize: 13.5,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>あらすじ</div>
                  <div>{sec.summary}</div>
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed var(--border-strong)',
                      color: 'var(--shu)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    <strong>暗記のツボ：</strong>
                    {sec.memoryTip}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sec.phrases.map((phrase) => {
                  const p = progress[phrase.id];
                  const isWeak = p?.status === 'shaky' || p?.isWeakBookmarked;
                  const isCurrent = playingPhraseId === phrase.id;

                  return (
                    <div
                      key={phrase.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${isCurrent ? 'var(--kin)' : 'var(--border)'}`,
                        background: isCurrent ? 'var(--kin-soft)' : 'var(--bg-elevated)',
                      }}
                    >
                      <div style={{ marginBottom: showTranslations ? 8 : 0 }}>
                        <RubyText
                          tokens={phrase.tokens}
                          rubyMode={rubyMode}
                          fontSize={fontSize}
                        />
                      </div>

                      {showTranslations && (
                        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {phrase.translation}
                          {phrase.note && (
                            <span style={{ display: 'block', fontSize: 12, marginTop: 3 }}>
                              ※ {phrase.note}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onPlayPhrase(phrase)}
                        >
                          <Volume2 size={14} />
                          <span>聞く</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            color: isWeak ? 'var(--shu)' : undefined,
                            borderColor: isWeak ? 'var(--shu)' : undefined,
                          }}
                          onClick={() => onToggleWeak(phrase.id)}
                        >
                          {isWeak ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          <span>{isWeak ? '苦手登録中' : '苦手マーク'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onEditPhrase(phrase)}
                        >
                          <Edit3 size={14} />
                          <span>ルビ・本文編集</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
