import type { Section } from '../types.ts';

export const AUDIO_SRC = './audio/oharae.mp3';
export const AUDIO_CREDIT = '北多摩神道青年会むらさき会「大祓詞」';

export const AUDIO_MARKERS = {
  drumStart: 0,
  chantStart: 31.8,
  zenEnd: 174.2,
  kouStart: 175.8,
  chantEnd: 342.2,
  clapStart: 355.0,
  duration: 377.57,
} as const;

export interface PhraseAudioRange {
  start: number;
  end: number;
}

export const PHRASE_AUDIO_TIMESTAMPS: Record<string, PhraseAudioRange> = {
  's1-1': { start: 31.8, end: 42.9 },
  's1-2': { start: 43.0, end: 52.4 },
  's1-3': { start: 52.5, end: 63.0 },
  's2-1': { start: 63.1, end: 78.8 },
  's2-2': { start: 78.9, end: 85.8 },
  's2-3': { start: 85.9, end: 97.7 },
  's3-1': { start: 97.8, end: 107.2 },
  's3-2': { start: 107.2, end: 116.6 },
  's3-3': { start: 116.7, end: 125.2 },
  's4-1': { start: 125.3, end: 137.1 },
  's4-2': { start: 137.2, end: 142.0 },
  's4-3': { start: 142.1, end: 147.4 },
  's5-1': { start: 147.5, end: 150.6 },
  's5-2': { start: 150.7, end: 160.7 },
  's5-3': { start: 160.8, end: 167.3 },
  's5-4': { start: 167.4, end: 174.2 },
  's6-1': { start: 175.8, end: 189.0 },
  's6-2': { start: 189.1, end: 203.4 },
  's7-1': { start: 203.5, end: 209.6 },
  's7-2': { start: 209.7, end: 216.8 },
  's7-3': { start: 216.9, end: 226.5 },
  's7-4': { start: 226.6, end: 238.1 },
  's7-5': { start: 238.2, end: 247.3 },
  's7-6': { start: 247.4, end: 254.4 },
  's8-1': { start: 254.5, end: 273.4 },
  's8-2': { start: 273.5, end: 291.2 },
  's9-1': { start: 291.3, end: 306.9 },
  's9-2': { start: 307.0, end: 321.7 },
  's10-m1': { start: 321.8, end: 328.8 },
  's10-m2': { start: 328.9, end: 342.2 },
};

const ORDERED_ENTRIES = Object.entries(PHRASE_AUDIO_TIMESTAMPS);

export function getSectionAudioRange(section: Section): PhraseAudioRange | null {
  const ranges = section.phrases
    .map((p) => PHRASE_AUDIO_TIMESTAMPS[p.id])
    .filter((r): r is PhraseAudioRange => Boolean(r));
  if (ranges.length === 0) return null;
  return {
    start: ranges[0].start,
    end: ranges[ranges.length - 1].end,
  };
}

export function findPhraseIdAtTime(timeSec: number): string | null {
  for (let i = 0; i < ORDERED_ENTRIES.length; i++) {
    const [id, range] = ORDERED_ENTRIES[i];
    const nextStart = i + 1 < ORDERED_ENTRIES.length ? ORDERED_ENTRIES[i + 1][1].start : range.end;
    if (timeSec >= range.start && timeSec < Math.max(range.end, nextStart)) {
      return id;
    }
  }
  return null;
}
