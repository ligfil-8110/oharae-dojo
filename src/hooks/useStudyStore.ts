import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPresetSections } from '../data/oharaeData.ts';
import type {
  CustomPhraseOverride,
  MasteryStatus,
  Phrase,
  PhraseProgress,
  Section,
  StudySettings,
  StudyStoreData,
} from '../types.ts';
import { parseRubyText } from '../utils/rubyParser.ts';

const STORAGE_KEY = 'oharae_dojo_v1';

function getDefaultExamDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_SETTINGS: StudySettings = {
  preset: 'noru',
  includeFramingLines: false,
  rubyMode: 'historical',
  writingMode: 'horizontal',
  theme: 'washi',
  examDate: getDefaultExamDate(),
  speechRate: 0.9,
  shadowingPauseSec: 1.5,
  fontSize: 'md',
};

function getInitialStore(): StudyStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudyStoreData>;
      return {
        version: 1,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        progress: parsed.progress ?? {},
        customOverrides: parsed.customOverrides ?? {},
        completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
      };
    }
  } catch {
    // Ignore corrupted storage and fall back to defaults
  }
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    progress: {},
    customOverrides: {},
    completedDays: [],
  };
}

export function useStudyStore() {
  const [store, setStore] = useState<StudyStoreData>(() => getInitialStore());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }, [store]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.settings.theme);
  }, [store.settings.theme]);

  const sections: Section[] = useMemo(() => {
    const baseSections = getPresetSections(
      store.settings.preset,
      store.settings.includeFramingLines
    );
    return baseSections.map((sec) => ({
      ...sec,
      phrases: sec.phrases.map((phrase): Phrase => {
        const override = store.customOverrides[phrase.id];
        if (!override) return phrase;
        return {
          ...phrase,
          tokens: parseRubyText(override.rawRubyText, phrase.tokens),
          translation: override.translation ?? phrase.translation,
        };
      }),
    }));
  }, [store.settings.preset, store.settings.includeFramingLines, store.customOverrides]);

  const allPhrases = useMemo(() => sections.flatMap((s) => s.phrases), [sections]);

  const updateSettings = useCallback((patch: Partial<StudySettings>) => {
    setStore((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const setPhraseMastery = useCallback((phraseId: string, status: MasteryStatus) => {
    setStore((prev) => {
      const current = prev.progress[phraseId] ?? {
        status: 'unstarted',
        reviewCount: 0,
        mistakeCount: 0,
      };
      const isWeak = status === 'shaky';
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [phraseId]: {
            ...current,
            status,
            reviewCount: current.reviewCount + 1,
            mistakeCount: isWeak ? current.mistakeCount + 1 : current.mistakeCount,
            lastReviewedAt: Date.now(),
            isWeakBookmarked: status === 'mastered' ? false : current.isWeakBookmarked,
          },
        },
      };
    });
  }, []);

  const toggleWeakBookmark = useCallback((phraseId: string) => {
    setStore((prev) => {
      const current = prev.progress[phraseId] ?? {
        status: 'unstarted',
        reviewCount: 0,
        mistakeCount: 0,
      };
      return {
        ...prev,
        progress: {
          ...prev.progress,
          [phraseId]: {
            ...current,
            isWeakBookmarked: !current.isWeakBookmarked,
          },
        },
      };
    });
  }, []);

  const toggleDayCompleted = useCallback((day: number) => {
    setStore((prev) => {
      const exists = prev.completedDays.includes(day);
      return {
        ...prev,
        completedDays: exists
          ? prev.completedDays.filter((d) => d !== day)
          : [...prev.completedDays, day].sort((a, b) => a - b),
      };
    });
  }, []);

  const savePhraseOverride = useCallback((phraseId: string, override: CustomPhraseOverride) => {
    setStore((prev) => ({
      ...prev,
      customOverrides: {
        ...prev.customOverrides,
        [phraseId]: override,
      },
    }));
  }, []);

  const resetPhraseOverride = useCallback((phraseId: string) => {
    setStore((prev) => {
      const next = { ...prev.customOverrides };
      delete next[phraseId];
      return { ...prev, customOverrides: next };
    });
  }, []);

  const resetAllOverrides = useCallback(() => {
    setStore((prev) => ({ ...prev, customOverrides: {} }));
  }, []);

  const resetAllProgress = useCallback(() => {
    setStore((prev) => ({ ...prev, progress: {}, completedDays: [] }));
  }, []);

  const exportBackupJson = useCallback((): string => {
    return JSON.stringify(store, null, 2);
  }, [store]);

  const importBackupJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as Partial<StudyStoreData>;
      if (!parsed || typeof parsed !== 'object') return false;
      setStore({
        version: 1,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        progress: parsed.progress ?? {},
        customOverrides: parsed.customOverrides ?? {},
        completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const stats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let shaky = 0;
    let unstarted = 0;
    const weakPhraseIds: string[] = [];

    for (const phrase of allPhrases) {
      const p: PhraseProgress | undefined = store.progress[phrase.id];
      const status = p?.status ?? 'unstarted';
      if (status === 'mastered') mastered++;
      else if (status === 'shaky') shaky++;
      else if (status === 'learning') learning++;
      else unstarted++;

      if (status === 'shaky' || p?.isWeakBookmarked) {
        weakPhraseIds.push(phrase.id);
      }
    }

    const total = allPhrases.length;
    const masteryPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return {
      total,
      mastered,
      learning,
      shaky,
      unstarted,
      masteryPercent,
      weakPhraseIds,
    };
  }, [allPhrases, store.progress]);

  const daysUntilExam = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(store.settings.examDate + 'T00:00:00');
    if (Number.isNaN(target.getTime())) return 7;
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [store.settings.examDate]);

  const currentRecommendedDay = useMemo(() => {
    for (let day = 1; day <= 7; day++) {
      if (!store.completedDays.includes(day)) return day;
    }
    return 7;
  }, [store.completedDays]);

  return {
    store,
    sections,
    allPhrases,
    stats,
    daysUntilExam,
    currentRecommendedDay,
    updateSettings,
    setPhraseMastery,
    toggleWeakBookmark,
    toggleDayCompleted,
    savePhraseOverride,
    resetPhraseOverride,
    resetAllOverrides,
    resetAllProgress,
    exportBackupJson,
    importBackupJson,
  };
}
