import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { format, startOfMonth, startOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ALL_DIA_OPTIONS } from '../../utils/rotation';

const SettingsModal = ({ onClose, currentConfig, onSave }: any) => {
  // TeammateAddModal의 상태 로직 이식
  const [openSection, setOpenSection] = useState<'date' | 'dia' | null>(null);
  const [tempDate, setTempDate] = useState(new Date(currentConfig.date));
  const [selectedDate, setSelectedDate] = useState(new Date(currentConfig.date));
  const [selectedDia, setSelectedDia] = useState(currentConfig.dia);

  // 미니 달력 계산 로직
  const miniDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(tempDate));
    return eachDayOfInterval({ start, end: addMonths(start, 1) }).slice(0, 42);
  }, [tempDate]);

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        className="bg-[var(--surface-card)] w-full max-w-[430px] rounded-t-[40px] p-8 pb-12 shadow-2xl border-t border-[var(--border-line)]"
      >
        <div className="w-12 h-1.5 bg-[var(--text-main)] opacity-10 rounded-full mx-auto mb-6" />
        
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black italic font-serif text-[var(--text-main)]">Settings</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)]"><X size={24}/></button>
        </header>

        <div className="space-y-4">
          {/* 섹션 1: 기준 날짜 설정 (아코디언) */}
          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='date'?null:'date')} className="w-full p-4 flex justify-between items-center text-sm font-black">
              <span className="text-[var(--text-muted)] flex items-center gap-3"><Calendar size={18}/> 기준 날짜</span>
              <span className="text-[11px] font-black text-[var(--text-main)] underline underline-offset-4 decoration-2">{format(selectedDate, 'yyyy. MM. dd')}</span>
            </button>
            <AnimatePresence>
              {openSection === 'date' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 border-t border-[var(--border-line)] overflow-hidden">
                  <div className="flex justify-between items-center py-3 text-[var(--text-main)]">
                    <button onClick={()=>setTempDate(subMonths(tempDate, 1))}><ChevronLeft size={16}/></button>
                    <span className="text-[10px] font-black">{format(tempDate, 'yyyy. MM')}</span>
                    <button onClick={()=>setTempDate(addMonths(tempDate, 1))}><ChevronRight size={16}/></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {miniDays.map((d, i) => (
                      <button 
                        key={i} 
                        onClick={()=>setSelectedDate(d)} 
                        className={`py-2 text-[10px] font-black rounded-lg transition-colors ${
                          isSameDay(d, selectedDate) ? 'bg-[var(--text-main)] text-[var(--surface-card)]' : isSameMonth(d, tempDate) ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {format(d, 'd')}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 섹션 2: 기준 DIA 설정 (아코디언) */}
          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='dia'?null:'dia')} className="w-full p-4 flex justify-between items-center text-sm font-black">
              <span className="text-[var(--text-muted)] flex items-center gap-3"><Hash size={18}/> DIA </span>
              <span className="text-[11px] font-black text-[var(--text-main)] underline underline-offset-4 decoration-2">{selectedDia}</span>
            </button>
            <AnimatePresence>
              {openSection === 'dia' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="p-4 border-t border-[var(--border-line)] max-h-40 overflow-y-auto no-scrollbar grid grid-cols-5 gap-2">
                  {ALL_DIA_OPTIONS.map(d => (
                    <button 
                      key={d} 
                      onClick={()=>{setSelectedDia(d); setOpenSection(null);}} 
                      className={`h-10 rounded-xl text-[10px] font-black transition-colors ${
                        selectedDia===d ? 'bg-[var(--text-main)] text-[var(--surface-card)]' : 'bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-line)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 저장 버튼 */}
          <button 
            onClick={() => onSave({ date: selectedDate, dia: selectedDia })} 
            className="w-full mt-4 py-5 bg-[var(--text-main)] text-[var(--surface-card)] rounded-3xl text-sm font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save size={18} /> SAVE SETTINGS
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;