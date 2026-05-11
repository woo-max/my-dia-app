// src/components/ShiftCalendar.tsx (일부 발췌 - 핵심 구조)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Check, Search } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";
import { ROTATION_ORDER, DIA_NUMBERS, RED_ITEMS, getHolidayData } from '../lib/types';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { DetailPopup } from './DetailPopup';

export const ShiftCalendar = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('shift_theme') === 'dark' : false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'peers' | 'all'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allData, setAllData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overrides, setOverrides] = useState(() => JSON.parse(localStorage.getItem('shift_overrides') || '{}'));
  const [memos, setMemos] = useState(() => JSON.parse(localStorage.getItem('shift_memos') || '{}'));
  const [userAnchor, setUserConfig] = useState(() => JSON.parse(localStorage.getItem('shift_user_config') || '{"date":"2026-05-10","index":15}'));
  
  const { calculateShift, getStandbyLoc } = useShiftLogic(allData, overrides);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const theme = {
    bg: isDarkMode ? '#000000' : '#E5E7EB',
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FAFAFA' : '#1C1C1E',
    highlight7: 'rgba(16, 185, 129, 0.07)',
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchAllRotationData();
      setAllData(data);
      setIsLoading(false);
    };
    load();
  }, []);

  // [핵심] 뒤로가기 제어: #modal 해시가 있을 때만 팝업을 닫음
  const openPop = (setter: (v: boolean) => void) => {
    window.history.pushState({ modal: true }, "", "#modal");
    setter(true);
  };

  // ... (동료 스크롤, 근무변경 핸들러 등 나머지 로직)

  return (
    <div style={{ backgroundColor: theme.bg }} className="h-screen overflow-hidden flex flex-col">
       {/* (헤더와 메인 탭 렌더링 로직...) */}
       
       {showDetail && (
         <DetailPopup 
           selectedDate={selectedDate}
           detailData={calculateShift(selectedDate, userAnchor.date, userAnchor.index, true)}
           theme={theme}
           onClose={() => window.history.back()}
           onShiftMenu={() => openPop(setShowShiftMenu)}
           // ... 나머지 Props
         />
       )}
    </div>
  );
};
