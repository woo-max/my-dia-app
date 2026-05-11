'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, X, ChevronLeft, ChevronRight, Trash2, Moon, Sun, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Check, FileEdit, Search } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- 데이터 상수 ---
const ROTATION_ORDER = ["대1","49","~","휴1","16","34","~","휴10","8","26","휴16","대12","~","휴22","3","33","42","~","휴4","9","46","~","휴29","대4","18","휴13","51","~","휴19","19","31","43","~","휴7","14","대14","~","휴25","12","40","~","휴28","13","24","휴32","38","~","휴17","1","29","54","~","휴2","대2","44","~","휴30","17","30","37","~","휴11","대5","20","휴23","대13","~","휴5","15","35","~","휴20","10","52","~","휴14","21","27","휴26","47","~","휴8","5","28","53","~","휴31","대3","39","~","휴3","2","대11","~","휴18","6","23","휴12","41","~","휴24","4","32","50","~","휴6","대6","45","~","휴21","11","22","휴15","48","~","휴27","7","25","36","~","휴9"];
const DIA_NUMBERS = [ ...Array.from({ length: 54 }, (_, i) => (i + 1).toString()), "~", "대1", "대2", "대3", "대4", "대5", "대6", "대11", "대12", "대13", "대14" ];
const RED_ITEMS = ['연차', '촉진연차', '대체휴가', '만근휴가', '개인학습', '지정휴무'];
const SAT_BLUE = '#3B82F6';

export const ShiftCalendar = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('shift_theme') === 'dark' : false);
  const safeParse = (key: string, fallback: any) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch (e) { return fallback; }
  };

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
  const [searchQuery, setSearchQuery] = useState("");

  const [showDetail, setShowDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState<{type: string, color: string} | null>(null);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [showEditPeers, setShowEditPeers] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [memoInput, setMemoInput] = useState("");

  const peerScrollRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);

  const theme = {
    bg: isDarkMode ? '#000000' : '#E5E7EB',
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FAFAFA' : '#1C1C1E',
    subText: isDarkMode ? '#A1A1AA' : '#636E72',
    border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    highlight7: 'rgba(16, 185, 129, 0.07)',
  };

  // 1. 2026년 공휴일 및 대체공휴일 데이터 (명칭 줄바꿈 방지)
  const getHolidayInfo = useCallback((date: Date) => {
    const mmdd = format(date, 'M-d');
    const hList: { [key: string]: string } = { 
      '1-1': '신정', '3-1': '삼일절', '5-1': '노동절', '5-5': '어린이날', 
      '6-6': '현충일', '8-15': '광복절', '10-3': '개천절', '10-9': '한글날', '12-25': '성탄절' 
    };
    if (date.getFullYear() === 2026) {
      if (['2-16','2-17','2-18'].includes(mmdd)) return { isH: true, name: '설날' };
      if (mmdd === '2-19') return { isH: true, name: '대체' };
      if (mmdd === '5-24') return { isH: true, name: '석탄' };
      if (mmdd === '5-25') return { isH: true, name: '대체' };
      if (['9-24','9-25','9-26'].includes(mmdd)) return { isH: true, name: '추석' };
      if (mmdd === '9-28') return { isH: true, name: '대체' };
    }
    return { isH: !!hList[mmdd] || date.getDay() === 0, isSat: date.getDay() === 6, name: hList[mmdd] || '' };
  }, []);

  const getShift = useCallback((date: Date, anchorDStr: string, anchorI: number, isUser: boolean = false) => {
    try {
      const dk = format(date, 'yyyy-MM-dd');
      const diff = differenceInDays(date, parseISO(anchorDStr));
      const idx = (((anchorI + diff) % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length;
      const calcDia = ROTATION_ORDER[idx] || "";
      const targetDia = (isUser && overrides[dk]) ? overrides[dk].diaNum : calcDia;
      const isRed = targetDia.includes("휴") || RED_ITEMS.includes(targetDia);

      const base = { diaNum: targetDia, label: (isUser && overrides[dk]) ? overrides[dk].label : "", isRed, reportTime: "", content1: "", content2: "", isUser };
      if (!allData) return base;

      const hInfo = getHolidayInfo(date);
      const numOnly = parseInt(targetDia.replace(/[^0-9]/g, '') || '0', 10);
      
      let sheet = allData.wd; let label = hInfo.name || (hInfo.isH ? "휴일" : "평일");
      if (numOnly >= 34 && numOnly <= 54) {
        const isTH = getHolidayInfo(addDays(date, 1)).isH;
        if (!hInfo.isH && !isTH) { sheet = allData.ww; label = "평평"; } 
        else if (!hInfo.isH && isTH) { sheet = allData.wh; label = "평휴"; } 
        else if (hInfo.isH && isTH) { sheet = allData.hh; label = "휴휴"; } 
        else { sheet = allData.hw; label = "휴평"; }
      } else if (numOnly >= 1 && numOnly <= 33) {
        sheet = (date.getDay() === 0 || hInfo.isH) ? allData.hd : allData.wd;
      }
      
      const row = (sheet || []).find((item: any) => item.matchNum === targetDia.replace(/[^a-zA-Z0-9가-힣~]/g, ""));
      return { ...base, label: base.label || label, ...(row || {}) };
    } catch (e) {
      return { diaNum: "?", label: "", isRed: false, reportTime: "", content1: "", content2: "", isUser };
    }
  }, [allData, overrides, getHolidayInfo]);

  useEffect(() => {
    if (showDetail) setDetailData(getShift(selectedDate, userAnchor.date, userAnchor.index, true));
  }, [selectedDate, overrides, allData, showDetail, getShift, userAnchor]);

  useEffect(() => {
    const refreshData = async () => {
      try {
        const data = await fetchAllRotationData();
        if (data) setAllData(data);
      } catch (e) { console.error("Sheet Load Error"); }
      finally { setIsLoading(false); }
    };
    refreshData();
  }, []);

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

  const SwipeableMemo = ({ text, onRemove }: { text: string, onRemove: () => void }) => {
    const [startX, setStartX] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    return (
      <div className="relative overflow-hidden rounded-xl bg-red-500 mb-1.5 h-12 shrink-0">
        <button onClick={onRemove} className="absolute right-0 top-0 bottom-0 w-16 text-white font-black text-xs">삭제</button>
        <div onTouchStart={e => setStartX(e.touches[0].clientX)} onTouchMove={e => setOffsetX(Math.min(0, e.touches[0].clientX - startX))} onTouchEnd={() => setOffsetX(offsetX < -60 ? -60 : 0)} style={{ transform: `translateX(${offsetX}px)`, backgroundColor: theme.card }} className="absolute inset-0 border border-black/5 flex items-center px-4 transition-transform duration-200">
          <span style={{ color: theme.text }} className="text-[14px] font-bold truncate">{text}</span>
        </div>
      </div>
    );
  };

  if (isLoading) return <div style={{ backgroundColor: theme.bg }} className="h-screen w-screen flex items-center justify-center font-black text-slate-400">데이터 로딩 중...</div>;

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex flex-col h-screen select-none font-sans overflow-hidden relative">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0 z-10">
        <div>
          <span style={{ color: theme.subText }} className="text-[10px] font-black uppercase tracking-widest">{format(currentMonth, 'yyyy년')}</span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter">{activeTab === 'all' ? "조회" : format(currentMonth, 'M월')}</h1>
            {activeTab !== 'all' && (
              <div className="flex gap-1">
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-1"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1"><ChevronRight className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => openPop(setShowSettings)} style={{ backgroundColor: theme.card }} className="w-10 h-10 flex items-center justify-center border rounded-xl shadow-sm"><Settings className="w-5 h-5 opacity-40" /></button>
      </header>

      {/* 메인 뷰 */}
      <main 
        onTouchStart={e => touchX.current = e.touches[0].clientX}
        onTouchEnd={e => {
          if (activeTab !== 'calendar') return;
          const deltaX = e.changedTouches[0].clientX - touchX.current;
          if (deltaX > 80) setCurrentMonth(addMonths(currentMonth, -1));
          else if (deltaX < -80) setCurrentMonth(addMonths(currentMonth, 1));
        }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        {activeTab === 'calendar' ? (
          <div className="flex-1 flex flex-col px-3 pb-2 h-full overflow-hidden">
            <div className="grid grid-cols-7 mb-1 text-[10px] font-bold opacity-50 text-center">
              {['일','월','화','수','목','금','토'].map((d, i) => (<div key={d} style={{ color: i===0?'#EF4444':i===6?SAT_BLUE:theme.text }}>{d}</div>))}
            </div>
            <div style={{ borderColor: theme.border }} className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 border-t border-l">
              {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(d => {
                const s = getShift(d, userAnchor.date, userAnchor.index, true);
                const isCurr = isSameMonth(d, currentMonth); const isT = isSameDay(d, new Date()); const h = getHolidayInfo(d);
                return (
                  <div key={d.toString()} onClick={() => { setSelectedDate(d); openPop(setShowDetail); }}
                       style={{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: '0.5px', opacity: isCurr?1:0.3 }}
                       className="relative flex flex-col active:bg-slate-50 overflow-hidden">
                    <div style={{ backgroundColor: isT ? theme.highlight7 : 'transparent' }} className="py-0.5 px-1 border-b border-black/5 flex items-center gap-1">
                      <span style={{ color: h.isH ? '#EF4444' : h.isSat ? SAT_BLUE : theme.text }} className="text-[10px] font-bold">{format(d, 'd')}</span>
                      {h.name && <span className="text-[7px] font-black text-red-400 whitespace-nowrap truncate">{h.name}</span>}
                    </div>
                    <div className="flex-1 flex flex-col items-start p-0.5 overflow-hidden">
                      <span style={{ color: s.isRed ? '#EF4444' : getDutyColor(s.label, theme.text) }} className="text-[13px] font-black leading-none ml-0.5 mt-0.5">{s.diaNum}</span>
                      <div className="flex flex-col gap-0.5 w-full mt-0.5 overflow-hidden">
                        {(memos[format(d, 'yyyy-MM-dd')] || []).slice(0, 3).map((m, i) => (<div key={i} className="text-[9.5px] font-bold truncate px-0.5 opacity-60 leading-none">{m}</div>))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'peers' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div ref={peerScrollRef} className="flex-1 overflow-auto no-scrollbar">
              <table style={{ borderColor: theme.border }} className="border-collapse w-max min-w-full text-center">
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th style={{ backgroundColor: theme.card, color: theme.text, borderColor: theme.border }} className="p-3 border sticky left-0 z-30 text-[12px] font-black shadow-sm">성명</th>
                    {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => {
                      const isT = isSameDay(d, new Date()); const h = getHolidayInfo(d);
                      return (
                        <th key={d.toString()} style={{ backgroundColor: isT ? theme.highlight7 : theme.card, borderColor: theme.border, color: h.isH ? '#EF4444' : h.isSat ? SAT_BLUE : theme.text }} className="p-1.5 border text-[10px] min-w-[54px]">
                          {format(d, 'd')}<br/>{['일','월','화','수','목','금','토'][d.getDay()]}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[{ id: 0, name: '나', anchorD: userAnchor.date, anchorI: userAnchor.index, isUser: true }, ...peers].map(p => (
                    <tr key={p.id}>
                      <td style={{ backgroundColor: theme.card, borderColor: theme.border, color: theme.text }} className="p-3 border sticky left-0 z-10 text-[12px] font-black shadow-sm">{p.name}</td>
                      {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => {
                        const s = getShift(d, p.anchorD, p.anchorI, p.isUser);
                        const standby = (s && s.content1) ? ['사', '진', '오', '기', '불', '동'].find(t => s.content1.includes(t)) : null;
                        const closing = s.content2?.match(/\d{1,2}:\d{2}/g)?.pop();
                        return (
                          <td key={d.toString()} style={{ backgroundColor: isSameDay(d, new Date())?theme.highlight7: (s.diaNum === '~' ? '#D1D5DB' : (s.diaNum.includes('휴') ? (isDarkMode ? '#411C1C' : '#FEE2E2') : theme.card)), borderColor: theme.border }} className="p-2 border h-14 min-w-[54px] relative">
                            {standby && (<div style={{ color: (standby==='동'?'#22D3EE':standby==='불'?'#22C55E':standby==='기'?'#F472B6':'#F97316') }} className="absolute top-0.5 left-1 font-black text-[10px] leading-none">{standby}</div>)}
                            <div style={{ color: s.isRed ? '#EF4444' : getDutyColor(s.label, theme.text) }} className="text-[13px] font-black">{s.diaNum}</div>
                            {closing && (<div style={{ color: theme.subText }} className="absolute bottom-0.5 right-0.5 font-bold text-[9px] italic leading-none">{closing}</div>)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <button onClick={() => openPop(setShowEditPeers)} className="w-10 h-10 bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center"><Edit3 className="w-4 h-4"/></button>
              <button onClick={() => openPop(setShowAddPeer)} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"><UserPlus className="w-5 h-5"/></button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-card border-b flex flex-col gap-2 p-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {['평','휴','평평','평휴','휴휴','휴평','교번'].map(t => (
                  <button key={t} onClick={() => setAllSubTab(t as any)} className={cn("px-4 py-2 rounded-lg text-[11px] font-black transition-all whitespace-nowrap", allSubTab === t ? "bg-slate-800 text-white shadow-sm" : "bg-slate-200 text-slate-500")}>{t}</button>
                ))}
              </div>
              {allSubTab === '교번' && (
                <div style={{ backgroundColor: theme.bg }} className="flex items-center rounded-xl px-3 py-1.5 border border-black/5 mx-1">
                  <Search className="w-3.5 h-3.5 opacity-40 mr-2"/><input placeholder="교번 정확히 입력 (예: 2)" className="bg-transparent text-xs outline-none w-full font-bold text-black dark:text-white" onChange={e=>setSearchQuery(e.target.value.trim())} />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto p-1">
              {allSubTab === '교번' ? (
                <div className="grid grid-cols-7 gap-0 border-t border-l" style={{ borderColor: theme.border }}>
                  {ROTATION_ORDER.map((dia, i) => (
                    <div key={i} style={{ backgroundColor: searchQuery === dia ? theme.highlight7 : theme.card, borderColor: theme.border, borderWidth: '0.3px' }} className="aspect-square flex flex-col items-center justify-center relative">
                      <span className="text-[7px] opacity-20 absolute top-0.5 left-0.5">{i + 1}</span>
                      <span style={{ color: dia.includes('휴') ? '#EF4444' : theme.text }} className="text-[11px] font-black">{dia}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {(allData?.[allSubTab==='평'?'wd':allSubTab==='휴'?'hd':allSubTab==='평평'?'ww':allSubTab==='평휴'?'wh':allSubTab==='휴휴'?'hh':'hw'] || []).map((row: any, i: number) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? theme.card : theme.bg }} className="text-center text-[10px] border-b border-black/5">
                        <td className="p-2 font-black text-[11px]">{row.matchNum}</td>
                        <td className="p-2 font-black text-[11px]">{row.reportTime}</td>
                        <td className="p-2 text-[10px] whitespace-pre-wrap">{row.content1}</td>
                        <td className="p-2 text-[10px] whitespace-pre-wrap">{row.content2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 하단바 */}
      <nav style={{ backgroundColor: theme.card, borderColor: theme.border }} className="mx-6 mb-6 px-4 py-2.5 rounded-2xl flex items-center justify-between border shadow-lg z-10 shrink-0">
        {[ { id: 'calendar', icon: CalendarIcon, label: "내 근무" }, { id: 'peers', icon: Users, label: "동료" }, { id: 'all', icon: LayoutList, label: "조회" } ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} style={{ color: activeTab === item.id ? '#2563EB' : theme.subText }} className={cn("flex flex-col items-center transition-all duration-200", activeTab === item.id && "scale-110")}>
            <item.icon className="w-5 h-5 mb-0.5" /><span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 상세 팝업 */}
      {showDetail && detailData && (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
          <div className="flex justify-end p-4 z-[210]"><button onClick={() => window.history.back()} style={{ backgroundColor: theme.card }} className="p-2 rounded-full border shadow-sm active:scale-90"><X className="w-6 h-6"/></button></div>
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black tracking-tighter leading-none">{format(selectedDate, 'M월 d일')}</span>
                <span className="text-xs font-bold opacity-30 mb-0.5">{['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][selectedDate.getDay()]}</span>
              </div>
              {detailData.isUser && <button onClick={() => openPop(setShowShiftMenu)} className="text-[11px] font-black border border-slate-200 px-3 py-1.5 rounded-lg bg-card shadow-sm">근무 변경</button>}
            </div>
            <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-2xl p-4 flex justify-between items-center shadow-sm mb-3">
              <div className="flex flex-col items-center">
                <div style={{ backgroundColor: theme.bg }} className="w-14 h-14 rounded-xl flex items-center justify-center border mb-1"><span style={{ color: detailData.isRed ? '#EF4444' : getDutyColor(detailData.label, theme.text), fontSize: detailData.diaNum?.length > 3 ? '13px' : '22px' }} className="font-black">{detailData.diaNum}</span></div>
                <span className="text-[9px] font-black opacity-30 uppercase">{detailData.label}</span>
              </div>
              <div className="text-right"><div className="text-[10px] font-black opacity-20 mb-0.5 uppercase">출근</div><div className="text-4xl font-black tracking-tighter">{detailData.reportTime || "--:--"}</div></div>
            </div>
            {detailData.content1 && <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-xl p-3 flex items-center gap-3 mb-2"><div style={{ backgroundColor: theme.bg }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] opacity-40 shrink-0">전반</div><div className="font-bold text-[14px] leading-snug whitespace-pre-wrap">{detailData.content1}</div></div>}
            {detailData.content2 && <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-xl p-3 flex items-center gap-3 mb-2"><div style={{ backgroundColor: theme.bg }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] opacity-40 shrink-0">후반</div><div className="font-bold text-[14px] leading-snug whitespace-pre-wrap">{detailData.content2}</div></div>}
            <div className="flex flex-col gap-1.5 mt-4">
              {(memos[format(selectedDate, 'yyyy-MM-dd')] || []).map((m, idx) => (
                <SwipeableMemo key={idx} text={m} onRemove={() => { const dk = format(selectedDate, 'yyyy-MM-dd'); setMemos({ ...memos, [dk]: memos[dk].filter((_, i) => i !== idx) }); }} />
              ))}
            </div>
          </div>
          <button onClick={() => openPop(setShowMemoInput)} className="fixed bottom-10 right-10 w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-[250] active:scale-95"><FileEdit className="w-6 h-6" /></button>
        </div>
      )}

      {/* 기타 모달 (메모 입력 시 블랙스크린 방지 로직 적용) */}
      {showMemoInput && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => window.history.back()} />
          <div style={{ backgroundColor: theme.card }} className="relative w-full max-w-sm rounded-3xl p-5 shadow-2xl flex items-center gap-3">
            <input autoFocus value={memoInput} onChange={e => setMemoInput(e.target.value)} style={{ backgroundColor: theme.bg, color: theme.text }} className="flex-1 p-3.5 rounded-xl font-bold outline-none text-sm" placeholder="메모 입력..." />
            <button onClick={() => {
              if(!memoInput.trim()) return;
              const dk = format(selectedDate, 'yyyy-MM-dd');
              setMemos({ ...memos, [dk]: [...(memos[dk] || []), memoInput] });
              setMemoInput("");
              window.history.back(); // 히스토리 뒤로가기로 모달 닫기
            }} className="bg-blue-600 text-white p-3.5 rounded-xl"><Check className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {/* 동료 편집 모달 */}
      {showEditPeers && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => window.history.back()} />
          <div style={{ backgroundColor: theme.bg, color: theme.text }} className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl max-h-[70vh] flex flex-col">
            <h2 className="text-xl font-black mb-4">동료 편집</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {peers.map((p, i) => (
                <div key={p.id} style={{ backgroundColor: theme.card, borderColor: theme.border }} className="flex items-center py-2 px-3 rounded-xl border gap-3">
                  <div className="flex flex-col"><button onClick={() => { if(i>0) { const up=[...peers]; [up[i-1], up[i]]=[up[i], up[i-1]]; setPeers(up); }}} disabled={i===0} className="p-1 opacity-30"><ArrowUp className="w-3 h-3"/></button><button onClick={() => { if(i<peers.length-1) { const up=[...peers]; [up[i], up[i+1]]=[up[i+1], up[i]]; setPeers(up); }}} disabled={i===peers.length-1} className="p-1 opacity-30"><ArrowDown className="w-3 h-3"/></button></div>
                  <div className="flex-1 font-bold text-sm">{p.name}</div>
                  <button onClick={() => setPeers(peers.filter(x=>x.id !== p.id))} className="p-2 text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
            <button onClick={() => window.history.back()} className="mt-4 w-full bg-slate-800 text-white py-3 rounded-xl font-black">편집 완료</button>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-[250] flex items-center justify-center p-6" onClick={() => window.history.back()}>
          <div style={{ backgroundColor: theme.bg, color: theme.text }} className="w-full max-w-sm rounded-[32px] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">설정</h2><button onClick={() => window.history.back()}><X className="w-6 h-6 opacity-30"/></button></div>
            <div className="space-y-4">
                <div style={{ backgroundColor: theme.card }} className="p-5 rounded-2xl border">
                    <label className="block text-[10px] font-black uppercase mb-3 text-center opacity-40">내 기준 설정</label>
                    <input type="date" value={format(parseISO(userAnchor.date), 'yyyy-MM-dd')} onChange={e=>setUserConfig({ ...userAnchor, date: e.target.value })} style={{ backgroundColor: theme.bg }} className="w-full p-3 rounded-xl font-bold text-center mb-3 border text-sm" />
                    <select value={ROTATION_ORDER[userAnchor.index]} onChange={e=>setUserConfig({ ...userAnchor, index: ROTATION_ORDER.indexOf(e.target.value) })} style={{ backgroundColor: theme.bg }} className="w-full p-3 rounded-xl font-bold text-center mb-4 border text-sm">{DIA_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}</select>
                    <button onClick={() => { localStorage.setItem('shift_user_config', JSON.stringify(userAnchor)); window.history.back(); }} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-xs">저장</button>
                </div>
                <div style={{ backgroundColor: theme.card }} className="flex items-center justify-between p-5 rounded-2xl border">
                  <div className="flex items-center gap-3">{isDarkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-orange-400" />}<span className="font-bold text-sm">다크 모드</span></div>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-12 h-7 rounded-full p-1", isDarkMode?"bg-blue-600":"bg-slate-300")}><div className={cn("w-5 h-5 bg-white rounded-full transition-transform", isDarkMode?"translate-x-5":"translate-x-0")} /></button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* 근무변경 메뉴 */}
      {showShiftMenu && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-6" onClick={() => window.history.back()}>
          <div style={{ backgroundColor: theme.card }} className="w-full max-w-sm rounded-2xl p-4 shadow-2xl grid grid-cols-2 gap-2" onClick={e=>e.stopPropagation()}>
            {RED_ITEMS.map(t => <button key={t} onClick={() => {
              const dk = format(selectedDate, 'yyyy-MM-dd');
              setOverrides({ ...overrides, [dk]: { diaNum: t, label: t } });
              window.history.back();
            }} className="py-2.5 bg-red-50 text-red-600 rounded-lg font-bold text-[11px]">{t}</button>)}
            {['지정근무', '대기충당', '교번교체', '휴무충당'].map(t => <button key={t} onClick={() => openPop(setShowDiaPicker.bind(null, {type: t, color: t==='휴무충당'?'yellow':'blue'}))} style={{ backgroundColor: theme.bg }} className="py-2.5 rounded-lg font-bold text-[11px]">{t}</button>)}
            <button onClick={() => {
              const dk = format(selectedDate, 'yyyy-MM-dd');
              const up = { ...overrides }; delete up[dk];
              setOverrides(up); window.history.back();
            }} className="col-span-2 py-2.5 opacity-40 font-bold text-[10px] italic">원래 근무 복구</button>
          </div>
        </div>
      )}

      {/* 다이아 번호 선택 */}
      {showDiaPicker && (
        <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-8 bg-black/95">
          <h3 className="text-white text-xl font-black mb-6 text-center">{showDiaPicker.type}</h3>
          <div className="w-full bg-white rounded-3xl p-2 max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-2" onClick={e=>e.stopPropagation()}>
            {DIA_NUMBERS.map(n => (<button key={n} onClick={() => {
              const dk = format(selectedDate, 'yyyy-MM-dd');
              setOverrides({ ...overrides, [dk]: { diaNum: n, label: showDiaPicker.type } });
              window.history.back(); // 다이아 픽커 닫기
              setTimeout(() => window.history.back(), 50); // 근무변경 메뉴 닫기
            }} className="py-4 border rounded-xl font-black text-lg text-black active:bg-slate-200">{n}</button>))}
          </div>
          <button onClick={() => window.history.back()} className="mt-8 text-white font-bold underline">취소</button>
        </div>
      )}

      {/* 동료 등록 */}
      {showAddPeer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => window.history.back()} />
          <div style={{ backgroundColor: theme.bg, color: theme.text }} className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h2 className="text-xl font-black mb-6">동료 등록</h2>
            <div className="space-y-3">
              <input type="text" value={pName} onChange={e=>setPName(e.target.value)} style={{ backgroundColor: theme.card }} className="w-full p-4 rounded-xl font-bold border text-sm" placeholder="이름" />
              <input type="date" value={pDate} onChange={e=>setPDate(e.target.value)} style={{ backgroundColor: theme.card }} className="w-full p-4 rounded-xl font-bold border text-sm" />
              <select value={pDia} onChange={e=>setPDia(e.target.value)} style={{ backgroundColor: theme.card }} className="w-full p-4 rounded-xl font-bold border text-sm">{DIA_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}</select>
              <button onClick={() => {
                const findIdx = ROTATION_ORDER.indexOf(pDia);
                if(pName && findIdx !== -1) {
                  setPeers([...peers, { id: Date.now(), name: pName, anchorD: pDate, anchorI: findIdx }]);
                  window.history.back();
                }
              }} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg">등록 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
