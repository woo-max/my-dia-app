'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Check, Search, Moon, Sun, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";
import { ROTATION_ORDER, DIA_NUMBERS, RED_ITEMS, getHolidayData } from '../lib/types';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { DetailPopup } from './DetailPopup';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const ShiftCalendar = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('shift_theme') === 'dark');
  const [activeTab, setActiveTab] = useState<'calendar' | 'peers' | 'all'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [peers, setPeers] = useState<any[]>(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('shift_peers') || '[]' : '[]'));
  const [overrides, setOverrides] = useState<any>(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('shift_overrides') || '{}' : '{}'));
  const [memos, setMemos] = useState<any>(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('shift_memos') || '{}' : '{}'));
  const [userAnchor, setUserConfig] = useState(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('shift_user_config') || '{"date":"2026-05-10","index":15}' : '{"date":"2026-05-10","index":15}'));
  
  const [allData, setAllData] = useState<any>(() => JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('shift_sheet_cache') || 'null' : 'null'));
  const [isLoading, setIsLoading] = useState(!allData);

  const { calculateShift, getStandbyLoc } = useShiftLogic(allData, overrides);
  const [showDetail, setShowDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState<{type: string, color: string} | null>(null);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [showEditPeers, setShowEditPeers] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoInput, setMemoInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const peerScrollRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);

  const theme = {
    bg: isDarkMode ? '#000000' : '#E5E7EB',
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FAFAFA' : '#1C1C1E',
    subText: isDarkMode ? '#A1A1AA' : '#636E72',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    highlight7: 'rgba(16, 185, 129, 0.07)', // 7% 하이라이트
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllRotationData();
        if (data) { setAllData(data); localStorage.setItem('shift_sheet_cache', JSON.stringify(data)); }
      } catch (e) { console.error("Sheet Sync Fail"); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('shift_peers', JSON.stringify(peers));
    localStorage.setItem('shift_overrides', JSON.stringify(overrides));
    localStorage.setItem('shift_memos', JSON.stringify(memos));
    localStorage.setItem('shift_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('shift_user_config', JSON.stringify(userAnchor));
  }, [peers, overrides, memos, isDarkMode, userAnchor]);

  const openPop = (setter: (v: boolean) => void) => {
    window.history.pushState({ modal: true }, "", "#modal");
    setter(true);
  };

  const getDutyColor = (duty: string, defaultColor: string) => {
    if (!duty) return defaultColor;
    if (duty.includes('지정근무') || duty.includes('대기충당') || duty.includes('교번교체')) return '#2563EB';
    if (duty.includes('휴무충당')) return '#D97706';
    return defaultColor;
  };

  // 동료 근무 오늘 날짜 스크롤
  useEffect(() => {
    if (activeTab === 'peers' && peerScrollRef.current) {
      const todayIdx = differenceInDays(new Date(), startOfMonth(currentMonth));
      if (todayIdx >= 0) peerScrollRef.current.scrollLeft = todayIdx * 54;
    }
  }, [activeTab, currentMonth]);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex flex-col h-screen overflow-hidden font-sans">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <span style={{ color: theme.subText }} className="text-[10px] font-black uppercase tracking-widest">{format(currentMonth, 'yyyy년')}</span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter">{activeTab === 'all' ? "조회" : format(currentMonth, 'M월')}</h1>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
        <button onClick={() => openPop(setShowSettings)} style={{ backgroundColor: theme.card }} className="w-10 h-10 flex items-center justify-center border rounded-xl shadow-sm"><Settings className="w-5 h-5 opacity-30" /></button>
      </header>

      <main 
        onTouchStart={e => touchX.current = e.touches[0].clientX}
        onTouchEnd={e => {
          if (activeTab !== 'calendar') return;
          const deltaX = e.changedTouches[0].clientX - touchX.current;
          if (deltaX > 80) setCurrentMonth(addMonths(currentMonth, -1));
          else if (deltaX < -80) setCurrentMonth(addMonths(currentMonth, 1));
        }}
        className="flex-1 overflow-hidden"
      >
        {activeTab === 'calendar' ? (
          <div className="h-full flex flex-col px-3 pb-2">
            <div className="grid grid-cols-7 mb-1 text-[10px] font-bold opacity-50 text-center">
              {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ borderColor: theme.border }} className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 border-t border-l">
              {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(d => {
                const s = calculateShift(d, userAnchor.date, userAnchor.index, true);
                const h = getHolidayData(d);
                const isCurr = isSameMonth(d, currentMonth);
                const isT = isSameDay(d, new Date());
                return (
                  <div key={d.toString()} onClick={() => { setSelectedDate(d); openPop(setShowDetail); }}
                       style={{ backgroundColor: isT ? theme.highlight7 : theme.card, borderColor: theme.border, borderWidth: '0.5px', opacity: isCurr?1:0.3 }} 
                       className="flex flex-col p-0.5 overflow-hidden active:bg-slate-50">
                    <div className="flex items-center gap-1 border-b border-black/5 pb-0.5">
                       <span style={{ color: h.isH?'#EF4444':d.getDay()===6?'#3B82F6':theme.text }} className="text-[10px] font-bold">{format(d, 'd')}</span>
                       {h.name && <span className="text-[7px] font-black text-red-400 truncate">{h.name}</span>}
                    </div>
                    <span style={{ color: s.isRed?'#EF4444':getDutyColor(s.label, theme.text) }} className="text-[13px] font-black mt-1 ml-0.5 leading-none">{s.diaNum}</span>
                    <div className="flex flex-col gap-0.5 w-full mt-1">
                      {(memos[format(d, 'yyyy-MM-dd')] || []).slice(0, 3).map((m: any, i: number) => (
                        <div key={i} style={{ color: theme.subText }} className="text-[9px] font-bold truncate px-0.5 leading-tight">{m}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'peers' ? (
          <div className="h-full flex flex-col relative overflow-hidden">
            <div ref={peerScrollRef} className="flex-1 overflow-auto no-scrollbar">
              <table style={{ borderColor: theme.border }} className="border-collapse w-max min-w-full text-center">
                <thead className="sticky top-0 z-20">
                  <tr style={{ backgroundColor: theme.card }}>
                    <th style={{ borderColor: theme.border }} className="p-3 border sticky left-0 z-30 text-[12px] font-black shadow-sm bg-inherit">성명</th>
                    {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => {
                      const h = getHolidayData(d);
                      const isT = isSameDay(d, new Date());
                      return (
                        <th key={d.toString()} style={{ backgroundColor: isT ? theme.highlight7 : theme.card, borderColor: theme.border, color: h.isH?'#EF4444':d.getDay()===6?'#3B82F6':theme.text }} className="p-1.5 border text-[10px] min-w-[54px]">
                          {format(d, 'd')}<br/>{['일','월','화','수','목','금','토'][d.getDay()]}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[{ id: 0, name: '나', anchorD: userAnchor.date, anchorI: userAnchor.index, isUser: true }, ...peers].map(p => (
                    <tr key={p.id}>
                      <td style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-3 border sticky left-0 z-10 text-[12px] font-black shadow-sm">{p.name}</td>
                      {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => {
                        const s = calculateShift(d, p.anchorD, p.anchorI, p.isUser);
                        const standby = getStandbyLoc(s.content1);
                        const closing = s.content2?.match(/\d{1,2}:\d{2}/g)?.pop();
                        const isT = isSameDay(d, new Date());
                        return (
                          <td key={d.toString()} onClick={() => { setSelectedDate(d); openPop(setShowDetail); }}
                              style={{ backgroundColor: isT?theme.highlight7: (s.diaNum==='~'?'#D1D5DB': (s.diaNum.includes('휴')?(isDarkMode?'#411C1C':'#FEE2E2'):theme.card)), borderColor: theme.border }} className="p-2 border h-14 min-w-[54px] relative">
                            {standby && (<div style={{ color: (standby==='동'?'#22D3EE':standby==='불'?'#22C55E':standby==='기'?'#F472B6':'#F97316') }} className="absolute top-0.5 left-1 font-black text-[10px] leading-none">{standby}</div>)}
                            <div style={{ color: s.isRed?'#EF4444':getDutyColor(s.label, theme.text) }} className="text-[14px] font-black">{s.diaNum}</div>
                            {closing && (<div style={{ color: theme.subText }} className="absolute bottom-0.5 right-0.5 font-bold text-[9px] italic leading-none">{closing}</div>)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 동료 편집/추가 버튼 */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button onClick={() => openPop(setShowEditPeers)} className="w-10 h-10 bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90"><Edit3 className="w-4 h-4"/></button>
              <button onClick={() => openPop(setShowAddPeer)} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90"><UserPlus className="w-5 h-5"/></button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="bg-card border-b p-2">
              <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5 border border-black/5 mx-1">
                <Search className="w-3.5 h-3.5 opacity-40 mr-2"/><input placeholder="교번 검색 (예: 2)" className="bg-transparent text-xs outline-none w-full font-bold" onChange={e=>setSearchQuery(e.target.value.trim())} />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1">
              <div className="grid grid-cols-7 gap-0 border-t border-l" style={{ borderColor: theme.border }}>
                {ROTATION_ORDER.map((dia, i) => (
                  <div key={i} style={{ backgroundColor: searchQuery === dia ? theme.highlight7 : theme.card, borderColor: theme.border, borderWidth: '0.3px' }} className="aspect-square flex flex-col items-center justify-center relative">
                    <span className="text-[7px] opacity-20 absolute top-0.5 left-0.5">{i + 1}</span>
                    <span style={{ color: dia.includes('휴')?'#EF4444':theme.text }} className="text-[11px] font-black">{dia}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단바 */}
      <nav style={{ backgroundColor: theme.card, borderColor: theme.border }} className="mx-6 mb-6 px-4 py-2.5 rounded-2xl flex items-center justify-between border shadow-lg shrink-0">
        {[{ id: 'calendar', icon: CalendarIcon, label: "내 근무" }, { id: 'peers', icon: Users, label: "동료" }, { id: 'all', icon: LayoutList, label: "조회" }].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} style={{ color: activeTab === item.id ? '#2563EB' : theme.subText }} className={cn("flex flex-col items-center transition-all duration-200", activeTab === item.id && "scale-110")}>
            <item.icon className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 부품 연결 */}
      {showDetail && (
        <DetailPopup 
          selectedDate={selectedDate}
          detailData={calculateShift(selectedDate, userAnchor.date, userAnchor.index, true)}
          theme={theme}
          onClose={() => window.history.back()}
          onShiftMenu={() => openPop(setShowShiftMenu)}
          onMemoInput={() => openPop(setShowMemoInput)}
          getDutyColor={getDutyColor}
          memoList={memos[format(selectedDate, 'yyyy-MM-dd')] || []}
          onDeleteMemo={(idx) => {
             const dk = format(selectedDate, 'yyyy-MM-dd');
             setMemos({...memos, [dk]: memos[dk].filter((_:any, i:number) => i !== idx)});
          }}
        />
      )}

      {/* 동료 편집 모달 (순서 변경/삭제 기능 포함) */}
      {showEditPeers && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => window.history.back()} />
          <div style={{ backgroundColor: theme.bg, color: theme.text }} className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl max-h-[70vh] flex flex-col">
            <h2 className="text-xl font-black mb-4">동료 편집</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {peers.map((p, i) => (
                <div key={p.id} style={{ backgroundColor: theme.card, borderColor: theme.border }} className="flex items-center py-2 px-3 rounded-xl border gap-3">
                  <div className="flex flex-col">
                    <button onClick={() => { if(i>0) { const up=[...peers]; [up[i-1], up[i]]=[up[i], up[i-1]]; setPeers(up); }}} className="p-1 opacity-30"><ArrowUp className="w-3 h-3"/></button>
                    <button onClick={() => { if(i<peers.length-1) { const up=[...peers]; [up[i], up[i+1]]=[up[i+1], up[i]]; setPeers(up); }}} className="p-1 opacity-30"><ArrowDown className="w-3 h-3"/></button>
                  </div>
                  <div className="flex-1 font-bold text-sm">{p.name}</div>
                  <button onClick={() => setPeers(peers.filter(x=>x.id !== p.id))} className="p-2 text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <button onClick={() => window.history.back()} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-xl font-black">완료</button>
          </div>
        </div>
      )}
      
      {/* ... (그 외 설정, 근무변경, 메모입력 모달 등은 이전 로직과 동일하게 연결) */}
    </div>
  );
};
