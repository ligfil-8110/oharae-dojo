import { useCallback, useState } from 'react';
import { AudioView } from './components/AudioView.tsx';
import { ClozeView } from './components/ClozeView.tsx';
import { ExamView } from './components/ExamView.tsx';
import { Header } from './components/Header.tsx';
import { MiniAudioPlayer } from './components/MiniAudioPlayer.tsx';
import { PhraseEditorModal } from './components/PhraseEditorModal.tsx';
import { PlanView } from './components/PlanView.tsx';
import { ReadView } from './components/ReadView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PHRASE_AUDIO_TIMESTAMPS } from './data/audioTimestamps.ts';
import { useAudioTrack } from './hooks/useAudioTrack.ts';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.ts';
import { useStudyStore } from './hooks/useStudyStore.ts';
import type { AppTab, Phrase, Section } from './types.ts';

const MINI_SPEEDS = [0.75, 0.9, 1.0, 1.15];

export function App() {
  const {
    store,
    sections,
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
  } = useStudyStore();

  const [activeTab, setActiveTab] = useState<AppTab>('plan');
  const [focusSectionIds, setFocusSectionIds] = useState<string[] | null>(null);
  const [onlyWeakCloze, setOnlyWeakCloze] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const realAudio = useAudioTrack();
  const tts = useSpeechSynthesis({
    rate: store.settings.speechRate,
    pauseSec: store.settings.shadowingPauseSec,
    customOverrides: store.customOverrides,
  });

  const handlePlayPhrasePreferReal = useCallback(
    (phrase: Phrase) => {
      if (store.settings.preset === 'maosu' && PHRASE_AUDIO_TIMESTAMPS[phrase.id]) {
        tts.stop();
        realAudio.playPhrase(phrase.id, false);
        return;
      }
      realAudio.stop();
      tts.speakSingle(phrase);
    },
    [store.settings.preset, realAudio, tts]
  );

  const handlePlaySectionPreferReal = useCallback(
    (section: Section) => {
      if (store.settings.preset === 'maosu' && realAudio.playSection(section, false)) {
        tts.stop();
        return;
      }
      realAudio.stop();
      tts.playPhrases(section.phrases);
    },
    [store.settings.preset, realAudio, tts]
  );

  const handlePlayAllVisiblePreferReal = useCallback(
    (visibleSections: Section[]) => {
      if (store.settings.preset === 'maosu' && visibleSections.length > 0) {
        const firstRange = PHRASE_AUDIO_TIMESTAMPS[visibleSections[0].phrases[0]?.id ?? ''];
        const lastSec = visibleSections[visibleSections.length - 1];
        const lastPhrase = lastSec.phrases[lastSec.phrases.length - 1];
        const lastRange = PHRASE_AUDIO_TIMESTAMPS[lastPhrase?.id ?? ''];
        if (firstRange && lastRange) {
          tts.stop();
          realAudio.playRange(firstRange.start, lastRange.end, { loop: false });
          return;
        }
      }
      realAudio.stop();
      tts.playPhrases(visibleSections.flatMap((s) => s.phrases));
    },
    [store.settings.preset, realAudio, tts]
  );

  const handleStopAllAudio = useCallback(() => {
    realAudio.stop();
    tts.stop();
  }, [realAudio, tts]);

  const handleCycleMiniSpeed = useCallback(() => {
    const idx = MINI_SPEEDS.findIndex((s) => Math.abs(s - realAudio.playbackRate) < 0.05);
    const next = MINI_SPEEDS[(idx + 1) % MINI_SPEEDS.length];
    realAudio.setPlaybackRate(next);
  }, [realAudio]);

  const handleJumpToStudy = (tab: AppTab, sectionIds?: string[], onlyWeak = false) => {
    setFocusSectionIds(sectionIds ?? null);
    setOnlyWeakCloze(onlyWeak);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const combinedPlaying = realAudio.isPlaying || tts.isPlaying;
  const combinedPlayingPhraseId = realAudio.isPlaying
    ? realAudio.activePhraseId
    : tts.playingPhraseId ?? realAudio.activePhraseId;

  return (
    <div className={`app-shell ${realAudio.hasStarted ? 'with-mini-player' : ''}`}>
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setOnlyWeakCloze(false);
          setActiveTab(tab);
        }}
        settings={store.settings}
        onToggleTheme={() =>
          updateSettings({ theme: store.settings.theme === 'washi' ? 'sumi' : 'washi' })
        }
        onOpenSettings={() => setSettingsOpen(true)}
        masteryPercent={stats.masteryPercent}
        daysUntilExam={daysUntilExam}
      />

      <main className="container" style={{ flex: 1 }}>
        {activeTab === 'plan' && (
          <PlanView
            sections={sections}
            progress={store.progress}
            completedDays={store.completedDays}
            examDate={store.settings.examDate}
            daysUntilExam={daysUntilExam}
            currentRecommendedDay={currentRecommendedDay}
            stats={stats}
            onUpdateExamDate={(examDate) => updateSettings({ examDate })}
            onToggleDayCompleted={toggleDayCompleted}
            onJumpToStudy={handleJumpToStudy}
          />
        )}

        {activeTab === 'read' && (
          <ReadView
            sections={sections}
            focusSectionIds={focusSectionIds}
            onClearFocus={() => setFocusSectionIds(null)}
            writingMode={store.settings.writingMode}
            rubyMode={store.settings.rubyMode}
            fontSize={store.settings.fontSize}
            progress={store.progress}
            playingPhraseId={combinedPlayingPhraseId}
            isPlaying={combinedPlaying}
            onChangeWritingMode={(writingMode) => updateSettings({ writingMode })}
            onChangeRubyMode={(rubyMode) => updateSettings({ rubyMode })}
            onChangeFontSize={(fontSize) => updateSettings({ fontSize })}
            onPlaySection={handlePlaySectionPreferReal}
            onPlayAllVisible={handlePlayAllVisiblePreferReal}
            onPlayPhrase={handlePlayPhrasePreferReal}
            onStopAudio={handleStopAllAudio}
            onToggleWeak={toggleWeakBookmark}
            onEditPhrase={(phrase) => setEditingPhrase(phrase)}
          />
        )}

        {activeTab === 'cloze' && (
          <ClozeView
            sections={sections}
            focusSectionIds={focusSectionIds}
            onlyWeakDefault={onlyWeakCloze}
            progress={store.progress}
            rubyMode={store.settings.rubyMode}
            writingMode={store.settings.writingMode}
            fontSize={store.settings.fontSize}
            onChangeRubyMode={(rubyMode) => updateSettings({ rubyMode })}
            onChangeWritingMode={(writingMode) => updateSettings({ writingMode })}
            onGradePhrase={setPhraseMastery}
            onPlayPhrase={handlePlayPhrasePreferReal}
          />
        )}

        {activeTab === 'audio' && (
          <AudioView
            sections={sections}
            focusSectionIds={focusSectionIds}
            rubyMode={store.settings.rubyMode}
            fontSize={store.settings.fontSize}
            speechRate={store.settings.speechRate}
            shadowingPauseSec={store.settings.shadowingPauseSec}
            isTtsSupported={tts.isSupported}
            isTtsPlaying={tts.isPlaying}
            isTtsPausedBetween={tts.isPausedBetween}
            ttsPlayingPhraseId={tts.playingPhraseId}
            ttsLoop={tts.loop}
            realAudio={realAudio}
            onChangeSpeechRate={(speechRate) => updateSettings({ speechRate })}
            onChangeShadowingPause={(shadowingPauseSec) =>
              updateSettings({ shadowingPauseSec })
            }
            onToggleTtsLoop={tts.setLoop}
            onPlayTtsPhrases={(phrases) => tts.playPhrases(phrases)}
            onStopTts={tts.stop}
            onPlaySamplePhrase={handlePlayPhrasePreferReal}
            onMarkPhraseStatus={setPhraseMastery}
          />
        )}

        {activeTab === 'exam' && (
          <ExamView
            sections={sections}
            rubyMode={store.settings.rubyMode}
            fontSize={store.settings.fontSize}
            onRecordResult={setPhraseMastery}
            onReviewMissed={(missedIds) => handleJumpToStudy('cloze', missedIds, false)}
          />
        )}
      </main>

      <MiniAudioPlayer
        isPlaying={realAudio.isPlaying}
        hasStarted={realAudio.hasStarted}
        currentTime={realAudio.currentTime}
        duration={realAudio.duration}
        playbackRate={realAudio.playbackRate}
        activePhraseId={realAudio.activePhraseId}
        loopRange={realAudio.loopRange}
        sections={sections}
        onTogglePlayPause={realAudio.togglePlayPause}
        onSkipBy={realAudio.skipBy}
        onCycleRate={handleCycleMiniSpeed}
        onClearLoop={realAudio.clearLoop}
        onStop={realAudio.stop}
      />

      {editingPhrase && (
        <PhraseEditorModal
          phrase={editingPhrase}
          existingOverride={store.customOverrides[editingPhrase.id]}
          onSave={savePhraseOverride}
          onReset={resetPhraseOverride}
          onClose={() => setEditingPhrase(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={store.settings}
          customOverrideCount={Object.keys(store.customOverrides).length}
          onUpdateSettings={updateSettings}
          onExportBackup={exportBackupJson}
          onImportBackup={importBackupJson}
          onResetOverrides={resetAllOverrides}
          onResetProgress={resetAllProgress}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
