import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
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

  // [Case 4] 뒤로가기 시 모달 닫기 복원
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      onClose();
    });
    return () => { backListener.then(h => h.remove()); };
  }, [onClose]);

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
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-24 px-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-[var(--surface-card)] rounded-[40px] p-8 shadow-2xl border border-[var(--border-line)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-10 text-[var(--text-main)]">
          <h2 className="text-2xl font-black font-serif italic tracking-tighter leading-none">Setting</h2>
          <button onClick={onClose} className="p-2 bg-[var(--memo-bg)] rounded-full opacity-60 hover:opacity-100 transition-opacity">
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-4 text-[var(--text-main)]">
          {/* 1. 인라인 미니 달력 섹션 */}
          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'date' ? null : 'date')} 
              className="w-full p-5 flex justify-between items-center text-sm font-black"
            >
              <div className="flex items-center gap-3 opacity-50"><Calendar size={18}/> 기준 날짜</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md">
                  {format(selectedDate, 'MM. dd')}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${openSection === 'date' ? 'rotate-180' : ''}`}/>
              </div>
            </button>
            <AnimatePresence>
              {openSection === 'date' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="px-4 pb-5 border-t border-[var(--border-line)]"
                >
                  <div className="flex justify-between items-center py-4 px-2">
                    <button onClick={() => setTempDate(subMonths(tempDate, 1))} className="p-1 opacity-40 hover:opacity-100"><ChevronLeft size={16}/></button>
                    <span className="text-[10px] font-black tracking-widest opacity-80">{format(tempDate, 'yyyy. MM')}</span>
                    <button onClick={() => setTempDate(addMonths(tempDate, 1))} className="p-1 opacity-40 hover:opacity-100"><ChevronRight size={16}/></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S','M','T','W','T','F','S'].map(d => (
                      <div key={d} className={`text-[8px] font-black py-1 ${d==='S'?'text-red-500':'opacity-20'}`}>{d}</div>
                    ))}
                    {miniDays.map((date, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`py-2 text-[10px] font-black rounded-lg transition-all ${
                          isSameDay(date, selectedDate) 
                            ? 'bg-blue-500 text-white shadow-lg scale-95' 
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

          {/* 2. DIA 셀렉터 섹션 */}
          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button 
              onClick={() => setOpenSection(openSection === 'dia' ? null : 'dia')} 
              className="w-full p-5 flex justify-between items-center text-sm font-black"
            >
              <div className="flex items-center gap-3 opacity-50"><Hash size={18}/> 기준 다이아</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md">{selectedDia}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${openSection === 'dia' ? 'rotate-180' : ''}`}/>
              </div>
            </button>
            <AnimatePresence>
              {openSection === 'dia' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="p-4 border-t border-[var(--border-line)]"
                >
                  <div className="grid grid-cols-5 gap-2 h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {diaList.map(d => (
                      <button 
                        key={d} 
                        onClick={() => setSelectedDia(d)}
                        className={`h-10 rounded-xl text-xs font-black transition-all ${
                          selectedDia === d 
                            ? 'bg-blue-500 text-white shadow-lg scale-95' 
                            : 'bg-[var(--surface-card)] border border-[var(--border-line)] opacity-60'
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

          {/* 저장 버튼 (Case 6 시각적 정체성 반영) */}
          <button 
            onClick={() => onSave({ date: selectedDate, dia: selectedDia })}
            className="w-full mt-6 py-5 bg-[var(--text-main)] text-[var(--surface-card)] rounded-[24px] text-sm font-black shadow-xl active:scale-[0.98] transition-all"
          >
            SAVE AND APPLY
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SettingsModal;