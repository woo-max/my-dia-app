import React, { useState, useEffect } from 'react';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import TeammateDashboard from './components/teammate/TeammateDashboard';
import SettingsModal from './components/modals/SettingsModal';
import { fetchSheetData } from './services/googleSheets';

const SHEET_ID = "1FkZO46XQLJr52JHL62KKYgSge1ILP3107c8nGjqm_cc";
const API_KEY = "AIzaSyD59tKDgoKS7urIHCtGT33GbM59f980sv8";

function App() {
  // [복원] 화면 전환 상태 (내 근무, 동료 근무, 전체 근무)
  const [activeView, setActiveView] = useState<'calendar' | 'teammate' | 'all'>('calendar');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [sheetData, setSheetData] = useState<any>(null);

  // 설정 및 데이터 복구
  const [refConfig, setRefConfig] = useState(() => {
    const saved = localStorage.getItem('shift_ref_config');
    return saved ? { ...JSON.parse(saved), date: new Date(JSON.parse(saved).date) } : { date: new Date(), dia: '대1' };
  });

  const [lockedShifts, setLockedShifts] = useState(() => JSON.parse(localStorage.getItem('locked_shifts') || '{}'));
  const [customDayTypes, setCustomDayTypes] = useState(() => JSON.parse(localStorage.getItem('custom_day_types') || '{}'));
  const [overrides, setOverrides] = useState(() => JSON.parse(localStorage.getItem('shift_overrides') || '{}'));
  const [memos, setMemos] = useState(() => JSON.parse(localStorage.getItem('shift_memos') || '{}'));
  
  const [teammates, setTeammates] = useState(() => {
    const saved = localStorage.getItem('teammates');
    if (!saved) return [];
    return JSON.parse(saved).map((t: any) => ({ ...t, refDate: new Date(t.refDate) }));
  });
  
  const [groupNames, setGroupNames] = useState(() => 
    JSON.parse(localStorage.getItem('group_names') || '["G1", "G2", "G3", "G4", "G5"]')
  );

  // 시트 데이터 초기화
  useEffect(() => {
    const initApp = async () => {
      try {
        const data = await fetchSheetData(SHEET_ID, API_KEY);
        setSheetData(data);
      } catch (e) {
        console.error("Sheet loading failed:", e);
      }
    };
    initApp();
  }, []);

  // 로컬 스토리지 동기화
  useEffect(() => {
    localStorage.setItem('dark_mode', String(isDarkMode));
    localStorage.setItem('teammates', JSON.stringify(teammates));
    localStorage.setItem('group_names', JSON.stringify(groupNames));
    localStorage.setItem('shift_ref_config', JSON.stringify(refConfig));
    localStorage.setItem('locked_shifts', JSON.stringify(lockedShifts));
    localStorage.setItem('custom_day_types', JSON.stringify(customDayTypes));
    localStorage.setItem('shift_overrides', JSON.stringify(overrides));
    localStorage.setItem('shift_memos', JSON.stringify(memos)); 
  }, [isDarkMode, teammates, groupNames, refConfig, lockedShifts, customDayTypes, overrides, memos]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-main)] min-h-screen flex flex-col relative overflow-hidden shadow-2xl transition-colors duration-300">
        
        {/* 메인 뷰 영역 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'calendar' ? (
            <ShiftCalendar 
              onOpenSettings={() => setShowSettings(true)} 
              isDarkMode={isDarkMode} 
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
              refConfig={refConfig} 
              lockedShifts={lockedShifts} 
              setLockedShifts={setLockedShifts} 
              customDayTypes={customDayTypes} 
              setCustomDayTypes={setCustomDayTypes} 
              overrides={overrides} 
              setOverrides={setOverrides} 
              memos={memos} 
              setMemos={setMemos} 
              sheetData={sheetData} 
            />
          ) : activeView === 'teammate' ? (
            <TeammateDashboard 
              teammates={teammates} 
              setTeammates={setTeammates} 
              groupNames={groupNames} 
              setGroupNames={setGroupNames} 
              sheetData={sheetData} 
              myConfig={refConfig} 
              isDarkMode={isDarkMode} 
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            />
          ) : (
            <div className="flex-1 flex items-center justify-center font-black opacity-10 text-[var(--text-primary)]">
              전체 근무 현황 (준비 중)
            </div>
          )}
        </main>

        {/* [복원] 하단 네비게이션 바 (3탭) */}
        <nav className="h-[75px] bg-[var(--surface-card)] border-t border-[var(--border-line)] flex items-center justify-around px-4 pb-5 z-[100]">
          {[
            { id: 'calendar', label: '내 근무' },
            { id: 'teammate', label: '동료 근무' },
            { id: 'all', label: '전체 근무' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveView(tab.id as any)} 
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeView === tab.id ? 'opacity-100 scale-105' : 'opacity-20'}`}
            >
              {/* 활성화 표시 인디케이터 */}
              <div className={`w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] transition-all ${activeView === tab.id ? 'scale-100' : 'scale-0'}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-primary)]">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        {/* 설정 모달 */}
        {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            currentConfig={refConfig} 
            onSave={(newConfig: any) => { setRefConfig(newConfig); setShowSettings(false); }} 
          />
        )}
      </div>
    </div>
  );
}

export default App;