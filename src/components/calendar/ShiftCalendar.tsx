import React, { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, isSameMonth, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Target, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { getShiftForDate } from '../../utils/rotation';
import CalendarCell from './CalendarCell';

const ShiftCalendar = ({ onOpenSettings, isDarkMode, toggleDarkMode, refConfig }: any) => {
  const [calendarState, setCalendarState] = useState({ currentDate: new Date(), direction: 0 });
  const { currentDate, direction } = calendarState;

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + i);
      return {
        date, ...getShiftForDate(date, refConfig.date, refConfig.dia),
        isToday: isSameDay(date, startOfDay(new Date())),
        isInMonth: isSameMonth(date, monthStart)
      };
    });
  }, [currentDate, refConfig]);

  const moveMonth = (val: number) => setCalendarState({ direction: val, currentDate: val > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1) });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-color)] overflow-hidden">
      <header className="p-6 pt-12 flex justify-between items-end z-10">
        <div className="flex gap-2 items-end">
          <h1 className="text-5xl font-black font-serif tracking-tighter text-[var(--text-color)]">{format(currentDate, 'MMMM')}</h1>
          <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-0.5 ml-2">
            <button onClick={() => moveMonth(-1)} className="p-1 opacity-30 text-[var(--text-color)]"><ChevronLeft size={20}/></button>
            <button onClick={() => moveMonth(1)} className="p-1 opacity-30 text-[var(--text-color)]"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDarkMode} className="p-2 opacity-30 text-[var(--text-color)]">{isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => setCalendarState({ direction: 0, currentDate: new Date() })} className="p-2 opacity-30 text-[var(--text-color)]"><Target size={22}/></button>
          <button onClick={onOpenSettings} className="p-2 bg-black/5 dark:bg-white/5 rounded-full opacity-30 text-[var(--text-color)]"><Settings size={20}/></button>
        </div>
      </header>
      <div className="grid grid-cols-7 border-b border-[var(--grid-line)] px-0.5">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className={`py-4 text-center text-[10px] font-black tracking-widest ${i===0?'text-red-500':i===6?'text-blue-500':'opacity-20'}`}>{d}</div>
        ))}
      </div>
      <div className="flex-1 relative bg-[var(--grid-line)] min-h-0">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={format(currentDate, 'yyyy-MM')}
            custom={direction}
            variants={{ enter: d => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }), center: { x: 0, opacity: 1 }, exit: d => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }) }}
            initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) moveMonth(1);
              if (info.offset.x > 80) moveMonth(-1);
            }}
            className="grid grid-cols-7 grid-rows-6 absolute inset-0 touch-none bg-[var(--grid-line)] px-px"
          >
            {days.map(day => <CalendarCell key={day.date.toString()} day={day} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShiftCalendar;