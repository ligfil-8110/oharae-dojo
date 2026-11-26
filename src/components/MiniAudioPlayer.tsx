import { Pause, Play, Repeat, RotateCcw, RotateCw, X } from 'lucide-react';
import type { LoopRange } from '../hooks/useAudioTrack.ts';
import type { Section } from '../types.ts';

interface MiniAudioPlayerProps {
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  activePhraseId: string | null;
  loopRange: LoopRange | null;
  sections: Section[];
  onTogglePlayPause: () => void;
  onSkipBy: (sec: number) => void;
  onCycleRate: () => void;
  onClearLoop: () => void;
  onStop: () => void;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function MiniAudioPlayer({
  isPlaying,
  hasStarted,
  currentTime,
  duration,
  playbackRate,
  activePhraseId,
  loopRange,
  sections,
  onTogglePlayPause,
  onSkipBy,
  onCycleRate,
  onClearLoop,
  onStop,
}: MiniAudioPlayerProps) {
  if (!hasStarted) return null;

  let activeSectionTitle = '大祓詞 お手本奉唱';
  if (activePhraseId) {
    const found = sections.find((sec) =>
      sec.phrases.some((ph) => ph.id === activePhraseId)
    );
    if (found) activeSectionTitle = found.title;
  } else if (currentTime < 31.8) {
    activeSectionTitle = '太鼓（導入）';
  } else if (currentTime > 342.2) {
    activeSectionTitle = '柏手・結び';
  }

  return (
    <div className="mini-player" role="region" aria-label="ミニ音声プレイヤー">
      <div className="mini-player-inner">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onTogglePlayPause}
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onSkipBy(-5)}
          title="5秒戻す"
          aria-label="5秒戻す"
        >
          <RotateCcw size={14} />
          <span>5秒</span>
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onSkipBy(5)}
          title="5秒送る"
          aria-label="5秒送る"
        >
          <RotateCw size={14} />
          <span>5秒</span>
        </button>

        <div className="mini-player-meta">
          <div className="mini-player-title">{activeSectionTitle}</div>
          <div className="mini-player-sub">
            <span>
              {formatClock(currentTime)} / {formatClock(duration)}
            </span>
            {loopRange && (
              <button
                type="button"
                className="mini-loop-chip"
                onClick={onClearLoop}
                title="ループ解除"
              >
                <Repeat size={11} />
                <span>ループ中 ×</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm"
          onClick={onCycleRate}
          title="再生速度を切り替え"
        >
          {playbackRate.toFixed(2).replace(/\.00$/, '.0')}x
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onStop}
          aria-label="プレイヤーを閉じる"
          title="停止して閉じる"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
