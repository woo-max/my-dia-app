import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { X, Edit3, StickyNote } from 'lucide-react';
import { getShiftMapping, calculateReportTime, getBaseDayType } from '../../utils/rotation';

const DayDetailModal = ({ date, dia, onClose, customDayTypes, onDayTypeChange, sheetData }: any) => {
  if (!date) return null;

  const mapping = useMemo(() => getShiftMapping(date, dia, customDayTypes), [date, dia, customDayTypes]);
  
  // [로직] 시트 데이터 매칭
  const realData = useMemo(() => {
    if (!sheetData || dia === '~') return [];
    const targetTab = sheetData[mapping.tab] || [];
    return targetTab.filter((row: any) => String(row.dia).trim() === String(dia).trim());
  }, [dia, mapping.tab, sheetData]);

  // [신규] 팝업창 근무번호 빨간색 조건 판단
  const isRed = useMemo(() => {
    // 1. 근무번호에 '휴'가 포함된 경우
    if (dia.includes('휴')) return true;
    
    // 2. 시트 내용(content)에 '운휴'가 포함된 경우
    if (realData.length > 0) {
      return realData.some((row: any) => row.content.includes('운휴'));
    }
    
    return false;
  }, [dia, realData]);

  const reportTime = calculateReportTime(realData[0]?.content || "");

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6" onClick={onClose}>
      <motion.div 
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.4}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%", transition: { duration: 0.1 } }}
        className="bg-[var(--bg-color)] w-full max-w-lg h-[80vh] sm:h-auto rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden modal-shadow"
      >
        <header className="p-5 border-b border-[var(--grid-line)] flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex bg-black/5 rounded-lg p-0.5 w-fit mb-2">
              {['wd', 'hd'].map(t => (
                <button 
                  key={t} 
                  onClick={() => onDayTypeChange(date, t)} 
                  className={`px-4 py-1 text-[10px] rounded-md font-black transition-all ${(customDayTypes[format(date, 'yyyy-MM-dd')] || getBaseDayType(date)) === t ? 'bg-white shadow-sm text-black' : 'opacity-30'}`}
                >
                  {t === 'wd' ? '평일' : '휴일'}
                </button>
              ))}
            </div>
            <h2 className="text-3xl font-serif font-black italic tracking-tighter leading-none mt-1">
              {format(date, 'MM.dd')} <span className="text-sm font-sans font-bold opacity-30 ml-1">{format(date, 'eee', { locale: ko }).charAt(0)}</span>
            </h2>
          </div>
          <div className="flex flex-col items-end gap-6">
            <button onClick={onClose} className="p-1 opacity-20 hover:opacity-100"><X size={24}/></button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-color)] border border-[var(--grid-line)] text-[var(--text-color)] rounded-full text-[11px] font-black shadow-sm">
              <Edit3 size={12}/> 근무변경
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col leading-none">
              {/* [수정] 조건에 따라 근무번호 색상을 빨간색(text-red-500)으로 표시 */}
              <span className={`text-5xl font-black ${isRed ? 'text-red-500' : 'text-[var(--text-color)]'}`}>
                {dia}
              </span>
              <span className="text-[12pt] font-black opacity-60 mt-1.5">{mapping.label}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11pt] font-black opacity-40 mb-1">{"<출근시간>"}</span>
              <span className="text-4xl font-black text-black tracking-tighter leading-none">{reportTime}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {dia === '~' ? (
              <div className="p-10 text-center opacity-20 font-black italic text-lg border border-dashed border-[var(--grid-line)] rounded-2xl">OFF DUTY</div>
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

          <div className="relative mt-2 p-5 border-2 border-dashed border-[var(--grid-line)] rounded-2xl flex-1 min-h-[160px]">
            <span className="text-[10px] font-black opacity-30 uppercase">Notes</span>
            <div className="absolute bottom-4 right-4 text-[var(--text-color)] opacity-20 hover:opacity-100 transition-all">
              <StickyNote size={28} strokeWidth={2.5}/>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default DayDetailModal;