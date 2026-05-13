import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import SettingsModal from './components/modals/SettingsModal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // [Case 2] 영구 저장 및 복구 로직
  const [refConfig, setRefConfig] = useState(() => {
    const saved = localStorage.getItem('shift_ref_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        date: new Date(parsed.date), // 문자열을 다시 날짜 객체로 변환
      };
    }
    return { date: new Date(), dia: '대1' }; // 초기값: 오늘, 대1
  });

  // 설정 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem('shift_ref_config', JSON.stringify(refConfig));
  }, [refConfig]);

  // 안드로이드 네이티브 백버튼 제어 (2연타 종료)
  const lastTimeRef = useRef<number>(0);
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      const now = Date.now();
      if (showSettings) {
        setShowSettings(false);
        return; 
      }
      if (now - lastTimeRef.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastTimeRef.current = now;
      }
    });
    return () => { backListener.then(handler => handler.remove()); };
  }, [showSettings]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-color)] min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <ShiftCalendar 
            onOpenSettings={() => setShowSettings(true)} 
            isDarkMode={isDarkMode} 
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
            refConfig={refConfig}
          />
        </main>
        {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            currentConfig={refConfig}
            onSave={(newConfig: any) => {
              setRefConfig(newConfig);
              setShowSettings(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;