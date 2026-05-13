import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import SettingsModal from './components/modals/SettingsModal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showSettings, setShowSettings] = useState(false);
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

  const [lockedShifts, setLockedShifts] = useState<{ [key: string]: any }>(() => {
    try {
      const saved = localStorage.getItem('locked_shifts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => { localStorage.setItem('dark_mode', String(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('shift_ref_config', JSON.stringify(refConfig)); }, [refConfig]);
  useEffect(() => { localStorage.setItem('locked_shifts', JSON.stringify(lockedShifts)); }, [lockedShifts]);

  const lastTimeRef = useRef<number>(0);
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      const now = Date.now();
      if (showSettings) { setShowSettings(false); return; }
      if (now - lastTimeRef.current < 2000) { CapacitorApp.exitApp(); }
      else { lastTimeRef.current = now; }
    });
    return () => { backListener.then(handler => handler.remove()); };
  }, [showSettings]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-color)] min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
        <main className="flex-1 flex flex-col overflow-hidden relative h-full">
          <ShiftCalendar 
            onOpenSettings={() => setShowSettings(true)} isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            refConfig={refConfig} lockedShifts={lockedShifts} setLockedShifts={setLockedShifts}
          />
        </main>
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} currentConfig={refConfig} onSave={(newConfig: any) => { setRefConfig(newConfig); setShowSettings(false); }} />
        )}
      </div>
    </div>
  );
}

export default App;