import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, StickyNote, PartyPopper, ChevronLeft } from 'lucide-react';
import { getShiftMapping, calculateReportTime, getBaseDayType } from '../../utils/rotation';

const DayDetailModal = ({ date, originalDia, onClose, customDayTypes, onDayTypeChange, overrides, setOverrides, sheetData }: any) => {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [showDiaPicker, setShowDiaPicker] = useState<any>(null); 
  const [showCelebration, setShowCelebration] = useState(false);
  const [showOtherMenu, setShowOtherMenu] = useState(false);

  const dateKey = format(date, 'yyyy-MM-dd');
  const currentOverride = overrides[dateKey];
  const currentDia = currentOverride ? currentOverride.dia : originalDia;
  const currentType = currentOverride ? currentOverride.type : null;

  const mapping = useMemo(() => getShiftMapping(date, currentDia, customDayTypes), [date, currentDia, customDayTypes]);
  const realData = useMemo(() => {
    if (!sheetData || currentDia === '~' || (currentType === 'red' && currentDia !== '~')) return [];
    const targetTab = sheetData[mapping.tab] || [];
    return targetTab.filter((row: any) => String(row.dia).trim() === String(currentDia).trim());
  }, [currentDia, mapping.tab, sheetData, currentType]);

  const reportTime = calculateReportTime(realData[0]?.content || "");
  const isUnhyu = currentType === 'red' || realData.some((row: any) => row.content.includes('운휴'));

  const diaList = [...Array.from({length: 54}, (_, i) => String(i + 1)), '~', ...Array.from({length: 14}, (_, i) => `대${i + 1}`)];
  const RED_ITEMS = ['연차', '촉진연차', '대체휴가', '만근휴가', '개인학습', '지정휴무'];
  const BLUE_ITEMS = ['지정근무', '대기충당', '교번교체'];

  const handleOverride = (label: string, type: string, needsDia: boolean = false) => {
    if (needsDia) {
      setShowDiaPicker({ label, type });
    } else {
      setOverrides((prev: any) => ({ ...prev, [dateKey]: { dia: label, type } }));
      setShowOverrideMenu(false);
      if (label === '휴무충당') setShowCelebration(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.1 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.4}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        className="bg-[var(--bg-color)] w-full max-w-[430px] h-[85vh] rounded-t-[32px] flex flex-col overflow-hidden relative"
      >
        <header className="p-5 border-b border-[var(--grid-line)] flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex bg-black/5 rounded-lg p-0.5 w-fit mb-2">
              {['wd', 'hd'].map(t => (
                <button key={t} onClick={() => onDayTypeChange(date, t)} className={`px-4 py-1 text-[10px] rounded-md font-black ${(customDayTypes[dateKey] || getBaseDayType(date)) === t ? 'bg-white shadow-sm' : 'opacity-30'}`}>{t==='wd'?'평일':'휴일'}</button>
              ))}
            </div>
            <h2 className="text-3xl font-serif font-black italic tracking-tighter leading-none mt-1">
              {format(date, 'MM.dd')} <span className="text-sm font-sans font-bold opacity-30 ml-1">{format(date, 'eee', { locale: ko }).charAt(0)}</span>
            </h2>
          </div>
          <div className="flex flex-col items-end gap-6">
            <button onClick={onClose} className="p-1 opacity-20"><X size={24}/></button>
            <button onClick={() => setShowOverrideMenu(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-color)] border border-[var(--grid-line)] rounded-full text-[11px] font-black shadow-sm active:scale-95 transition-all">
              <Edit3 size={12}/> 근무변경
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className={`text-5xl font-black ${currentType === 'red' ? 'text-red-500' : currentType === 'blue' ? 'text-blue-500' : currentType === 'yellow' ? 'text-amber-500' : isUnhyu ? 'text-red-500' : ''}`}>{currentDia}</span>
                {currentOverride && <span className="text-[10pt] font-bold opacity-30 mt-4">(원래 {originalDia})</span>}
              </div>
              <span className="text-[12pt] font-black opacity-60 mt-2">{mapping.label}</span>
            </div>
            {currentType !== 'red' && (
              <div className="flex flex-col items-end">
                <span className="text-[11pt] font-black opacity-40 mb-1">{"<출근시간>"}</span>
                <span className="text-4xl font-black text-black tracking-tighter leading-none">{reportTime}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {currentDia === '~' || (currentType === 'red' && currentDia !== '~') ? (
              <div className="p-10 text-center opacity-20 font-black italic text-lg border border-dashed border-[var(--grid-line)] rounded-2xl">{currentType === 'red' ? currentDia : 'OFF DUTY'}</div>
            ) : realData.length === 0 ? (
              <div className="p-10 text-center opacity-10 font-black text-sm border border-dashed border-[var(--grid-line)] rounded-2xl">데이터가 없습니다.</div>
            ) : (
              realData.map((item: any, i: number) => (
                <div key={i} className="border border-[var(--grid-line)] p-4 rounded-2xl">
                  <span className="text-[13pt] font-black opacity-40 block mb-1">{item.type}</span>
                  <p className="text-[1.15rem] font-black leading-tight text-black">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </main>

        <AnimatePresence>
          {showOverrideMenu && (
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.1 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.4}
              onDragEnd={(_, info) => { if (info.offset.y > 100) setShowOverrideMenu(false); }}
              className="absolute inset-0 z-[120] bg-[var(--bg-color)] p-6 pt-10 flex flex-col"
            >
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowOverrideMenu(false)} className="p-2 opacity-20"><X /></button>
              </div>
              <div className="grid grid-cols-2 grid-rows-6 gap-3 flex-1 overflow-y-auto pb-6">
                {RED_ITEMS.map(item => (
                  <button key={item} onClick={() => handleOverride(item, 'red')} className="h-full bg-red-50 text-red-600 rounded-2xl font-black text-sm active:scale-95 transition-all">{item}</button>
                ))}
                {BLUE_ITEMS.map(item => (
                  <button key={item} onClick={() => handleOverride(item, 'blue', true)} className="h-full bg-blue-50 text-blue-600 rounded-2xl font-black text-sm active:scale-95 transition-all">{item}</button>
                ))}
                <button onClick={() => handleOverride('휴무충당', 'yellow', true)} className="h-full bg-amber-50 text-amber-600 rounded-2xl font-black text-sm active:scale-95 transition-all">휴무충당</button>
                <button onClick={() => setShowOtherMenu(true)} className="h-full bg-red-50 text-red-600 rounded-2xl font-black text-sm active:scale-95 transition-all">기타</button>
                
                {/* [보정] 원래근무로 버튼을 '기타' 옆으로 이동 및 그리드 규격 일치 */}
                <button 
                  onClick={() => { 
                    setOverrides((prev: any) => {
                      const next = { ...prev };
                      delete next[dateKey];
                      return next;
                    });
                    setShowOverrideMenu(false);
                  }} 
                  className="h-full bg-gray-100 text-gray-500 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  원래근무로
                </button>
              </div>
            </motion.div>
          )}

          {showDiaPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="absolute inset-0 z-[130] bg-black/60 flex items-center justify-center p-6">
              <div className="bg-[var(--bg-color)] rounded-[32px] p-6 w-full max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-lg">{showDiaPicker.label}</span>
                  <button onClick={() => setShowDiaPicker(null)}><X size={20}/></button>
                </div>
                <div className="grid grid-cols-5 gap-2 overflow-y-auto">
                  {diaList.map(d => (
                    <button key={d} onClick={() => {
                      setOverrides((prev: any) => ({ ...prev, [dateKey]: { dia: d, type: showDiaPicker.type } }));
                      setShowDiaPicker(null);
                      setShowOverrideMenu(false);
                      if (showDiaPicker.label === '휴무충당') setShowCelebration(true);
                    }} className="py-3 bg-black/5 rounded-xl font-black text-xs active:bg-blue-500 active:text-white">{d}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {showOtherMenu && (
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.1 }} className="absolute inset-0 z-[140] bg-[var(--bg-color)] p-6 pt-10 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setShowOtherMenu(false)} className="p-2 opacity-20"><ChevronLeft /></button>
                <div className="w-10"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['병가', '공가', '청원휴가', '장기재직', '육아휴가', '출산휴가'].map(item => (
                  <button key={item} onClick={() => { handleOverride(item, 'red'); setShowOtherMenu(false); }} className="h-16 bg-red-50 text-red-600 rounded-2xl font-black text-sm shadow-sm">{item}</button>
                ))}
              </div>
            </motion.div>
          )}

          {showCelebration && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.1 }} className="absolute inset-0 z-[150] flex items-center justify-center p-10">
              <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 border-4 border-amber-400">
                <PartyPopper size={48} className="text-amber-500 animate-bounce" />
                <span className="font-black text-lg">축하합니다~</span>
                <button onClick={() => setShowCelebration(false)} className="w-full py-3 bg-amber-400 rounded-xl flex justify-center"><PartyPopper size={20} className="text-white" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DayDetailModal;