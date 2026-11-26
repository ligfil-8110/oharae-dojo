import { useState } from 'react';
import { AudioView } from './components/AudioView.tsx';
import { ClozeView } from './components/ClozeView.tsx';
import { ExamView } from './components/ExamView.tsx';
import { Header } from './components/Header.tsx';
import { PhraseEditorModal } from './components/PhraseEditorModal.tsx';
import { PlanView } from './components/PlanView.tsx';
import { ReadView } from './components/ReadView.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis.ts';
import { useStudyStore } from './hooks/useStudyStore.ts';
import type { AppTab, Phrase } from './types.ts';

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

  const tts = useSpeechSynthesis({
    rate: store.settings.speechRate,
    pauseSec: store.settings.shadowingPauseSec,
    customOverrides: store.customOverrides,
  });

  const handleJumpToStudy = (tab: AppTab, sectionIds?: string[], onlyWeak = false) => {
    setFocusSectionIds(sectionIds ?? null);
    setOnlyWeakCloze(onlyWeak);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
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
            playingPhraseId={tts.playingPhraseId}
            isPlaying={tts.isPlaying}
            onChangeWritingMode={(writingMode) => updateSettings({ writingMode })}
            onChangeRubyMode={(rubyMode) => updateSettings({ rubyMode })}
            onChangeFontSize={(fontSize) => updateSettings({ fontSize })}
            onPlaySection={(phrases) => tts.playPhrases(phrases)}
            onPlayPhrase={(phrase) => tts.speakSingle(phrase)}
            onStopAudio={tts.stop}
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
            onPlayPhrase={(phrase) => tts.speakSingle(phrase)}
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
            isPlaying={tts.isPlaying}
            isPausedBetween={tts.isPausedBetween}
            playingPhraseId={tts.playingPhraseId}
            loop={tts.loop}
            onChangeSpeechRate={(speechRate) => updateSettings({ speechRate })}
            onChangeShadowingPause={(shadowingPauseSec) =>
              updateSettings({ shadowingPauseSec })
            }
            onToggleLoop={tts.setLoop}
            onPlayPhrases={(phrases) => tts.playPhrases(phrases)}
            onStopAudio={tts.stop}
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
