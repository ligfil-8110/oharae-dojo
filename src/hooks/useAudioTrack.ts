import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AUDIO_MARKERS,
  AUDIO_SRC,
  findPhraseIdAtTime,
  getEffectiveTimestamps,
  getSectionAudioRange,
} from '../data/audioTimestamps.ts';
import type { CustomPhraseOverride, Section } from '../types.ts';

export interface LoopRange {
  start: number;
  end: number;
  label: string;
}

export function useAudioTrack(customOverrides?: Record<string, CustomPhraseOverride>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopRangeRef = useRef<LoopRange | null>(null);
  const stopAtRef = useRef<number | null>(null);

  const effectiveTimestamps = useMemo(
    () => getEffectiveTimestamps(customOverrides),
    [customOverrides]
  );
  const timestampsRef = useRef(effectiveTimestamps);
  timestampsRef.current = effectiveTimestamps;

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(AUDIO_MARKERS.duration);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [loopRange, setLoopRange] = useState<LoopRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  loopRangeRef.current = loopRange;

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio(AUDIO_SRC);
    audio.preload = 'metadata';
    const pitchAudio = audio as HTMLAudioElement & {
      preservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    pitchAudio.preservesPitch = true;
    pitchAudio.webkitPreservesPitch = true;
    audio.playbackRate = playbackRate;

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('play', () => {
      setIsPlaying(true);
      setHasStarted(true);
      setError(null);
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setActivePhraseId(null);
    });

    audio.addEventListener('error', () => {
      setIsPlaying(false);
      setError('音源ファイルの読み込みに失敗しました。');
    });

    audioRef.current = audio;
    return audio;
  }, [playbackRate]);

  // High-precision time tracking + section/phrase loop & stopAt handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncState = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      setActivePhraseId(findPhraseIdAtTime(t, timestampsRef.current));

      const loop = loopRangeRef.current;
      if (loop && !audio.paused && t >= loop.end) {
        audio.currentTime = loop.start;
        return;
      }

      const stopAt = stopAtRef.current;
      if (stopAt !== null && !audio.paused && t >= stopAt) {
        stopAtRef.current = null;
        audio.pause();
      }
    };

    audio.addEventListener('timeupdate', syncState);
    let intervalId: number | null = null;
    if (isPlaying) {
      intervalId = window.setInterval(syncState, 80);
    }

    return () => {
      audio.removeEventListener('timeupdate', syncState);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [isPlaying, hasStarted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const playFrom = useCallback(
    (startSec: number) => {
      const audio = ensureAudio();
      audio.playbackRate = playbackRate;
      const clampedStart = Math.max(0, startSec);
      audio.currentTime = clampedStart;
      setCurrentTime(clampedStart);
      setActivePhraseId(findPhraseIdAtTime(clampedStart, timestampsRef.current));
      audio.play().catch(() => {
        setError('音声を再生できませんでした。もう一度タップしてください。');
      });
    },
    [ensureAudio, playbackRate]
  );

  const playFull = useCallback(
    (skipDrum = true) => {
      stopAtRef.current = null;
      setLoopRange(null);
      playFrom(skipDrum ? AUDIO_MARKERS.chantStart : 0);
    },
    [playFrom]
  );

  const playRange = useCallback(
    (start: number, end: number, options?: { loop?: boolean; label?: string }) => {
      if (options?.loop) {
        stopAtRef.current = null;
        setLoopRange({ start, end, label: options.label ?? 'リピート再生' });
      } else {
        setLoopRange(null);
        stopAtRef.current = end;
      }
      playFrom(start);
    },
    [playFrom]
  );

  const playPhrase = useCallback(
    (phraseId: string, loop = false): boolean => {
      const range = timestampsRef.current[phraseId];
      if (!range) return false;
      playRange(range.start, range.end, { loop, label: loop ? 'この句をリピート' : undefined });
      return true;
    },
    [playRange]
  );

  const playSection = useCallback(
    (section: Section, loop = false): boolean => {
      const range = getSectionAudioRange(section, timestampsRef.current);
      if (!range) return false;
      playRange(range.start, range.end, { loop, label: loop ? `${section.title}` : undefined });
      return true;
    },
    [playRange]
  );

  const togglePlayPause = useCallback(() => {
    const audio = ensureAudio();
    if (audio.paused) {
      if (!hasStarted && audio.currentTime === 0) {
        audio.currentTime = AUDIO_MARKERS.chantStart;
      }
      audio.play().catch(() => {
        setError('音声を再生できませんでした。');
      });
    } else {
      audio.pause();
    }
  }, [ensureAudio, hasStarted]);

  const stop = useCallback(() => {
    stopAtRef.current = null;
    setLoopRange(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentTime(0);
    setActivePhraseId(null);
  }, []);

  const seek = useCallback(
    (sec: number) => {
      const audio = ensureAudio();
      const clamped = Math.max(0, Math.min(duration, sec));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
      setActivePhraseId(findPhraseIdAtTime(clamped, timestampsRef.current));
    },
    [duration, ensureAudio]
  );

  const skipBy = useCallback(
    (deltaSec: number) => {
      const cur = audioRef.current?.currentTime ?? currentTime;
      seek(cur + deltaSec);
    },
    [currentTime, seek]
  );

  const clearLoop = useCallback(() => {
    setLoopRange(null);
  }, []);

  return {
    isPlaying,
    hasStarted,
    currentTime,
    duration,
    playbackRate,
    activePhraseId,
    loopRange,
    effectiveTimestamps,
    error,
    playFull,
    playRange,
    playPhrase,
    playSection,
    togglePlayPause,
    stop,
    seek,
    skipBy,
    setPlaybackRate,
    clearLoop,
  };
}
