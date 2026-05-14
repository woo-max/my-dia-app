import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { X, Edit3, ChevronLeft, GripVertical, Trash2, Plus } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { getShiftMapping, calculateReportTime, getBaseDayType } from '../../utils/rotation';
import MemoModal from './MemoModal';

const MemoItem = ({ memo, onEdit, onDelete }: any) => {
  const controls = useDragControls();
  return (
    <Reorder.Item value={memo} dragListener={false} dragControls={controls} className="relative mb-1.5 touch-none">
      <motion.div 
        drag="x" dragConstraints={{ left: -75, right: 0 }} dragElastic={0.05} dragMomentum={false}
        className="bg-[var(--surface-card)] border border-[var(--border-line)] rounded-xl flex items-center p-2.5 relative z-10 shadow-sm"
      >
        <div onPointerDown={(e) => controls.start(e)} className="mr-2.5 p-1 opacity-20 cursor-grab text-[var(--text-main)]"><GripVertical size={18} /></div>
        <div className="w-[3.5px] self-stretch rounded-full mr-3.5" style={{ backgroundColor: memo.color }} />
        <p className="text-[1rem] font-black leading-tight flex-1 py-0.5 text-[var(--text-main)]" onClick={() => onEdit(memo)}>{memo.text}</p>
      </motion.div>
      <button onClick={() => onDelete(memo.id)} className="absolute inset-y-0 right-0 w-[70px] bg-red-500 text-white rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
    </Reorder.Item>
  );
};

const DayDetailModal = ({ date, originalDia, overrideType, onClose, customDayTypes, onDayTypeChange, overrides, setOverrides, memos = {}, setMemos, sheetData }: any) => {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState<any>(null);
  const [showDiaPicker, setShowDiaPicker] = useState<any>(null);

  const dateKey = format(date || new Date(), 'yyyy-MM-dd');
  const currentOverride = overrides[dateKey];
  const currentDia = currentOverride ? currentOverride.dia : originalDia;
  const currentOverrideType = currentOverride ? currentOverride.type : overrideType;
  const dayMemos = useMemo(() => memos[dateKey] || [], [memos, dateKey]);

  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (showMemoInput) { setShowMemoInput(null); return; }
      if (showDiaPicker) { setShowDiaPicker(null); return; }
      if (showOverrideMenu) { setShowOverrideMenu(false); return; }
    });
    return () => { backListener.then(h => h.remove()); };
  }, [showMemoInput, showDiaPicker, showOverrideMenu]);

  const mapping = useMemo(() => getShiftMapping(date || new Date(), currentDia, customDayTypes), [date, currentDia, customDayTypes]);
  const realData = useMemo(() => {
    if (!sheetData || currentDia === '~' || (currentOverrideType === 'red' && currentDia !== '~')) return [];
    return (sheetData[mapping.tab] || []).filter((row: any) => String(row.dia).trim() === String(currentDia).trim());
  }, [currentDia, mapping.tab, sheetData, currentOverrideType]);

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 transition-none" onClick={onClose}>
      <motion.div 
        onClick={e => e.stopPropagation()} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.1 }}
        className="bg-[var(--bg-main)] w-full max-w-[430px] h-[85vh] rounded-t-[32px] flex flex-col overflow-hidden relative shadow-2xl"
      >
        <header className="p-5 border-b border-[var(--border-line)] flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex bg-[var(--memo-bg)] rounded-lg p-0.5 w-fit mb-1">
              {['wd', 'hd'].map(t => (
                <button key={t} onClick={() => onDayTypeChange(date, t)} className={`px-4 py-1 text-[10px] rounded-md font-black ${(customDayTypes[dateKey] || getBaseDayType(date)) === t ? 'bg-[var(--surface-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-main)] opacity-30'}`}>{t==='wd'?'평일':'휴일'}</button>
              ))}
            </div>
            <h2 className="text-3xl font-serif font-black italic text-[var(--text-main)]">{format(date || new Date(), 'MM.dd')} <span className="text-sm font-sans opacity-20 ml-1">{format(date || new Date(), 'eee', { locale: ko }).charAt(0)}</span></h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={onClose} className="p-1 text-[var(--text-muted)]"><X size={24}/></button>
            <button onClick={() => setShowOverrideMenu(true)} className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full text-[10px] font-black shadow-sm text-[var(--text-main)] active:scale-95 transition-transform">근무변경</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end gap-2">
              <div className="flex flex-col leading-none">
                <span className={`text-5xl font-black ${currentOverrideType === 'red' ? 'text-red-500' : currentOverrideType === 'blue' ? 'text-blue-500' : currentOverrideType === 'yellow' ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>{currentDia}</span>
                <span className="text-[12pt] font-black opacity-60 mt-2 text-[var(--text-main)]">{mapping.label} {currentOverride && <span className="opacity-30 text-[10pt] ml-2">(원래 {originalDia})</span>}</span>
              </div>
              {currentOverrideType !== 'red' && (
                <span className="text-4xl font-black text-[var(--text-main)] tracking-tighter leading-none">{calculateReportTime(realData[0]?.content || "")}</span>
              )}
            </div>
            
            <div className="flex flex-col gap-2.5">
              {realData.map((item: any, i: number) => (
                <div key={i} className="border border-[var(--border-line)] p-4 rounded-2xl bg-[var(--memo-bg)]">
                  <span className="text-[11px] font-black opacity-30 block mb-1 text-[var(--text-main)] uppercase tracking-wider">{item.type}</span>
                  <p className="text-[1.1rem] font-black leading-snug text-[var(--text-main)]">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border-line)] pt-6">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">MEMOS</span>
              <button onClick={() => setShowMemoInput({})} className="p-1.5 bg-[var(--memo-bg)] rounded-full text-[var(--text-muted)]"><Plus size={16}/></button>
            </div>
            <Reorder.Group axis="y" values={dayMemos} onReorder={(o) => setMemos({...memos, [dateKey]: o})} className="flex flex-col">
              {dayMemos.map((m: any) => ( <MemoItem key={m.id} memo={m} onEdit={setShowMemoInput} onDelete={(id: string) => setMemos({...memos, [dateKey]: dayMemos.filter((x:any)=>x.id!==id)})} /> ))}
            </Reorder.Group>
          </div>
        </main>

        <AnimatePresence>
          {showOverrideMenu && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.1 }} className="absolute inset-0 z-[120] bg-[var(--bg-main)] p-6 pt-10 flex flex-col">
              <div className="flex justify-end mb-4"><button onClick={() => setShowOverrideMenu(false)} className="p-2 text-[var(--text-muted)]"><X /></button></div>
              <div className="grid grid-cols-2 grid-rows-6 gap-3 flex-1 pb-6">
                {/* [교정] 연차 계열: 배경 농도를 10%로 낮춰 부담 제거 */}
                {['연차','촉진연차','대체휴가','만근휴가','개인학습','지정휴무'].map(i => (
                  <button key={i} onClick={() => { setOverrides({...overrides, [dateKey]: { dia: i, type: 'red' }}); setShowOverrideMenu(false); }} className="bg-red-500/10 text-red-500 rounded-2xl font-black text-sm active:scale-95 transition-all">
                    {i}
                  </button>
                ))}
                {/* [교정] 지정근무 계열: 초록색 배경 제거 후 파란색 10% 농도 적용 */}
                {['지정근무','대기충당','교번교체'].map(i => (
                  <button key={i} onClick={() => setShowDiaPicker({ label: i, type: 'blue' })} className="bg-blue-500/10 text-blue-500 rounded-2xl font-black text-sm active:scale-95 transition-all">
                    {i}
                  </button>
                ))}
                {/* [교정] 휴무충당: 옐로우 10% 농도 적용 */}
                <button onClick={() => setShowDiaPicker({ label: '휴무충당', type: 'yellow' })} className="bg-amber-500/10 text-amber-500 rounded-2xl font-black text-sm active:scale-95 transition-all">휴무충당</button>
                
                {/* [교정] 기타: 연차와 동일한 빨간 톤으로 교정 */}
                <button onClick={() => {}} className="bg-red-500/10 text-red-500 rounded-2xl font-black text-sm active:scale-95 transition-all">기타</button>
                
                <button onClick={() => { const next = { ...overrides }; delete next[dateKey]; setOverrides(next); setShowOverrideMenu(false); }} className="bg-[var(--surface-card)] border border-[var(--border-line)] text-[var(--text-muted)] rounded-2xl font-black text-sm active:scale-95">원래근무로</button>
              </div>
            </motion.div>
          )}
          {showMemoInput && <MemoModal memo={showMemoInput} onClose={() => setShowMemoInput(null)} onSave={(n: any) => { const updated = showMemoInput.id ? dayMemos.map((m: any) => m.id === showMemoInput.id ? n : m) : [...dayMemos, { ...n, id: Date.now().toString() }]; setMemos({ ...memos, [dateKey]: updated }); setShowMemoInput(null); }} />}
          {showDiaPicker && (
            <div className="absolute inset-0 z-[130] bg-black/60 flex items-center justify-center p-6">
              <div className="bg-[var(--surface-card)] rounded-[32px] p-6 w-full max-h-[70vh] flex flex-col border border-[var(--border-line)] shadow-2xl">
                <div className="flex justify-between items-center mb-4"><span className="font-black text-lg text-[var(--text-main)]">{showDiaPicker.label} - DIA 선택</span><button onClick={() => setShowDiaPicker(null)} className="text-[var(--text-main)]"><X size={20}/></button></div>
                <div className="grid grid-cols-5 gap-2 overflow-y-auto no-scrollbar">
                  {[...Array.from({length: 54}, (_, i) => String(i + 1)), '~', ...Array.from({length: 14}, (_, i) => `대${i + 1}`)].map(d => (
                    <button key={d} onClick={() => { setOverrides({...overrides, [dateKey]: { dia: d, type: showDiaPicker.type }}); setShowDiaPicker(null); setShowOverrideMenu(false); }} className="py-3 bg-[var(--memo-bg)] rounded-xl font-black text-xs text-[var(--text-main)] active:bg-blue-500 active:text-white transition-colors">{d}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DayDetailModal;