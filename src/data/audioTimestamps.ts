import type { CustomPhraseOverride, Section } from '../types.ts';

export const AUDIO_SRC = './audio/oharae.mp3';
export const AUDIO_CREDIT = '北多摩神道青年会むらさき会「大祓詞」';

export const AUDIO_MARKERS = {
  drumStart: 0,
  chantStart: 31.8,
  zenEnd: 174.2,
  kouStart: 175.0,
  chantEnd: 342.0,
  clapStart: 355.0,
  duration: 377.57,
} as const;

export interface PhraseAudioRange {
  start: number;
  end: number;
}

export const PHRASE_AUDIO_TIMESTAMPS: Record<string, PhraseAudioRange> = {
  's1-1': { start: 31.8, end: 42.9 },
  's1-2': { start: 43.2, end: 52.3 },
  's1-3': { start: 52.5, end: 65.6 },
  's2-1': { start: 65.5, end: 78.7 },
  's2-2': { start: 78.9, end: 85.7 },
  's2-3': { start: 86.0, end: 96.8 },
  's3-1': { start: 96.8, end: 107.8 },
  's3-2': { start: 107.6, end: 118.3 },
  's3-3': { start: 118.5, end: 128.9 },
  's4-1': { start: 128.8, end: 137.0 },
  's4-2': { start: 137.3, end: 142.0 },
  's4-3': { start: 142.2, end: 147.5 },
  's5-1': { start: 147.6, end: 150.6 },
  's5-2': { start: 150.7, end: 161.2 },
  's5-3': { start: 161.1, end: 169.4 },
  's5-4': { start: 169.3, end: 174.2 },
  's6-1': { start: 175.0, end: 189.0 },
  's6-2': { start: 189.3, end: 203.3 },
  's7-1': { start: 203.5, end: 209.2 },
  's7-2': { start: 209.7, end: 216.2 },
  's7-3': { start: 217.1, end: 226.1 },
  's7-4': { start: 226.6, end: 237.8 },
  's7-5': { start: 238.2, end: 247.0 },
  's7-6': { start: 247.4, end: 254.1 },
  's8-1': { start: 254.6, end: 277.4 },
  's8-2': { start: 277.3, end: 296.1 },
  's9-1': { start: 296.0, end: 312.8 },
  's9-2': { start: 312.6, end: 325.0 },
  's10-m1': { start: 324.8, end: 328.7 },
  's10-m2': { start: 328.9, end: 342.0 },
};

export function getEffectiveTimestamps(
  overrides?: Record<string, CustomPhraseOverride>
): Record<string, PhraseAudioRange> {
  if (!overrides) return PHRASE_AUDIO_TIMESTAMPS;
  const result: Record<string, PhraseAudioRange> = { ...PHRASE_AUDIO_TIMESTAMPS };
  for (const [id, ov] of Object.entries(overrides)) {
    const base = result[id];
    if (!base) continue;
    const start =
      typeof ov.audioStart === 'number' && Number.isFinite(ov.audioStart)
        ? Math.max(0, ov.audioStart)
        : base.start;
    const end =
      typeof ov.audioEnd === 'number' && Number.isFinite(ov.audioEnd)
        ? Math.max(start + 0.5, ov.audioEnd)
        : base.end;
    result[id] = { start, end };
  }
  return result;
}

export function getSectionAudioRange(
  section: Section,
  timestamps: Record<string, PhraseAudioRange> = PHRASE_AUDIO_TIMESTAMPS
): PhraseAudioRange | null {
  const ranges = section.phrases
    .map((p) => timestamps[p.id])
    .filter((r): r is PhraseAudioRange => Boolean(r));
  if (ranges.length === 0) return null;
  return {
    start: ranges[0].start,
    end: ranges[ranges.length - 1].end,
  };
}

export function findPhraseIdAtTime(
  timeSec: number,
  timestamps: Record<string, PhraseAudioRange> = PHRASE_AUDIO_TIMESTAMPS
): string | null {
  const ordered = Object.entries(timestamps).sort((a, b) => a[1].start - b[1].start);
  for (let i = 0; i < ordered.length; i++) {
    const [id, range] = ordered[i];
    const nextStart = i + 1 < ordered.length ? ordered[i + 1][1].start : range.end;
    if (timeSec >= range.start && timeSec < Math.max(range.end, nextStart)) {
      return id;
    }
  }
  return null;
}
