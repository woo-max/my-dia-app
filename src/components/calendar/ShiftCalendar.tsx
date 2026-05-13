import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, isSameDay, startOfWeek, isSameMonth, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Target, Moon, Sun } from 'lucide-react';
import { getShiftForDate } from '../../utils/rotation';
import CalendarCell from './CalendarCell';

const ShiftCalendar = ({ onOpenSettings, isDarkMode, toggleDarkMode, refConfig, lockedShifts, setLockedShifts }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const lockData = lockedShifts[dateKey];
      const shiftInfo = lockData ? { dia: lockData.dia, type: lockData.type } : getShiftForDate(date, refConfig.date, refConfig.dia);
      return { date, ...shiftInfo, isToday: isSameDay(date, startOfDay(new Date())), isInMonth: isSameMonth(date, monthStart), isLocked: !!lockData };
    });
  }, [currentDate, refConfig, lockedShifts]);

  const handleLockToggle = () => {
    const { date, isLocked } = confirmModal;
    const newLocked = { ...lockedShifts };
    if (isLocked) {
      const range = eachDayOfInterval({ start: startOfMonth(date), end: date });
      range.forEach(d => delete newLocked[format(d, 'yyyy-MM-dd')]);
    } else {
      const range = eachDayOfInterval({ start: startOfMonth(date), end: date });
      range.forEach(d => {
        const key = format(d, 'yyyy-MM-dd');
        const dayData = days.find(day => isSameDay(day.date, d));
        if (dayData) newLocked[key] = { dia: dayData.dia, type: dayData.type, locked: true };
      });
    }
    setLockedShifts(newLocked);
    setConfirmModal(null);
  };

  const safeMoveMonth = (offset: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-color)] overflow-hidden">
      <header className="p-6 pt-12 flex justify-between items-end z-10">
        <h1 className="text-5xl font-black font-serif tracking-tighter text-[var(--text-color)] leading-none italic">{format(currentDate, 'MMMM')}</h1>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDarkMode} className="p-2 opacity-30 text-[var(--text-color)]">{isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => setCurrentDate(new Date())} className="p-2 opacity-30 text-[var(--text-color)]"><Target size={22}/></button>
          <button onClick={onOpenSettings} className="p-2 bg-black/5 dark:bg-white/5 rounded-full opacity-30 text-[var(--text-color)]"><Settings size={20}/></button>
        </div>
      </header>
      <div className="grid grid-cols-7 border-b border-[var(--grid-line)]">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className={`py-3 text-center text-[10px] font-black tracking-widest ${i===0?'text-red-500':i===6?'text-blue-500':'text-[var(--text-color)] opacity-20'}`}>{d}</div>
        ))}
      </div>
      <div className="flex-1 relative bg-[var(--grid-line)] min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onAnimationComplete={() => setIsAnimating(false)}
            drag="x" dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => { if (info.offset.x < -80) safeMoveMonth(1); if (info.offset.x > 80) safeMoveMonth(-1); }}
            className="grid grid-cols-7 grid-rows-6 absolute inset-0 touch-none bg-[var(--grid-line)] px-px gap-[0.5px]"
          >
            {days.map(day => (
              <CalendarCell key={day.date.toString()} day={day} isLocked={day.isLocked} onLongPress={(date: any, dia: any, isLocked: any) => setConfirmModal({ date, dia, isLocked })} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-color)] p-8 rounded-[32px] w-full max-sm border border-[var(--grid-line)] shadow-2xl">
              <h3 className="text-xl font-black mb-2 text-[var(--text-color)]">{confirmModal.isLocked ? '고정 해제' : '근무 고정'}</h3>
              <p className="text-sm opacity-60 mb-8 text-[var(--text-color)] leading-relaxed">
                {format(confirmModal.date, 'M월 1일')}부터 {format(confirmModal.date, 'd일')}까지의 <br/>
                {confirmModal.isLocked ? '근무의 고정을 해제할까요?' : '근무를 현재 상태로 고정하시겠습니까?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-bold text-[var(--text-color)]">취소</button>
                <button onClick={handleLockToggle} className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black">확인</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftCalendar;