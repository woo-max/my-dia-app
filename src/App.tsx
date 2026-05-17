import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ShiftCalendar from './components/calendar/ShiftCalendar';
import TeammateDashboard from './components/teammate/TeammateDashboard';
import FullScheduleTab from './components/schedule/FullScheduleTab';
import SettingsModal from './components/modals/SettingsModal';
import { fetchSheetData } from './services/googleSheets';

// 🚀 안전한 플러그인 로드를 위한 방어벽 구성
let SplashScreen: any = null;
try {
  SplashScreen = require('@capacitor/splash-screen').SplashScreen;
} catch (e) {
  console.warn("SplashScreen 플러그인을 로드할 수 없습니다.");
}

const SHEET_ID = "1FkZO46XQLJr52JHL62KKYgSge1ILP3107c8nGjqm_cc";
const API_KEY = "AIzaSyD59tKDgoKS7urIHCtGT33GbM59f980sv8";

function App() {
  const [activeView, setActiveView] = useState<'calendar' | 'teammate' | 'all'>('calendar');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [sheetData, setSheetData] = useState<any>(null);
  
  // [초대코드 보안] 상태
  const [userCode, setUserCode] = useState(() => localStorage.getItem('user_access_code') || '');
  const [authStatus, setAuthStatus] = useState<'loading' | 'allowed' | 'blocked' | 'prompt'>('loading');

  // --- 기존 데이터 보존 영역 (절대 수정 금지) ---
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

  // 뒤로가기 버튼 로직
  const lastBackPress = useRef(0);
  useEffect(() => {
    const backHandler = CapacitorApp.addListener('backButton', () => {
      if (showSettings) { setShowSettings(false); return; }
      if (selectedDay) { setSelectedDay(null); return; }
      if (selectedDuty) { setSelectedDuty(null); return; }
      if (showAddModal) { setShowAddModal(false); return; }
      if (showGroupModal) { setShowGroupModal(null); return; }

      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        CapacitorApp.exitApp();
      } else {
        lastBackPress.current = now;
      }
    });
    return () => { backHandler.remove(); };
  }, [showSettings, selectedDay, selectedDuty, showAddModal, showGroupModal]);

  // 구글 시트 데이터 로딩 및 초대코드 인증 검문
  useEffect(() => {
    const initApp = async () => {
      try {
        const currentCode = localStorage.getItem('user_access_code') || userCode;
        if (!currentCode) {
          setAuthStatus('prompt');
          return;
        }

        const authUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Access?key=${API_KEY}`;
        const res = await fetch(authUrl);
        const json = await res.json();
        
        if (!res.ok) {
          console.error("❌ 구글 시트 API 오류:", json);
          throw new Error("시트 호출 실패");
        }

        const rows = json.values || [];
        const matchedRow = rows.find((row: any) => 
          row[0] && String(row[0]).trim().toLowerCase() === currentCode.trim().toLowerCase()
        );
        
        if (matchedRow && matchedRow[1] && String(matchedRow[1]).trim().toUpperCase() === 'ALLOWED') {
          const data = await fetchSheetData(SHEET_ID, API_KEY);
          setSheetData(data);
          setAuthStatus('allowed');
        } else {
          setAuthStatus('blocked');
        }
      } catch (e) {
        console.error("🔥 시스템 에러:", e);
        setAuthStatus('blocked');
      }
    };
    initApp();
  }, [userCode]);

  // 🚀 [2중 안전장치 설치] 플러그인이 맛이 가도 앱이 절대 하얗게 죽지 않도록 차단막 구성
  useEffect(() => {
    if (SplashScreen && typeof SplashScreen.hide === 'function') {
      if (authStatus === 'allowed' && sheetData) {
        SplashScreen.hide().catch(() => {});
      } else if (authStatus === 'prompt' || authStatus === 'blocked') {
        SplashScreen.hide().catch(() => {});
      }
    }
  }, [authStatus, sheetData]);

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

  // 🚀 로딩 화면을 원래 앱 메인 테마 색상으로 녹여 부드럽게 연결
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center text-[var(--text-main)] transition-colors duration-300">
        <div className="text-xs font-bold opacity-40 tracking-widest animate-pulse">
          데이터 동기화 중...
        </div>
      </div>
    );
  }

  if (authStatus === 'prompt') {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 dark:bg-zinc-950">
        <div className="w-full max-w-sm bg-[var(--surface-card)] p-8 rounded-[32px] border border-[var(--border-line)] shadow-2xl text-center">
          <h2 className="text-2xl font-black mb-2 text-[var(--text-main)] tracking-tight"></h2>
          <p className="text-xs opacity-50 mb-8 text-[var(--text-main)]"></p>
          
          <input 
            type="text" 
            placeholder="코드를 입력하세요"
            id="codeInputField"
            className="w-full py-4 px-5 bg-black/5 dark:bg-white/5 rounded-2xl font-bold text-center tracking-wider text-[var(--text-main)] border border-[var(--border-line)] focus:outline-none focus:border-blue-500 mb-4 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if(val.trim()) {
                  localStorage.setItem('user_access_code', val.trim());
                  setUserCode(val.trim());
                  setAuthStatus('loading');
                }
              }
            }}
          />
          <button 
            onClick={() => {
              const el = document.getElementById('codeInputField') as HTMLInputElement;
              if (el && el.value.trim()) {
                localStorage.setItem('user_access_code', el.value.trim());
                setUserCode(el.value.trim());
                setAuthStatus('loading');
              }
            }}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            인증 및 승인
          </button>
        </div>
      </div>
    );
  }

  if (authStatus === 'blocked') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6 text-center">
        <div className="p-8 bg-zinc-950 rounded-[32px] border border-zinc-800 max-w-sm">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 font-bold text-xl">!</div>
          <h3 className="text-lg font-black text-white mb-2">접근 권한 상실</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            인증 정보가 만료되었거나 차단된 기기입니다.
          </p>
          <button 
            onClick={() => {
              localStorage.removeItem('user_access_code');
              setUserCode('');
              setAuthStatus('prompt');
            }}
            className="text-xs font-bold text-zinc-500 underline active:text-zinc-300"
          >
            다른 코드로 로그인
          </button>
        </div>
      </div>
    );
  }

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
            <FullScheduleTab sheetData={sheetData} />
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
              className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                activeView === tab.id ? 'scale-105' : ''
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-[var(--text-main)] transition-all ${
                activeView === tab.id ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`} />
              <span className={`text-[10px] font-black uppercase tracking-tighter ${
                activeView === tab.id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
              }`}>
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