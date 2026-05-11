'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, eachDayOfInterval, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Users, Settings, UserPlus, ArrowUp, ArrowDown, Edit3, LayoutList, Search, Moon, Sun, Check, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { fetchAllRotationData } from "../lib/googleSheets";
import { ROTATION_ORDER, DIA_NUMBERS, RED_ITEMS, getHolidayData } from '../lib/types';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { DetailPopup } from './DetailPopup';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const ShiftCalendar = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => typeof window !== 'undefined' && localStorage.getItem('shift_theme') === 'dark');
  const [activeTab, setActiveTab] = useState<'calendar' | 'peers' | 'all'>('calendar');
  const [allSubTab, setAllSubTab] = useState<'평'|'휴'|'평평'|'평휴'|'휴휴'|'휴평'|'교번'>('평');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [peers, setPeers] = useState<any[]>(() => JSON.parse(localStorage.getItem('shift_peers') || '[]'));
  const [overrides, setOverrides] = useState<any>(() => JSON.parse(localStorage.getItem('shift_overrides') || '{}'));
  const [memos, setMemos] = useState<any>(() => JSON.parse(localStorage.getItem('shift_memos') || '{}'));
  const [userAnchor, setUserConfig] = useState(() => JSON.parse(localStorage.getItem('shift_user_config') || '{"date":"2026-05-10","index":15}'));
  const [allData, setAllData] = useState<any>(() => JSON.parse(localStorage.getItem('shift_sheet_cache') || 'null'));
  const [isLoading, setIsLoading] = useState(!allData);

  const { calculateShift, getStandbyLoc } = useShiftLogic(allData, overrides);
  const [showDetail, setShowDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState<any>(null);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [showEditPeers, setShowEditPeers] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [memoInput, setMemoInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const peerScrollRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);

  const theme = { bg: isDarkMode ? '#000000' : '#E5E7EB', card: isDarkMode ? '#1A1A1A' : '#FFFFFF', text: isDarkMode ? '#FAFAFA' : '#1C1C1E', subText: isDarkMode ? '#A1A1AA' : '#636E72', border: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)', highlight7: 'rgba(16, 185, 129, 0.07)' };

  useEffect(() => {
    fetchAllRotationData().then(data => { if (data) { setAllData(data); localStorage.setItem('shift_sheet_cache', JSON.stringify(data)); } setIsLoading(false); });
  }, []);

  useEffect(() => {
    localStorage.setItem('shift_peers', JSON.stringify(peers));
    localStorage.setItem('shift_overrides', JSON.stringify(overrides));
    localStorage.setItem('shift_memos', JSON.stringify(memos));
    localStorage.setItem('shift_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('shift_user_config', JSON.stringify(userAnchor));
  }, [peers, overrides, memos, isDarkMode, userAnchor]);

  const openPop = (setter: (v: boolean) => void) => { window.history.pushState({ modal: true }, "", "#modal"); setter(true); };

  useEffect(() => {
    if (activeTab === 'peers' && peerScrollRef.current) {
      const todayIdx = differenceInDays(new Date(), startOfMonth(currentMonth));
      if (todayIdx >= 0) peerScrollRef.current.scrollLeft = todayIdx * 54;
    }
  }, [activeTab, currentMonth]);

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text }} className="flex flex-col h-screen overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div><span style={{ color: theme.subText }} className="text-[10px] font-black uppercase tracking-widest">{format(currentMonth, 'yyyy년')}</span><div className="flex items-center gap-2"><h1 className="text-2xl font-black tracking-tighter">{activeTab === 'all' ? "조회" : format(currentMonth, 'M월')}</h1><div className="flex gap-1"><button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}><ChevronLeft className="w-4 h-4"/></button><button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4"/></button></div></div></div>
        <button onClick={() => openPop(setShowSettings)} style={{ backgroundColor: theme.card }} className="w-10 h-10 flex items-center justify-center border rounded-xl bg-white/5"><Settings className="w-5 h-5 opacity-40"/></button>
      </header>

      <main onTouchStart={e => touchX.current = e.touches[0].clientX} onTouchEnd={e => { if (activeTab === 'calendar') { const delta = e.changedTouches[0].clientX - touchX.current; if (delta > 80) setCurrentMonth(addMonths(currentMonth, -1)); else if (delta < -80) setCurrentMonth(addMonths(currentMonth, 1)); } }} className="flex-1 overflow-hidden">
        {activeTab === 'calendar' ? (
          <div className="h-full flex flex-col px-3 pb-2">
            <div className="grid grid-cols-7 mb-1 text-[10px] font-bold opacity-50 text-center">{['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}</div>
            <div style={{ borderColor: theme.border }} className="flex-1 grid grid-cols-7 auto-rows-fr gap-0 border-t border-l">
              {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(d => {
                const s = calculateShift(d, userAnchor.date, userAnchor.index, true); const h = getHolidayData(d); const isT = isSameDay(d, new Date());
                return (
                  <div key={d.toString()} onClick={() => { setSelectedDate(d); openPop(setShowDetail); }} style={{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: '0.5px', opacity: isSameMonth(d, currentMonth) ? 1 : 0.3 }} className="flex flex-col p-0.5 overflow-hidden active:bg-slate-50">
                    <div style={{ backgroundColor: isT ? theme.highlight7 : 'transparent' }} className="flex items-center gap-1 border-b border-black/5 pb-0.5"><span style={{ color: h.isH ? '#EF4444' : d.getDay() === 6 ? '#3B82F6' : theme.text }} className="text-[10px] font-bold">{format(d, 'd')}</span>{h.name && <span className="text-[7px] font-black text-red-400 truncate">{h.name}</span>}</div>
                    <span style={{ color: s.isRed ? '#EF4444' : theme.text }} className="text-[13px] font-black mt-1 ml-0.5 leading-none">{s.diaNum}</span>
                    <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">{(memos[format(d, 'yyyy-MM-dd')] || []).slice(0, 3).map((m: any, i: number) => <div key={i} className="text-[9px] font-bold truncate opacity-60 px-0.5">{m}</div>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'peers' ? (
          <div className="h-full flex flex-col relative">
            <div ref={peerScrollRef} className="flex-1 overflow-auto no-scrollbar">
              <table className="border-collapse w-max min-w-full text-center">
                <thead className="sticky top-0 z-20">
                  <tr style={{ backgroundColor: theme.card }}>
                    <th style={{ borderColor: theme.border }} className="p-3 border sticky left-0 z-30 text-[12px] font-black shadow-sm bg-inherit">성명</th>
                    {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => { const h = getHolidayData(d); return <th key={d.toString()} style={{ backgroundColor: isSameDay(d, new Date()) ? theme.highlight7 : theme.card, borderColor: theme.border, color: h.isH ? '#EF4444' : d.getDay() === 6 ? '#3B82F6' : theme.text }} className="p-1.5 border text-[10px] min-w-[54px]">{format(d, 'd')}<br/>{['일','월','화','수','목','금','토'][d.getDay()]}</th>; })}
                  </tr>
                </thead>
                <tbody>
                  {[{ id: 0, name: '나', anchorD: userAnchor.date, anchorI: userAnchor.index, isUser: true }, ...peers].map(p => (
                    <tr key={p.id}>
                      <td style={{ backgroundColor: theme.card, borderColor: theme.border }} className="p-3 border sticky left-0 z-10 text-[12px] font-black shadow-sm">{p.name}</td>
                      {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map(d => {
                        const s = calculateShift(d, p.anchorD, p.anchorI, p.isUser); const standby = getStandbyLoc(s.content1); const closing = s.content2?.match(/\d{1,2}:\d{2}/g)?.pop();
                        return <td key={d.toString()} style={{ backgroundColor: isSameDay(d, new Date()) ? theme.highlight7 : (s.diaNum === '~' ? '#D1D5DB' : (s.diaNum.includes('휴') ? (isDarkMode ? '#411C1C' : '#FEE2E2') : theme.card)), borderColor: theme.border }} className="p-2 border h-14 min-w-[54px] relative">{standby && <div style={{ color: (standby === '동' ? '#22D3EE' : standby === '불' ? '#22C55E' : standby === '기' ? '#F472B6' : '#F97316') }} className="absolute top-0.5 left-1 font-black text-[10px] leading-none">{standby}</div>}<div style={{ color: s.isRed ? '#EF4444' : theme.text }} className="text-[14px] font-black">{s.diaNum}</div>{closing && <div className="absolute bottom-0.5 right-0.5 font-bold text-[9px] italic opacity-40">{closing}</div>}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col gap-2"><button onClick={() => openPop(setShowEditPeers)} className="w-10 h-10 bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center"><Edit3 className="w-4 h-4"/></button><button onClick={() => openPop(setShowAddPeer)} className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"><UserPlus className="w-5 h-5"/></button></div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="bg-card border-b p-2 overflow-x-auto no-scrollbar flex gap-1">{['평','휴','평평','평휴','휴휴','휴평','교번'].map(t => <button key={t} onClick={() => setAllSubTab(t as any)} className={cn("px-4 py-2 rounded-lg text-[11px] font-black transition-all whitespace-nowrap", allSubTab === t ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-500")}>{t}</button>)}</div>
            <div className="p-2 border-b"><div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5"><Search className="w-3.5 h-3.5 opacity-40 mr-2"/><input placeholder="교번 정확히 입력" className="bg-transparent text-xs outline-none w-full font-bold" onChange={e => setSearchQuery(e.target.value.trim())}/></div></div>
            <div className="flex-1 overflow-auto p-1">
              {allSubTab === '교번' ? (
                <div className="grid grid-cols-7 border-t border-l" style={{ borderColor: theme.border }}>{ROTATION_ORDER.map((dia, i) => <div key={i} style={{ backgroundColor: searchQuery === dia ? theme.highlight7 : theme.card, borderColor: theme.border, borderWidth: '0.3px' }} className="aspect-square flex flex-col items-center justify-center relative"><span className="text-[7px] opacity-20 absolute top-0.5 left-0.5">{i + 1}</span><span style={{ color: dia.includes('휴') ? '#EF4444' : theme.text }} className="text-[11px] font-black">{dia}</span></div>)}</div>
              ) : (
                <table className="w-full border-collapse"><tbody>{(allData?.[allSubTab === '평' ? 'wd' : allSubTab === '휴' ? 'hd' : allSubTab === '평평' ? 'ww' : allSubTab === '평휴' ? 'wh' : allSubTab === '휴휴' ? 'hh' : 'hw'] || []).map((row: any, i: number) => <tr key={i} style={{ backgroundColor: i % 2 === 0 ? theme.card : theme.bg }} className="text-center text-[10px] border-b border-black/5"><td className="p-2 font-black text-[11px]">{row.matchNum}</td><td className="p-2 font-black text-[11px]">{row.reportTime}</td><td className="p-2 text-[10px] whitespace-pre-wrap">{row.content1}</td><td className="p-2 text-[10px] whitespace-pre-wrap">{row.content2}</td></tr>)}</tbody></table>
              )}
            </div>
          </div>
        )}
      </main>

      <nav style={{ backgroundColor: theme.card }} className="mx-6 mb-6 px-4 py-2.5 rounded-2xl flex items-center justify-between border shadow-lg shrink-0">{[{ id: 'calendar', icon: CalendarIcon, label: "내 근무" }, { id: 'peers', icon: Users, label: "동료" }, { id: 'all', icon: LayoutList, label: "조회" }].map(item => <button key={item.id} onClick={() => setActiveTab(item.id as any)} style={{ color: activeTab === item.id ? '#2563EB' : theme.subText }} className={cn("flex flex-col items-center transition-all duration-200", activeTab === item.id && "scale-110")}><item.icon className="w-5 h-5 mb-0.5"/><span className="text-[10px] font-bold">{item.label}</span></button>)}</nav>

      {showDetail && <DetailPopup selectedDate={selectedDate} detailData={calculateShift(selectedDate, userAnchor.date, userAnchor.index, true)} theme={theme} onClose={() => window.history.back()} onShiftMenu={() => openPop(setShowShiftMenu)} onMemoInput={() => openPop(setShowMemoInput)} memoList={memos[format(selectedDate, 'yyyy-MM-dd')] || []} onDeleteMemo={(idx: number) => { const dk = format(selectedDate, 'yyyy-MM-dd'); setMemos({ ...memos, [dk]: memos[dk].filter((_: any, i: number) => i !== idx) }); }}/>}

      {showSettings && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6"><div className="absolute inset-0 bg-black/80" onClick={() => window.history.back()}/><div style={{ backgroundColor: theme.bg }} className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-[80vh]"><div className="flex justify-between items-center mb-6 font-black"><h2>설정</h2><button onClick={() => window.history.back()}><X className="w-6 h-6 opacity-30"/></button></div><div className="space-y-4"><div style={{ backgroundColor: theme.card }} className="p-5 rounded-2xl border text-center"><label className="block text-[10px] font-black uppercase mb-3 opacity-40">내 근무 기준</label><input type="date" value={userAnchor.date} onChange={e => setUserConfig({ ...userAnchor, date: e.target.value })} className="w-full p-3 rounded-xl font-bold bg-white/5 border text-sm mb-3"/><select value={ROTATION_ORDER[userAnchor.index]} onChange={e => setUserConfig({ ...userAnchor, index: ROTATION_ORDER.indexOf(e.target.value) })} className="w-full p-3 rounded-xl font-bold bg-white/5 border text-sm mb-4">{DIA_NUMBERS.map(n => <option key={n} value={n}>{n}</option>)}</select><button onClick={() => window.history.back()} className="w-full bg-slate-800 text-white py-3 rounded-xl font-black text-xs">확인</button></div><div style={{ backgroundColor: theme.card }} className="flex items-center justify-between p-5 rounded-2xl border font-bold text-sm"><span>다크 모드</span><button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("w-12 h-7 rounded-full p-1", isDarkMode ? "bg-blue-600" : "bg-slate-300")}><div className={cn("w-5 h-5 bg-white rounded-full transition-transform", isDarkMode ? "translate-x-5" : "translate-x-0")}/></button></div></div></div></div>
      )}
      
      {/* ... (그 외 모달 로직 생략, Step 4 전체는 동일한 window.history.back 구조 유지) */}
    </div>
  );
};
