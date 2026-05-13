import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths 
} from 'date-fns';

interface Props {
  onClose: () => void;
  currentConfig: { date: Date; dia: string };
  onSave: (config: { date: Date; dia: string }) => void;
}

const SettingsModal = ({ onClose, currentConfig, onSave }: Props) => {
  const [openSection, setOpenSection] = useState<'date' | 'dia' | null>(null);
  
  // 임시 선택 상태
  const [tempDate, setTempDate] = useState(currentConfig.date); 
  const [selectedDate, setSelectedDate] = useState(currentConfig.date);
  const [selectedDia, setSelectedDia] = useState(currentConfig.dia);

  // 미니 달력 날짜 계산
  const miniDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(tempDate));
    const end = endOfWeek(endOfMonth(tempDate));
    return eachDayOfInterval({ start, end });
  }, [tempDate]);

  // 요청하신 DIA 정규 순서 리스트
  const diaList = [
    ...Array.from({ length: 54 }, (_, i) => (i + 1).toString()),
    '대1', '대2', '대3', '대4', '대5', '대6',
    '대11', '대12', '대13', '대14', '~'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-6 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full bg-[var(--bg-color)] rounded-[40px] p-8 shadow-2xl border border-[var(--grid-line)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-10 text-[var(--text-color)]">
          <h2 className="text-2xl font-black font-serif italic tracking-tighter leading-none">Setting</h2>
          <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-4 text-[var(--text-color)]">
          {/* 1. 인라인 미니 달력 (진짜 달력) */}
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--grid-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='date'?null:'date')} className="w-full p-5 flex justify-between items-center text-sm font-bold">
              <div className="flex items-center gap-3 opacity-30"><Calendar size={18}/> 기준 날짜</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-60 font-black">{format(selectedDate, 'MM. dd')}</span>
                <ChevronDown size={16} className={`${openSection==='date'?'rotate-180':''}`}/>
              </div>
            </button>
            <AnimatePresence>
              {openSection === 'date' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-5 border-t border-[var(--grid-line)]">
                  <div className="flex justify-between items-center py-4 px-2">
                    <button onClick={() => setTempDate(subMonths(tempDate, 1))} className="p-1 opacity-40"><ChevronLeft size={16}/></button>
                    <span className="text-[10px] font-black tracking-widest">{format(tempDate, 'yyyy. MM')}</span>
                    <button onClick={() => setTempDate(addMonths(tempDate, 1))} className="p-1 opacity-40"><ChevronRight size={16}/></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[8px] font-black opacity-20 py-1">{d}</div>)}
                    {miniDays.map((date, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                          isSameDay(date, selectedDate) 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : isSameMonth(date, tempDate) ? 'opacity-100' : 'opacity-10'
                        }`}
                      >
                        {format(date, 'd')}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. DIA 셀렉터 */}
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--grid-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='dia'?null:'dia')} className="w-full p-5 flex justify-between items-center text-sm font-bold">
              <div className="flex items-center gap-3 opacity-30"><Hash size={18}/> 기준 다이아</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-60 font-black">{selectedDia}</span>
                <ChevronDown size={16} className={`${openSection==='dia'?'rotate-180':''}`}/>
              </div>
            </button>
            <AnimatePresence>
              {openSection === 'dia' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="p-4 border-t border-[var(--grid-line)]">
                  <div className="grid grid-cols-5 gap-2 h-48 overflow-y-auto pr-1">
                    {diaList.map(d => (
                      <button 
                        key={d} 
                        onClick={() => setSelectedDia(d)}
                        className={`h-10 rounded-xl text-xs font-black transition-all ${
                          selectedDia === d ? 'bg-blue-500 text-white shadow-md' : 'bg-black/5 dark:bg-white/5'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 저장 버튼 */}
          <button 
            onClick={() => onSave({ date: selectedDate, dia: selectedDia })}
            className="w-full mt-6 py-5 bg-[var(--text-color)] text-[var(--bg-color)] rounded-[24px] text-sm font-black shadow-xl active:scale-[0.98] transition-all"
          >
            SAVE AND APPLY
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// [에러 해결] 이 구문이 반드시 있어야 App.tsx에서 정상적으로 가져올 수 있습니다.
export default SettingsModal;