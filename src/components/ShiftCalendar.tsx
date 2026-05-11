'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, X, ChevronLeft, ChevronRight, Trash2, Moon, Sun, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Check, FileEdit, Search } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";
import { ROTATION_ORDER, DIA_NUMBERS, getHolidayData } from '../lib/types';
import { useShiftLogic } from '../hooks/useShiftLogic';

export const ShiftCalendar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'peers' | 'all'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // 안전한 데이터 로딩 (초기화 단계 방어)
  const [peers, setPeers] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any>({});
  const [memos, setMemos] = useState<any>({});
  const [userAnchor, setUserConfig] = useState({ date: '2026-05-10', index: 15 });
  const [allData, setAllData] = useState<any>(null);

  const { calculateShift } = useShiftLogic(allData, overrides);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  const theme = {
    bg: isDarkMode ? '#000000' : '#E5E7EB',
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FAFAFA' : '#1C1C1E',
    subText: isDarkMode ? '#A1A1AA' : '#636E72',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  };

  // 시동 로직: 무조건 켜지게 세팅
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('shift_theme');
      setIsDarkMode(savedTheme === 'dark');
      setPeers(JSON.parse(localStorage.getItem('shift_peers') || '[]'));
      setOverrides(JSON.parse(localStorage.getItem('shift_overrides') || '{}'));
      setMemos(JSON.parse(localStorage.getItem('shift_memos') || '{}'));
      setUserConfig(JSON.parse(localStorage.getItem('shift_user_config') || '{"date":"2026-05-10","index":15}'));
      
      fetchAllRotationData().then(data => {
        if (data) setAllData(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } catch (e) {
      console.error("Boot Error");
      setIsLoading(false);
    }
  }, []);

  const openPop = (setter: (v: boolean) => void) => {
    window.history.pushState({ modal: true }, "", "#modal");
    setter(true);
  };

  if (isLoading && !allData) {
    return <div style={{ backgroundColor: theme.bg }} className="h-screen w-screen flex items-center justify-center text-slate-400 font-bold">엔진 가동 중...</div>;
  }

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex flex-col h-screen overflow-hidden font-sans">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <span style={{ color: theme.subText }} className="text-[10px] font-black uppercase tracking-widest">{format(currentMonth, 'yyyy년')}</span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter">{activeTab === 'all' ? "전체" : format(currentMonth, 'M월')}</h1>
            {activeTab !== 'all' && (
              <div className="flex gap-1">
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1"><ChevronRight className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => openPop(() => {}) /* 설정 기능 생략/나중에 */} style={{ backgroundColor: theme.card }} className="w-10 h-10 flex items-center justify-center border rounded-xl shadow-sm"><Settings className="w-5 h-5 opacity-30" /></button>
      </header>

      {/* 메인 달력 그리드 */}
      <main className="flex-1 overflow-hidden px-3">
        {activeTab === 'calendar' && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 mb-1 text-[10px] font-bold opacity-50 text-center">
              {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ borderColor: theme.border }} className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 border-t border-l">
              {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(d => {
                const s = calculateShift(d, userAnchor.date, userAnchor.index, true);
                const h = getHolidayData(d);
                const isCurr = isSameMonth(d, currentMonth);
                return (
                  <div key={d.toString()} style={{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: '0.5px', opacity: isCurr?1:0.3 }} className="flex flex-col p-0.5 overflow-hidden">
                    <div className="flex items-center gap-1 border-b border-black/5 pb-0.5">
                       <span style={{ color: h.isH?'#EF4444':d.getDay()===6?'#3B82F6':theme.text }} className="text-[10px] font-bold">{format(d, 'd')}</span>
                       {h.name && <span className="text-[7px] font-black text-red-400 truncate">{h.name}</span>}
                    </div>
                    <span style={{ color: s.isRed?'#EF4444':theme.text }} className="text-[13px] font-black mt-1 ml-0.5 leading-none">{s.diaNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 하단바 */}
      <nav style={{ backgroundColor: theme.card, borderColor: theme.border }} className="mx-6 mb-6 px-4 py-2.5 rounded-2xl flex items-center justify-between border shadow-lg">
        <button onClick={() => setActiveTab('calendar')} className="flex flex-col items-center"><CalendarIcon className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">내 근무</span></button>
        <button onClick={() => setActiveTab('peers')} className="flex flex-col items-center opacity-40"><Users className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">동료</span></button>
        <button onClick={() => setActiveTab('all')} className="flex flex-col items-center opacity-40"><LayoutList className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">조회</span></button>
      </nav>
    </div>
  );
};
