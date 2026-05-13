import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import SettingsModal from './components/modals/SettingsModal';
import { fetchSheetData } from './services/googleSheets';

const SHEET_ID = "1FkZO46XQLJr52JHL62KKYgSge1ILP3107c8nGjqm_cc";
const API_KEY = "AIzaSyD59tKDgoKS7urIHCtGT33GbM59f980sv8";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [sheetData, setSheetData] = useState<any>(null);

  const [refConfig, setRefConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('shift_ref_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, date: new Date(parsed.date) };
      }
    } catch (e) { console.error(e); }
    return { date: new Date(), dia: '대1' };
  });

  const [lockedShifts, setLockedShifts] = useState(() => JSON.parse(localStorage.getItem('locked_shifts') || '{}'));
  const [customDayTypes, setCustomDayTypes] = useState(() => JSON.parse(localStorage.getItem('custom_day_types') || '{}'));
  const [overrides, setOverrides] = useState(() => JSON.parse(localStorage.getItem('shift_overrides') || '{}'));
  const [memos, setMemos] = useState(() => JSON.parse(localStorage.getItem('shift_memos') || '{}'));

  useEffect(() => {
    const initApp = async () => {
      const data = await fetchSheetData(SHEET_ID, API_KEY);
      setSheetData(data);
    };
    initApp();
  }, []);

  useEffect(() => {
    localStorage.setItem('dark_mode', String(isDarkMode));
    localStorage.setItem('shift_ref_config', JSON.stringify(refConfig));
    localStorage.setItem('locked_shifts', JSON.stringify(lockedShifts));
    localStorage.setItem('custom_day_types', JSON.stringify(customDayTypes));
    localStorage.setItem('shift_overrides', JSON.stringify(overrides));
    localStorage.setItem('shift_memos', JSON.stringify(memos)); 
  }, [isDarkMode, refConfig, lockedShifts, customDayTypes, overrides, memos]);

  const lastTimeRef = useRef<number>(0);
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (showSettings) { setShowSettings(false); return; }
      const now = Date.now();
      if (now - lastTimeRef.current < 2000) { CapacitorApp.exitApp(); }
      else { lastTimeRef.current = now; }
    });
    return () => { backListener.then(h => h.remove()); };
  }, [showSettings]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* [보정] bg-main 변수 적용으로 배경색 통일 */}
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-main)] min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
        <ShiftCalendar 
          onOpenSettings={() => setShowSettings(true)} 
          isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
          refConfig={refConfig} 
          lockedShifts={lockedShifts} setLockedShifts={setLockedShifts}
          customDayTypes={customDayTypes} setCustomDayTypes={setCustomDayTypes}
          overrides={overrides} setOverrides={setOverrides}
          memos={memos} setMemos={setMemos}
          sheetData={sheetData}
        />
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} currentConfig={refConfig} onSave={(newConfig: any) => { setRefConfig(newConfig); setShowSettings(false); }} />
        )}
      </div>
    </div>
  );
}

export default App;