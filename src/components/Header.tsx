import {
  BookOpen,
  Calendar,
  EyeOff,
  GraduationCap,
  Mic,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import type { AppTab, StudySettings } from '../types.ts';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  settings: StudySettings;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  masteryPercent: number;
  daysUntilExam: number;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; shortLabel: string; icon: typeof Calendar }> = [
  { id: 'plan', label: '7日間計画', shortLabel: '計画', icon: Calendar },
  { id: 'read', label: '通読・解説', shortLabel: '通読', icon: BookOpen },
  { id: 'cloze', label: '穴埋め暗記', shortLabel: '穴埋め', icon: EyeOff },
  { id: 'audio', label: '音読・暗唱', shortLabel: '音声', icon: Mic },
  { id: 'exam', label: '模擬試験', shortLabel: '試験', icon: GraduationCap },
];

export function Header({
  activeTab,
  onSelectTab,
  settings,
  onToggleTheme,
  onOpenSettings,
  masteryPercent,
  daysUntilExam,
}: HeaderProps) {
  const countdownText =
    daysUntilExam > 0
      ? `試験まであと ${daysUntilExam} 日`
      : daysUntilExam === 0
      ? '本日が試験日'
      : '試験日経過';

  return (
    <>
      <header className="top-header">
        <div className="top-header-inner">
          <div className="header-row">
            <div className="brand">
              <div className="brand-seal" aria-hidden="true">
                祓
              </div>
              <div>
                <h1 className="brand-title">大祓詞 暗記道場</h1>
                <div className="brand-sub">
                  {settings.preset === 'maosu' ? '神社本庁「白す」形' : '宣読体「宣る」形'} ・ 習得率 {masteryPercent}%
                </div>
              </div>
            </div>

            <div className="header-actions">
              <span className={`pill-badge ${daysUntilExam <= 3 ? 'shu' : 'matsu'}`}>
                {countdownText}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={onToggleTheme}
                aria-label="テーマ切替"
                title={settings.theme === 'washi' ? '墨（ダーク）モードへ' : '和紙（ライト）モードへ'}
              >
                {settings.theme === 'washi' ? <Moon size={16} /> : <Sun size={16} />}
                <span>{settings.theme === 'washi' ? '墨' : '和紙'}</span>
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={onOpenSettings}
                aria-label="設定とバックアップ"
              >
                <Settings size={16} />
                <span>設定</span>
              </button>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="メインナビゲーション">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-tab ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
