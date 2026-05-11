'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, X, ChevronLeft, ChevronRight, Trash2, Moon, Sun, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Check, FileEdit } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- 데이터 상수 (기존 유지) ---
const ROTATION_ORDER = ["대1","49","~","휴1","16","34","~","휴10","8","26","휴16","대12","~","휴22","3","33","42","~","휴4","9","46","~","휴29","대4","18","휴13","51","~","휴19","19","31","43","~","휴7","14","대14","~","휴25","12","40","~","휴28","13","24","휴32","38","~","휴17","1","29","54","~","휴2","대2","44","~","휴30","17","30","37","~","휴11","대5","20","휴23","대13","~","휴5","15","35","~","휴20","10","52","~","휴14","21","27","휴26","47","~","휴8","5","28","53","~","휴31","대3","39","~","휴3","2","대11","~","휴18","6","23","휴12","41","~","휴24","4","32","50","~","휴6","대6","45","~","휴21","11","22","휴15","48","~","휴27","7","25","36","~","휴9"];
const DIA_NUMBERS = [ ...Array.from({ length: 54 }, (_, i) => (i + 1).toString()), "~", "대1", "대2", "대3", "대4", "대5", "대6", "대11", "대12", "대13", "대14" ];
const RED_ITEMS = ['연차', '촉진연차', '대체휴가', '만근휴가', '개인학습', '지정휴무'];
const SAT_BLUE = '#3B82F6';

/**
 * 3. 근무별 글자색 판별 함수
 * 동준 님 요청: 지정/대기/교번교체(파랑), 휴무충당(노랑/금색)
 */
const getDutyColor = (duty: string, defaultColor: string) => {
  if (!duty) return defaultColor;
  if (duty.includes('지정근무') || duty.includes('대기충당') || duty.includes('교번교체')) return '#3B82F6'; // 파란색
  if (duty.includes('휴무충당')) return '#DAA520'; // 진한 황금색 (가독성 확보)
  return defaultColor;
};

const getHolidayInfo = (date: Date) => {
  const mmdd = format(date, 'M-d');
  const hList: { [key: string]: string } = { '1-1': '신정', '3-1': '삼일절', '5-1': '노동절', '5-5': '어린이날', '6-6': '현충일', '8-15': '광복절', '10-3': '개천절', '10-9': '한글날', '12-25': '성탄절' };
  if (date.getFullYear() === 2026) {
    if (['2-16','2-17','2-18'].includes(mmdd)) return { isH: true, name: '설날' };
    if (mmdd === '5-24') return { isH: true, name: '석탄' };
    if (mmdd === '5-25') return { isH: true, name: '대체' };
    if (['9-24','9-25','9-26'].includes(mmdd)) return { isH: true, name: '추석' };
  }
  return { isH: !!hList[mmdd] || date.getDay() === 0, isSat: date.getDay() === 6, name: hList[mmdd] || '' };
};

export const ShiftCalendar = () => {
  const safeParse = (key: string, fallback: any) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } 
    catch (e) { return fallback; }
  };

  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('shift_theme') === 'dark' : false);
  const [peers, setPeers] = useState<any[]>(() => safeParse('shift_peers', []));
  const [overrides, setOverrides] = useState<{ [key: string]: any }>(() => safeParse('shift_overrides', {}));
  const [memos, setMemos] = useState<{ [key: string]: string[] }>(() => safeParse('shift_memos', {}));
  const [userAnchor, setUserConfig] = useState(() => safeParse('shift_user_config', { date: '2026-05-10', index: 15 }));

  const [activeTab, setActiveTab] = useState<'calendar' | 'peers' | 'all'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allData, setAllData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allSubTab, setAllSubTab] = useState<'평'|'휴'|'평평'|'평휴'|'휴휴'|'휴평'|'교번'>('평');
  
  const [showDetail, setShowDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState<{type: string, color: string} | null>(null);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [showEditPeers, setShowEditPeers] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [memoInput, setMemoInput] = useState("");

  const touchX = useRef(0);
  const touchY = useRef(0);
  const [sheetOffset, setSheetOffset] = useState(0);

  useEffect(() => { 
    const refreshData = async () => {
      try { const data = await fetchAllRotationData(); setAllData(data); } catch (e) { console.error("Update Fail"); }
      finally { setIsLoading(false); }
    };
    refreshData();
    window.history.pushState({ main: true }, "");
  }, []);

  // 1. 뒤로가기 제어: 팝업이 있으면 팝업을 닫고, 없으면 어플을 종료합니다.
  useEffect(() => {
    const handlePopState = () => {
      if (showDetail || showSettings || showAddPeer || showEditPeers || showShiftMenu || showDiaPicker) {
        setShowDetail(false); setShowSettings(false); setShowAddPeer(false); 
        setShowEditPeers(false); setShowShiftMenu(false); setShowDiaPicker(null);
        setSheetOffset(0);
        return;
      }
      if (showMemoInput) { setShowMemoInput(false); return; }
      
      // 더 이상 닫을 팝업이 없으면 Capacitor 레이어(또는 __root.tsx)에서 종료 처리하도록 유도
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showDetail, showSettings, showAddPeer, showEditPeers, showShiftMenu, showDiaPicker, showMemoInput]);

  useEffect(() => {
    localStorage.setItem('shift_peers', JSON.stringify(peers));
    localStorage.setItem('shift_overrides', JSON.stringify(overrides));
    localStorage.setItem('shift_memos', JSON.stringify(memos));
    localStorage.setItem('shift_theme', isDarkMode ? 'dark' : 'light');
  }, [peers, overrides, memos, isDarkMode]);

  // 2. 테마 설정 (다크/라이트 모드 글자색 최적화)
  const theme = {
    bg: isDarkMode ? '#000000' : '#FFFFFF', // 라이트모드 배경 흰색 고정
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    subCard: isDarkMode ? '#262626' : '#F9FAFB',
    text: isDarkMode ? '#F3F4F6' : '#111827', // 기본 글자색 검정 계열
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    todayHeaderCalendar: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
    todayHeaderPeers: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    todayColPeers: isDarkMode ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
    offBg: isDarkMode ? '#411C1C' : '#FFF1F1', 
    emptyBg: isDarkMode ? '#2D2D2D' : '#F3F4F6', 
  };

  const openModal = (setter: (v: boolean) => void) => { setSheetOffset(0); window.history.pushState({ modal: true }, ""); setter(true); };

  const getStandbyLoc = (content1?: string) => {
    if (!content1) return null;
    const targets = ['동', '불', '기', '오', '진', '사'];
    for (let i = content1.length - 1; i >= 0; i--) { if (targets.includes(content1[i])) return content1[i]; }
    return null;
  };
  const getStandbyColor = (char: string) => {
    switch (char) { case '동': return '#22D3EE'; case '불': return '#22C55E'; case '기': return '#FF69B4'; default: return theme.text; }
  };

  const getShift = (date: Date, anchorDStr: string, anchorI: number, isUser: boolean = false, currentOverrides?: any) => {
    const dk = format(date, 'yyyy-MM-dd');
    const useOverrides = currentOverrides || overrides;
    const diff = differenceInDays(date, parseISO(anchorDStr));
    const idx = (((anchorI + diff) % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length;
    const calcDia = ROTATION_ORDER[idx] || "";
    const hasOverride = isUser && useOverrides[dk];
    const targetDia = hasOverride ? useOverrides[dk].diaNum : calcDia;
    const isRed = targetDia.includes("휴") || RED_ITEMS.includes(targetDia);

    const base = { diaNum: targetDia, label: "", isRed, reportTime: "", content1: "", content2: "", originalDia: hasOverride && targetDia !== calcDia ? calcDia : null, isUser };
    if (!allData) return base;

    const hInfo = getHolidayInfo(date);
    const numOnly = parseInt(targetDia.replace(/[^0-9]/g, '') || '0', 10);
    let sheet = allData.wd; let label = hInfo.name || (hInfo.isH ? "휴일" : "평일");
    if (numOnly >= 34 && numOnly <= 54) {
      const isTH = getHolidayInfo(addDays(date, 1)).isH;
      if (!hInfo.isH && !isTH) { sheet = allData.ww; label = "평평"; } else if (!hInfo.isH && isTH) { sheet = allData.wh; label = "평휴"; } else if (hInfo.isH && isTH) { sheet = allData.hh; label = "휴휴"; } else { sheet = allData.hw; label = "휴평"; }
    } else if (numOnly >= 1 && numOnly <= 33) { sheet = (date.getDay() === 0 || hInfo.isH) ? allData.hd : allData.wd; }
    const row = (sheet || []).find((item: any) => item.matchNum === targetDia.replace(/[^a-zA-Z0-9가-힣~]/g, ""));
    return { ...base, label: hasOverride ? useOverrides[dk].label : label, ...(row || {}) };
  };

  const SwipeableMemo = ({ text, onRemove }: { text: string, onRemove: () => void }) => {
    const [startX, setStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    return (
      <div className="relative overflow-hidden rounded-2xl bg-red-500 mb-2 h-16 shrink-0">
        <button onClick={onRemove} className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center text-white font-black text-sm">삭제</button>
        <div onTouchStart={e => setStartX(e.touches[0].clientX)} onTouchMove={e => setOffsetX(Math.min(0, e.touches[0].clientX - startX))} onTouchEnd={() => setOffsetX(offsetX < -80 ? -80 : 0)} style={{ transform: `translateX(${offsetX}px)` }} className="absolute inset-0 bg-white dark:bg-neutral-900 border border-black/5 flex items-center px-5 transition-transform duration-200">
          <span className="text-[15px] font-bold text-black dark:text-white truncate">{text}</span>
        </div>
      </div>
    );
  };

  const handleOverride = (type: string, color: string, dia?: string) => {
    const dk = format(selectedDate, 'yyyy-MM-dd');
    const nextOverrides = { ...overrides, [dk]: { diaNum: dia || type, label: type, isRed: color === 'red' } };
    setOverrides(nextOverrides);
    setDetailData(getShift(selectedDate, userAnchor.date, userAnchor.index, true, nextOverrides));
    setShowShiftMenu(false); setShowDiaPicker(null);
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex flex-col h-screen select-none font-sans overflow-hidden relative">
      {/* --- 헤더 --- */}
      <header className="flex items-center justify-between px-6 py-6 shrink-0 z-10">
        <div><span className="text-slate-400 text-[11px] font-black mb-1 block tracking-wider uppercase opacity-80">{format(currentMonth, 'yyyy년')}</span>
          <div className="flex items-center gap-3"><h1 className="text-3xl font-black tracking-tighter">{activeTab === 'all' ? "전체근무" : format(currentMonth, 'M월')}</h1>
            {activeTab !== 'all' && ( <div className="flex gap-1 ml-1 font-sans"> <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} style={{ backgroundColor: theme.card }} className="p-2 border rounded-lg active:scale-90 cursor-pointer"><ChevronLeft className="w-4 h-4"/></button> <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ backgroundColor: theme.card }} className="p-2 border rounded-lg active:scale-90 cursor-pointer"><ChevronRight className="w-4 h-4"/></button> </div> )}
          </div>
        </div>
        <button onClick={() => openModal(setShowSettings)} style={{ backgroundColor: theme.card }} className="w-12 h-12 flex items-center justify-center border rounded-xl active:scale-95 shadow-sm cursor-pointer z-20 font-sans"><Settings className="w-6 h-6 text-slate-400" /></button>
      </header>

      {/* --- 메인 콘텐츠 --- */}
      <main 
        onTouchStart={e => touchX.current = e.touches[0].clientX} 
        onTouchEnd={e => {
          const deltaX = e.changedTouches[0].clientX - touchX.current;
          if (deltaX > 70) setCurrentMonth(addMonths(currentMonth, -1));
          else if (deltaX < -70) setCurrentMonth(addMonths(currentMonth, 1));
        }}
        className="flex-1 flex flex-col overflow-hidden font-sans"
      >
        {isLoading ? ( <div className="flex-1 p-4 grid grid-cols-7 gap-1.5 animate-pulse"> {Array.from({ length: 35 }).map((_, i) => ( <div key={i} className="aspect-[3/4] bg-slate-200 dark:bg-neutral-800 rounded-xl" /> ))} </div>
        ) : activeTab === 'calendar' ? (
            <div className="flex-1 flex flex-col px-3 h-full overflow-hidden">
                <div className="grid grid-cols-7 mb-2 text-[11px] font-black opacity-60"> {['일','월','화','수','목','금','토'].map((d, i) => ( <div key={d} style={{ color: i===0 ? '#EF4444' : i===6 ? SAT_BLUE : theme.text }} className="text-center py-2">{d}</div> ))} </div>
                
                {/* 4. 달력 UI: 간격 0으로 밀착시키고 테두리로 구분 */}
                <div style={{ borderColor: theme.border }} className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 pb-4 border-t border-l">
                {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(d => {
                    const s = getShift(d, userAnchor.date, userAnchor.index, true);
                    const dk = format(d, 'yyyy-MM-dd'); const isCurr = isSameMonth(d, currentMonth); const isT = isSameDay(d, new Date());
                    const h = getHolidayInfo(d);
                    return (
                        <div key={d.toString()} onClick={() => { setSelectedDate(d); setDetailData(s); openModal(setShowDetail); }}
                             style={{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: '0.5px', opacity: isCurr ? 1 : 0.15 }}
                             className={cn("relative flex flex-col transition-all overflow-hidden active:bg-slate-50 dark:active:bg-neutral-800 cursor-default font-sans")}>
                            
                            <div style={{ backgroundColor: isT ? theme.todayHeaderCalendar : theme.subCard }} className="py-1 px-1.5 flex items-center justify-between border-b border-black/5 dark:border-white/5">
                                <span style={{ color: h.isH ? '#EF4444' : h.isSat ? SAT_BLUE : theme.text }} className="text-[12px] font-bold">{format(d, 'd')}</span>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-start pt-1 px-0.5 gap-0.5 overflow-hidden">
                                {/* 근무 글자색 적용 (지정/대기/교번: 파랑, 휴무충당: 노랑) */}
                                <span style={{ color: s.isRed ? '#EF4444' : getDutyColor(s.label, theme.text) }} className="text-[15px] font-black tracking-tighter leading-none">{s.diaNum}</span>
                                
                                {(memos[dk] || []).length > 0 && <div className="w-5 h-0.5 bg-blue-500/30 mt-1 mb-0.5" />}
                                <div className="flex-1 w-full flex flex-col gap-0.5 overflow-hidden">
                                  {(memos[dk] || []).map((m, idx) => (<div key={idx} className="w-full text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate text-center leading-tight">{m}</div>))}
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        ) : activeTab === 'peers' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative font-sans">
                <div className="flex-1 overflow-auto">
                <table className="border-collapse w-max min-w-full font-sans text-center">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }} className="p-4 border sticky left-0 z-30 text-[13px] font-black shadow-md">성명</th>
                            {eachDayOfInterval({ start: peerStartDate, end: endOfMonth(currentMonth) }).map(d => {
                                const isT = isSameDay(d, new Date()); const h = getHolidayInfo(d);
                                return ( <th key={d.toString()} style={{ color: h.isH ? '#EF4444' : h.isSat ? SAT_BLUE : theme.text, borderColor: theme.border, backgroundColor: isT ? theme.todayHeaderPeers : theme.bg }} className="p-2 border text-[11px] min-w-[60px] relative font-sans text-center"> {isT && <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[7px] font-black bg-emerald-500 text-white px-1 rounded-sm shadow-sm">TODAY</span>} {format(d, 'd')}<br/>{['일','월','화','수','목','금','토'][d.getDay()]} </th> );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                    {[{ id: 0, name: '나', anchorD: userAnchor.date, anchorI: userAnchor.index, isUser: true }, ...peers].map(p => (
                        <tr key={p.id}>
                        <td style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }} className="p-4 border sticky left-0 z-10 text-[13px] font-black shadow-sm">{p.name}</td>
                        {eachDayOfInterval({ start: peerStartDate, end: endOfMonth(currentMonth) }).map(d => {
                            const s = getShift(d, p.anchorD, p.anchorI, p.isUser); const isT = isSameDay(d, new Date()); 
                            const isOff = s.diaNum.includes('휴'); const isE = s.diaNum === '~';
                            const standby = getStandbyLoc(s.content1); const standbyColor = standby ? getStandbyColor(standby) : null;
                            const closingTime = s.content2?.match(/\d{1,2}:\d{2}/g)?.pop();
                            return (
                            <td key={d.toString()} onClick={() => { setSelectedDate(d); setDetailData(s); openModal(setShowDetail); }}
                                style={{ backgroundColor: isT ? theme.todayColPeers : (isE ? theme.emptyBg : (isOff ? theme.offBg : 'transparent')), borderColor: theme.border }} 
                                className="p-2 border text-center cursor-default active:opacity-60 transition-all relative h-16">
                                {standby && (<div style={{ color: standbyColor }} className="absolute top-0.5 left-1 font-black text-[12px] leading-none select-none">{standby}</div>)}
                                {/* 동료 근무 글자색 적용 */}
                                <div style={{ color: isOff ? '#EF4444' : getDutyColor(s.label, theme.text) }} className={cn("text-[15px] font-black", isT && "scale-110")}>{s.diaNum}</div>
                                {closingTime && (<div style={{ color: isDarkMode ? '#9CA3AF' : '#64748B' }} className="absolute bottom-1 right-0.5 font-black text-[12px] italic leading-none">{closingTime}</div>)}
                            </td>
                            );
                        })}
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
                    <button onClick={() => openModal(setShowEditPeers)} className="w-12 h-12 bg-slate-700 text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 cursor-pointer"><Edit3 className="w-5 h-5"/></button>
                    <button onClick={() => openModal(setShowAddPeer)} className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 cursor-pointer"><UserPlus className="w-6 h-6"/></button>
                </div>
            </div>
        ) : (
            <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex-1 flex flex-col h-full overflow-hidden font-sans">
                <div className="flex gap-1 p-2 overflow-x-auto no-scrollbar border-b border-black/5 dark:border-white/5">
                {['평','휴','평평','평휴','휴휴','휴평','교번'].map(t => (
                    <button key={t} onClick={() => setAllSubTab(t as any)} className={cn("px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap font-sans", allSubTab === t ? "bg-slate-800 text-white shadow-md" : "bg-slate-100 dark:bg-neutral-900 text-slate-400")}>{t}</button>
                ))}
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full border-collapse">
                    <thead style={{ backgroundColor: theme.subCard, color: theme.text }} className="sticky top-0 z-10">
                        <tr className="text-[10px] font-black uppercase text-center opacity-60"> <th className="p-3 border-b dark:border-white/5 w-14">DIA</th> <th className="p-3 border-b dark:border-white/5 w-16 text-center">출근</th> <th className="p-3 border-b dark:border-white/5 text-center">전반 사업</th> <th className="p-3 border-b dark:border-white/5 text-center">후반 사업</th> </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-white/5">
                        {allData?.[allSubTab==='평'?'wd':allSubTab==='휴'?'hd':allSubTab==='평평'?'ww':allSubTab==='평휴'?'wh':allSubTab==='휴휴'?'hh':'hw']?.map((row: any, i: number) => (
                        <tr key={i} style={{ backgroundColor: theme.card, color: theme.text }} className="active:bg-blue-500/5 text-center text-[11px] font-medium opacity-90">
                            <td className="p-3 text-[13px] font-black text-inherit">{row.matchNum}</td>
                            <td className="p-3 text-[13px] font-black text-inherit">{row.reportTime}</td>
                            <td className="p-3 text-center whitespace-pre-wrap break-words text-inherit">{row.content1}</td> 
                            <td className="p-3 text-center whitespace-pre-wrap break-words text-inherit">{row.content2}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>

      {/* --- 하단 탭 바 --- */}
      <nav style={{ backgroundColor: theme.card, borderColor: theme.border }} className="mx-6 mb-6 px-2 py-2 rounded-2xl flex items-center justify-between border shadow-lg relative z-10 shrink-0 font-sans">
        <button onClick={() => setActiveTab('calendar')} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-sans", activeTab==='calendar' ? "bg-slate-100 dark:bg-neutral-800 text-black dark:text-white" : "text-slate-400")}><CalendarIcon className="w-5 h-5" /><span className="text-[11px] font-bold">내 근무</span></button>
        <button onClick={() => setActiveTab('peers')} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-sans", activeTab==='peers' ? "bg-slate-100 dark:bg-neutral-800 text-black dark:text-white" : "text-slate-400")}><Users className="w-5 h-5" /><span className="text-[11px] font-bold">동료 근무</span></button>
        <button onClick={() => setActiveTab('all')} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-sans", activeTab==='all' ? "bg-slate-100 dark:bg-neutral-800 text-black dark:text-white" : "text-slate-400")}><LayoutList className="w-5 h-5" /><span className="text-[11px] font-bold">전체 근무</span></button>
      </nav>

      {/* --- 통합 상세 팝업 (가독성/글자색 반영) --- */}
      {showDetail && detailData && (
        <div className={cn("fixed inset-0 z-[200] flex transition-all duration-300 font-sans", activeTab === 'peers' ? "items-end justify-center" : "items-center justify-center")}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => window.history.back()} />
            <div 
              style={{ backgroundColor: theme.bg, transform: activeTab === 'peers' ? `translateY(${sheetOffset}px)` : 'none' }} 
              onTouchStart={e => { if (activeTab === 'peers') touchY.current = e.touches[0].clientY; }} 
              onTouchMove={e => { if (activeTab === 'peers') setSheetOffset(Math.max(0, e.touches[0].clientY - touchY.current)); }} 
              onTouchEnd={() => { if (activeTab === 'peers') { if (sheetOffset > 90) window.history.back(); else setSheetOffset(0); } }} 
              className={cn("relative z-10 flex flex-col shadow-2xl transition-all duration-500 ease-out overflow-y-auto", activeTab === 'peers' ? "w-full h-[75vh] rounded-t-[40px] p-7 animate-in slide-in-from-bottom" : "w-full h-screen p-6")}
            >
                <div className="flex justify-end w-full shrink-0">
                  <button onClick={() => window.history.back()} style={{ backgroundColor: theme.card }} className="p-3 rounded-full shadow-sm cursor-pointer text-black dark:text-white border border-black/5 active:scale-90"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex-1 flex flex-col mt-12 font-sans relative text-black dark:text-white">
                    <div className="flex justify-between items-end mb-8 font-sans">
                      <div>
                        <span className="text-blue-500 font-black text-[12px] uppercase tracking-widest block mb-1">{format(selectedDate, 'M월 d일')}</span>
                        <h2 className="text-4xl font-black tracking-tighter leading-none">
                          {['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][selectedDate.getDay()]}
                        </h2>
                      </div>
                      
                      {detailData.isUser && (
                        <button 
                          onClick={() => { window.history.pushState({ modal: true }, ""); setShowShiftMenu(true); }} 
                          style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                          className="px-5 py-3 rounded-2xl font-black text-[13px] border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all cursor-pointer text-slate-500 dark:text-slate-400"
                        >
                          근무 변경
                        </button>
                      )}
                    </div>

                    <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-[32px] p-8 flex justify-between items-center shadow-sm mb-6">
                        <div className="flex flex-col items-center gap-2"> 
                          <div style={{ backgroundColor: theme.subCard }} className="w-20 h-20 rounded-[24px] flex items-center justify-center border shadow-inner"> 
                            {/* 팝업 내 근무 글자색 적용 */}
                            <span style={{ color: detailData.isRed ? '#EF4444' : getDutyColor(detailData.label, theme.text), fontSize: detailData.diaNum?.length > 3 ? '18px' : detailData.diaNum?.length > 2 ? '22px' : '36px' }} className="font-black whitespace-nowrap">{detailData.diaNum}</span> 
                          </div> 
                          <span className="text-[12px] font-black uppercase opacity-50 tracking-wider"> {detailData.label} </span> 
                        </div>
                        <div className="text-right"><div className="text-[11px] font-black mb-1 opacity-40 uppercase tracking-widest">출근 시간</div><div className="text-5xl font-black tracking-tighter">{detailData.reportTime || "--:--"}</div></div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {[{ t: '전반', con: detailData.content1 }, { t: '후반', con: detailData.content2 }].map((v, i) => v.con && (
                          <div key={i} style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-[24px] p-5 flex items-center gap-4 shadow-sm shrink-0">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-[11px] shrink-0">{v.t}</div>
                              <div className={cn("font-bold leading-relaxed whitespace-pre-wrap break-words", activeTab === 'peers' ? "text-[17px]" : "text-[16px]")}>{v.con}</div>
                          </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 mt-6 mb-24">
                      {(memos[format(selectedDate, 'yyyy-MM-dd')] || []).map((m, idx) => (
                        <SwipeableMemo key={idx} text={m} onRemove={() => setMemos({ ...memos, [format(selectedDate, 'yyyy-MM-dd')]: memos[format(selectedDate, 'yyyy-MM-dd')].filter((_, i) => i !== idx) })} />
                      ))}
                    </div>

                    <button onClick={() => setShowMemoInput(true)} style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }} className="fixed bottom-10 right-10 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-[210] backdrop-blur-xl border border-black/5">
                      <FileEdit className="w-7 h-7 text-blue-500" />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- 각종 모달 (생략 없이 원본 유지) --- */}
      {showMemoInput && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMemoInput(false)} />
          <div style={{ backgroundColor: theme.card }} className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex items-center gap-3" onClick={e=>e.stopPropagation()}>
            <input autoFocus value={memoInput} onChange={e => setMemoInput(e.target.value)} className="flex-1 bg-slate-100 dark:bg-neutral-800 p-4 rounded-2xl font-bold outline-none text-black dark:text-white" placeholder="메모 입력..." />
            <button onClick={() => { if(!memoInput.trim()) return; const dk = format(selectedDate, 'yyyy-MM-dd'); setMemos({ ...memos, [dk]: [...(memos[dk] || []), memoInput] }); setMemoInput(""); setShowMemoInput(false); }} className="bg-blue-500 text-white p-4 rounded-2xl active:scale-95 shadow-lg"> <Check className="w-6 h-6" /> </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250] flex items-center justify-center p-6 animate-in fade-in" onClick={() => window.history.back()}>
          <div style={{ backgroundColor: theme.card }} className="w-full max-w-sm rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 font-sans"><h2 className="text-2xl font-black text-black dark:text-white">설정</h2><X onClick={() => window.history.back()} className="w-6 h-6 opacity-30 cursor-pointer text-black dark:text-white" /></div>
            <div className="space-y-6 text-center font-sans">
                <div style={{ backgroundColor: theme.subCard }} className="p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                    <label className="block text-[10px] font-black uppercase mb-4 opacity-40 tracking-widest text-slate-500">내 근무 기준 설정</label>
                    <input id="uDate" type="date" defaultValue={userAnchor.date} className="w-full p-3 rounded-xl text-sm font-bold outline-none text-center mb-4 bg-white dark:bg-neutral-800 text-black dark:text-white border border-black/5" />
                    <select id="uDia" defaultValue={ROTATION_ORDER[userAnchor.index]} className="w-full p-3 rounded-xl text-sm font-bold outline-none text-center mb-4 bg-white dark:bg-neutral-800 text-black dark:text-white border border-black/5">{DIA_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}</select>
                    <button onClick={() => { const d = (document.getElementById('uDate') as HTMLInputElement).value; const dia = (document.getElementById('uDia') as HTMLSelectElement).value; const findIdx = ROTATION_ORDER.indexOf(dia); if(findIdx !== -1) { setUserConfig({ date: d, index: findIdx }); localStorage.setItem('shift_user_config', JSON.stringify({ date: d, index: findIdx })); window.history.back(); } }} className="w-full bg-slate-800 dark:bg-slate-200 text-white dark:text-black py-3 rounded-xl font-black text-xs">기준 저장</button>
                </div>
                <div style={{ backgroundColor: theme.subCard, borderColor: theme.border }} className="flex items-center justify-between p-5 rounded-2xl border">
                  <div className="flex items-center gap-3 text-black dark:text-white"> {isDarkMode ? <><Moon className="w-5 h-5 text-blue-400" /><span className="font-bold text-sm">다크 모드</span></> : <><Sun className="w-5 h-5 text-orange-400" /><span className="font-bold text-sm">라이트 모드</span></>} </div>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-12 h-7 rounded-full p-1 transition-all", isDarkMode?"bg-blue-600":"bg-slate-300")}><div className={cn("w-5 h-5 bg-white rounded-full transition-transform shadow-lg", isDarkMode?"translate-x-5":"translate-x-0")} /></button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showShiftMenu && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-6" onClick={() => setShowShiftMenu(false)}>
          <div style={{ backgroundColor: theme.card }} className="w-full max-w-sm rounded-3xl p-6 shadow-2xl grid grid-cols-2 gap-3" onClick={e=>e.stopPropagation()}>
            {RED_ITEMS.map(t => <button key={t} onClick={() => handleOverride(t, 'red')} className="py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs active:scale-95 cursor-pointer">{t}</button>)}
            {['지정근무', '대기충당', '교번교체', '휴무충당'].map(t => <button key={t} onClick={() => openModal(setShowDiaPicker.bind(null, {type: t, color: t === '휴무충당' ? 'yellow' : 'blue'}))} className={cn("py-3 rounded-xl font-bold text-xs active:scale-95 cursor-pointer", t === '휴무충당' ? "bg-yellow-50 text-yellow-600" : "bg-slate-100 text-slate-800")}>{t}</button>)}
            <button onClick={() => { const dk = format(selectedDate, 'yyyy-MM-dd'); const up = { ...overrides }; delete up[dk]; setOverrides(up); setDetailData(getShift(selectedDate, userAnchor.date, userAnchor.index, true, up)); setShowShiftMenu(false); }} className="col-span-2 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs italic cursor-pointer">원래 근무 복구</button>
          </div>
        </div>
      )}

      {showDiaPicker && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-8 overflow-y-auto">
          <h3 className="text-white text-xl font-black mb-6 text-center">{showDiaPicker.type} 번호 선택</h3>
          <div className="w-full bg-white rounded-3xl p-2 max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-2 font-sans">
            {DIA_NUMBERS.map(n => (<button key={n} onClick={() => handleOverride(showDiaPicker.type, showDiaPicker.color, n)} className="py-4 border rounded-xl font-black text-lg active:bg-slate-200 text-black cursor-pointer font-sans">{n}</button>))}
          </div>
          <button onClick={() => setShowDiaPicker(null)} className="mt-8 text-white font-bold underline p-4 text-center cursor-pointer font-sans">취소</button>
        </div>
      )}

      {showAddPeer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-6 font-sans" onClick={() => window.history.back()}>
          <div style={{ backgroundColor: theme.card }} className="w-full max-w-sm rounded-[32px] p-8 shadow-2xl font-sans" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 font-sans"><h2 className="text-2xl font-black text-black dark:text-white text-center">동료 등록</h2><X onClick={() => window.history.back()} className="w-6 h-6 opacity-30 cursor-pointer text-black dark:text-white" /></div>
            <div className="space-y-6 text-center">
              <input id="pName" type="text" className="w-full p-4 rounded-2xl font-bold text-center outline-none bg-slate-50 dark:bg-neutral-800 text-black dark:text-white border border-black/5" placeholder="이름" />
              <input id="pDate" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full p-4 rounded-2xl font-bold outline-none text-center bg-slate-50 dark:bg-neutral-800 text-black dark:text-white border border-black/5" />
              <select id="pDia" className="w-full p-4 rounded-2xl font-bold outline-none text-center bg-slate-50 dark:bg-neutral-800 text-black dark:text-white border border-black/5">{DIA_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}</select>
              <button onClick={() => { const n = (document.getElementById('pName') as HTMLInputElement).value; const d = (document.getElementById('pDate') as HTMLInputElement).value; const dia = (document.getElementById('pDia') as HTMLSelectElement).value; const findIdx = ROTATION_ORDER.indexOf(dia); if(n && findIdx !== -1) { setPeers([...peers, { id: Date.now(), name: n, anchorD: d, anchorI: findIdx }]); window.history.back(); } }} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black shadow-lg cursor-pointer">등록 완료</button>
            </div>
          </div>
        </div>
      )}

      {showEditPeers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex items-center justify-center p-6 font-sans" onClick={() => window.history.back()}>
          <div style={{ backgroundColor: theme.card }} className="w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col max-h-[75vh]" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 font-sans"><h2 className="text-2xl font-black text-black dark:text-white text-center">동료 편집</h2><X onClick={() => window.history.back()} className="w-6 h-6 opacity-30 cursor-pointer text-black dark:text-white" /></div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {peers.map((p, i) => (
                <div key={p.id} style={{ backgroundColor: theme.subCard }} className="flex items-center py-2.5 px-4 rounded-xl border border-black/5 dark:border-white/5 gap-4">
                  <div className="flex flex-col gap-0.5"><button onClick={() => { const up = [...peers]; if(i>0) {[up[i-1], up[i]] = [up[i], up[i-1]]; setPeers(up);}}} className="p-1 opacity-40 active:opacity-100 disabled:invisible cursor-pointer text-black dark:text-white" disabled={i===0}><ArrowUp className="w-3.5 h-3.5"/></button><button onClick={() => { const up = [...peers]; if(i<peers.length-1) {[up[i], up[i+1]] = [up[i+1], up[i]]; setPeers(up);}}} className="p-1 opacity-40 active:opacity-100 disabled:invisible cursor-pointer text-black dark:text-white" disabled={i===peers.length-1}><ArrowDown className="w-3.5 h-3.5"/></button></div>
                  <div className="flex-1 font-bold text-[15px] text-black dark:text-white">{p.name}</div>
                  <button onClick={() => setPeers(peers.filter(x=>x.id !== p.id))} className="p-2.5 bg-red-500/10 text-red-500 rounded-lg active:scale-90 cursor-pointer font-sans"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <button onClick={() => window.history.back()} className="w-full bg-slate-800 text-white py-3.5 rounded-2xl font-black mt-6 active:scale-95">편집 완료</button>
          </div>
        </div>
      )}
    </div>
  );
};
