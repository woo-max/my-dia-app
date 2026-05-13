import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app'; // 네이티브 앱 제어 모듈
import ShiftCalendar from './components/calendar/ShiftCalendar';
import SettingsModal from './components/modals/SettingsModal';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refConfig, setRefConfig] = useState({ date: new Date(), dia: '대1' });
  
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // [핵심] 안드로이드 시스템 백버튼 신호를 직접 수신
    const backListener = CapacitorApp.addListener('backButton', () => {
      const now = Date.now();

      // 1. 설정창이 열려있으면 설정창만 닫고 종료 프로세스 중단
      if (showSettings) {
        setShowSettings(false);
        return; 
      }

      // 2. 메인 화면에서 2초 이내에 다시 눌렀는지 확인
      if (now - lastTimeRef.current < 2000) {
        // [결정] 진짜로 앱을 죽임
        CapacitorApp.exitApp();
      } else {
        // [방어] 첫 번째 클릭 시 시간만 기록 (안내문구 없이 그냥 무시)
        lastTimeRef.current = now;
        console.log("Back button pressed once - Ignoring exit");
      }
    });

    // 리스너 해제 (메모리 누수 방지)
    return () => {
      backListener.then(handler => handler.remove());
    };
  }, [showSettings]); // showSettings 상태가 바뀔 때마다 리스너가 최신 상태를 참조하게 함

  return (
    /* ... 기존 렌더링 코드 유지 ... */
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-[430px] mx-auto bg-[var(--bg-color)] min-h-screen flex flex-col relative overflow-hidden transition-colors">
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
            onSave={(newConfig: any) => { setRefConfig(newConfig); setShowSettings(false); }}
          />
        )}
      </div>
    </div>
  );
}

export default App;