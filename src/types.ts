export interface Token {
  text: string;
  ruby?: string;
  modernRuby?: string;
  tts?: string;
  isKey?: boolean;
}

export interface Phrase {
  id: string;
  tokens: Token[];
  translation: string;
  note?: string;
}

export interface Section {
  id: string;
  number: number;
  part: '冒頭' | '前段' | '後段' | '結び';
  title: string;
  subtitle: string;
  recommendedDay: number;
  summary: string;
  memoryTip: string;
  phrases: Phrase[];
}

export type PresetId = 'noru' | 'maosu';
export type ClozeLevel = 1 | 2 | 3 | 4;
export type RubyMode = 'historical' | 'modern' | 'off';
export type WritingMode = 'horizontal' | 'vertical';
export type MasteryStatus = 'unstarted' | 'learning' | 'shaky' | 'mastered';
export type ThemeMode = 'washi' | 'sumi';
export type FontSize = 'sm' | 'md' | 'lg';
export type AppTab = 'plan' | 'read' | 'cloze' | 'write' | 'audio' | 'exam';

export interface PhraseProgress {
  status: MasteryStatus;
  reviewCount: number;
  mistakeCount: number;
  lastReviewedAt?: number;
  isWeakBookmarked?: boolean;
}

export interface StudySettings {
  preset: PresetId;
  includeFramingLines: boolean;
  rubyMode: RubyMode;
  writingMode: WritingMode;
  theme: ThemeMode;
  examDate: string;
  speechRate: number;
  shadowingPauseSec: number;
  fontSize: FontSize;
}

export interface CustomPhraseOverride {
  rawRubyText: string;
  translation?: string;
  ttsOverride?: string;
  audioStart?: number;
  audioEnd?: number;
}

export interface StudyStoreData {
  version: number;
  settings: StudySettings;
  progress: Record<string, PhraseProgress>;
  customOverrides: Record<string, CustomPhraseOverride>;
  completedDays: number[];
}

export interface DayPlan {
  day: number;
  title: string;
  subtitle: string;
  sectionIds: string[];
  goal: string;
  recommendedMode: AppTab;
}
