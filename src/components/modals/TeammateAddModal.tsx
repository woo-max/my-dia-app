import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Hash, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfMonth, startOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

const TeammateAddModal = ({ onClose, onAdd, groupNames, currentGroup }: any) => {
  const [name, setName] = useState("");
  const [openSection, setOpenSection] = useState<'date' | 'dia' | 'group' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDia, setSelectedDia] = useState("1");
  const [selectedGroup, setSelectedGroup] = useState(currentGroup);

  const miniDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(tempDate));
    return eachDayOfInterval({ start, end: addMonths(start, 1) }).slice(0, 42);
  }, [tempDate]);

  const diaList = [...Array.from({length: 54}, (_, i)=>String(i+1)), '대1','대2', '대3', '대4', '대5', '대6', '대11', '대12', '대13', '대14', '~'];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--surface-card)] w-full max-w-sm rounded-[40px] p-8 shadow-2xl border border-[var(--border-line)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black italic font-serif text-[var(--text-primary)]">Add Teammate</h2>
          <button onClick={onClose} className="p-1 opacity-20 text-[var(--text-primary)]"><X size={24}/></button>
        </div>

        <div className="space-y-4">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="동료 이름" className="w-full bg-[var(--memo-bg)] text-[var(--text-primary)] rounded-2xl p-4 font-black outline-none border border-[var(--border-line)]" />
          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='date'?null:'date')} className="w-full p-4 flex justify-between items-center text-sm font-black text-[var(--text-primary)]">
              <span className="opacity-30 flex items-center gap-3"><Calendar size={18}/> 기준 날짜</span>
              <span className="text-[11px] font-black underline underline-offset-4 decoration-2">{format(selectedDate, 'MM.dd')}</span>
            </button>
            <AnimatePresence>
              {openSection === 'date' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-4 pb-4 border-t border-[var(--border-line)] overflow-hidden text-[var(--text-primary)]">
                  <div className="flex justify-between items-center py-3"><button onClick={()=>setTempDate(subMonths(tempDate, 1))}><ChevronLeft size={16}/></button><span className="text-[10px] font-black">{format(tempDate, 'yyyy. MM')}</span><button onClick={()=>setTempDate(addMonths(tempDate, 1))}><ChevronRight size={16}/></button></div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {miniDays.map((d, i) => <button key={i} onClick={()=>setSelectedDate(d)} className={`py-2 text-[10px] font-black rounded-lg ${isSameDay(d, selectedDate)?'bg-[var(--surface-active)] text-[var(--text-primary)]':isSameMonth(d, tempDate)?'opacity-100':'opacity-10'}`}>{format(d, 'd')}</button>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='dia'?null:'dia')} className="w-full p-4 flex justify-between items-center text-sm font-black text-[var(--text-primary)]">
              <span className="opacity-30 flex items-center gap-3"><Hash size={18}/> 기준 다이아</span>
              <span className="text-[11px] font-black underline underline-offset-4 decoration-2">{selectedDia}</span>
            </button>
            <AnimatePresence>
              {openSection === 'dia' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="p-4 border-t border-[var(--border-line)] max-h-40 overflow-y-auto no-scrollbar grid grid-cols-5 gap-2">
                  {diaList.map(d => <button key={d} onClick={()=>{setSelectedDia(d); setOpenSection(null);}} className={`h-10 rounded-xl text-[10px] font-black ${selectedDia===d?'bg-[var(--surface-active)] text-[var(--text-primary)]':'bg-[var(--surface-card)] text-[var(--text-primary)] opacity-40'}`}>{d}</button>)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] overflow-hidden">
            <button onClick={() => setOpenSection(openSection==='group'?null:'group')} className="w-full p-4 flex justify-between items-center text-sm font-black text-[var(--text-primary)]">
              <span className="opacity-30 flex items-center gap-3"><Users size={18}/> 그룹 선택</span>
              <span className="text-[11px] font-black underline underline-offset-4 decoration-2">{groupNames[selectedGroup]}</span>
            </button>
            <AnimatePresence>
              {openSection === 'group' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-[var(--border-line)] overflow-hidden">
                  {groupNames.map((name: string, i: number) => (
                    <button key={i} onClick={() => {setSelectedGroup(i); setOpenSection(null);}} className={`w-full p-4 text-left text-xs font-black border-b border-[var(--border-line)] last:border-0 text-[var(--text-primary)] ${selectedGroup === i ? 'bg-[var(--surface-active)]' : 'opacity-40'}`}>{name}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => { if(!name.trim()) return; onAdd({id: Date.now().toString(), name, group: selectedGroup, refDate: selectedDate, refDia: selectedDia}); onClose(); }} className="w-full mt-4 py-5 bg-black text-white dark:bg-white dark:text-black rounded-[24px] text-sm font-black shadow-xl active:scale-95 transition-all">SAVE TEAMMATE</button>
        </div>
      </motion.div>
    </div>
  );
};

export default TeammateAddModal;