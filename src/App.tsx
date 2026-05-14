import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import TeammateDashboard from './components/teammate/TeammateDashboard';
import SettingsModal from './components/modals/SettingsModal';
import { fetchSheetData } from './services/googleSheets';

const SHEET_ID = "1FkZO46XQLJr52JHL62KKYgSge1ILP3107c8nGjqm_cc";
const API_KEY = "AIzaSyD59tKDgoKS7urIHCtGT33GbM59f980sv8";

function App() {
  const [activeView, setActiveView] = useState<'calendar' | 'teammate' | 'all'>('calendar');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [sheetData, setSheetData] = useState<any>(null);

  // 모달 및 서브 상태 관리
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [selectedDuty, setSelectedDuty] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState<any>(null);

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

  // 뒤로가기 버튼 로직: 팝업 계층에 따라 닫기 및 앱 종료 제어
  const lastBackPress = useRef(0);
  useEffect(() => {
    const backHandler = CapacitorApp.addListener('backButton', () => {
      // 설정창 -> 상세 팝업 -> 추가/수정 팝업 순서로 체크하여 닫기
      if (showSettings) { setShowSettings(false); return; }
      if (selectedDay) { setSelectedDay(null); return; }
      if (selectedDuty) { setSelectedDuty(null); return; }
      if (showAddModal) { setShowAddModal(false); return; }
      if (showGroupModal) { setShowGroupModal(null); return; }

      // 아무것도 안 열려 있으면 2초 내 재클릭 시 종료
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPress.current = now;
      }
    });
    return () => { backHandler.remove(); };
  }, [showSettings, selectedDay, selectedDuty, showAddModal, showGroupModal]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const data = await fetchSheetData(SHEET_ID, API_KEY);
        setSheetData(data);
      } catch (e) {
        console.error("Sheet loading failed", e);
      }
    };
    initApp();
  }, []);

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
              setSelectedDay={setSelectedDay}
              selectedDay={selectedDay}
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
              setSelectedDuty={setSelectedDuty}
              selectedDuty={selectedDuty}
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
              showGroupModal={showGroupModal}
              setShowGroupModal={setShowGroupModal}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center font-black opacity-10 text-[var(--text-main)]">ALL SCHEDULE</div>
          )}
        </main>

        <nav className="h-[75px] bg-[var(--surface-card)] border-t border-[var(--border-line)] flex items-center justify-around px-4 pb-5 z-[100]">
          {[
            { id: 'calendar', label: '내 근무' },
            { id: 'teammate', label: '동료 근무' },
            { id: 'all', label: '전체 근무' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveView(tab.id as any)} 
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${activeView === tab.id ? 'scale-105' : ''}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-[var(--text-main)] transition-all ${activeView === tab.id ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
              <span className={`text-[10px] font-black uppercase tracking-tighter ${activeView === tab.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

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