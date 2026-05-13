import React, { useState, useEffect, useRef } from 'react';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import SettingsModal from './components/modals/SettingsModal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  /**
   * [Case 2] 데이터 보존 로직
   * 앱이 시작될 때 LocalStorage에서 기존 설정을 불러옵니다.
   */
  const [refConfig, setRefConfig] = useState(() => {
    const saved = localStorage.getItem('shift_ref_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 저장된 날짜 문자열을 다시 Date 객체로 변환하여 복구
      return {
        date: new Date(parsed.date),
        dia: parsed.dia
      };
    }
    // 저장된 데이터가 없으면 오늘 날짜와 '대1'을 기본값으로 사용
    return {
      date: new Date(),
      dia: '대1'
    };
  });

  /**
   * [Case 2] 자동 저장 로직
   * refConfig가 변경될 때마다 LocalStorage에 실시간 기록합니다.
   */
  useEffect(() => {
    localStorage.setItem('shift_ref_config', JSON.stringify(refConfig));
  }, [refConfig]);

  // 안드로이드 백버튼 트랩 (기존 로직 유지)
  const backPressedRef = useRef(false);
  useEffect(() => {
    window.history.pushState({ app: true }, '');
    const handlePopState = () => {
      if (showSettings) {
        setShowSettings(false);
        window.history.pushState({ app: true }, '');
        return;
      }
      if (!backPressedRef.current) {
        backPressedRef.current = true;
        window.history.pushState({ app: true }, '');
        setTimeout(() => { backPressedRef.current = false; }, 2000);
        return;
      }
      console.log("Exit App");
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showSettings]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[var(--bg-color)]`}>
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-color)] min-h-screen flex flex-col relative overflow-hidden shadow-2xl transition-colors duration-300">
        <main className="flex-1 flex flex-col overflow-hidden relative h-full">
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