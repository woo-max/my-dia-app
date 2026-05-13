import React, { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, isSameDay, startOfWeek, isSameMonth, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Target, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { getShiftForDate, getShiftMapping } from '../../utils/rotation';
import CalendarCell from './CalendarCell';
import DayDetailModal from '../modals/DayDetailModal';

const ShiftCalendar = ({ onOpenSettings, isDarkMode, toggleDarkMode, refConfig, lockedShifts, setLockedShifts, customDayTypes, setCustomDayTypes, overrides, setOverrides, sheetData }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const originalInfo = getShiftForDate(date, refConfig.date, refConfig.dia);
      
      let finalInfo = { ...originalInfo };
      const overrideData = overrides[dateKey];
      const lockData = lockedShifts[dateKey];

      if (overrideData) { finalInfo = { dia: overrideData.dia, type: overrideData.type }; }
      else if (lockData) { finalInfo = { dia: lockData.dia }; }

      let isUnhyu = false;
      if (sheetData && finalInfo.dia !== '~' && !overrideData) {
        const mapping = getShiftMapping(date, finalInfo.dia, customDayTypes);
        const targetTab = sheetData[mapping.tab] || [];
        isUnhyu = targetTab.some((row: any) => String(row.dia).trim() === String(finalInfo.dia).trim() && row.content.includes('운휴'));
      }

      return { 
        date, ...finalInfo, originalDia: originalInfo.dia, 
        isToday: isSameDay(date, startOfDay(new Date())), 
        isInMonth: isSameMonth(date, monthStart), 
        isLocked: !!lockData, isUnhyu, overrideType: overrideData?.type 
      };
    });
  }, [currentDate, refConfig, lockedShifts, sheetData, customDayTypes, overrides]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-color)] overflow-hidden transition-none">
      <header className="p-6 pt-12 flex justify-between items-end z-10">
        <div className="flex items-end gap-3">
          <div className="flex gap-2 mb-1">
            <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="p-1 opacity-20"><ChevronLeft size={24}/></button>
            <h1 className="text-5xl font-black font-serif tracking-tighter text-[var(--text-color)] leading-none italic mx-1">{format(currentDate, 'M월')}</h1>
            <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="p-1 opacity-20"><ChevronRight size={24}/></button>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDarkMode} className="p-2 opacity-30 text-[var(--text-color)]">{isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => setCurrentDate(new Date())} className="p-2 opacity-30 text-[var(--text-color)]"><Target size={22}/></button>
          <button onClick={onOpenSettings} className="p-2 bg-black/5 rounded-full opacity-20 text-[var(--text-color)]"><Settings size={20}/></button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-[var(--grid-line)]">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className={`py-3 text-center text-[10px] font-black tracking-widest ${i===0?'text-red-500':i===6?'text-blue-500':'text-[var(--text-color)] opacity-20'}`}>{d}</div>
        ))}
      </div>

      <div className="flex-1 relative bg-[var(--grid-line)] min-h-0 px-px">
        <AnimatePresence mode="wait">
          <motion.div
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            drag="x" dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) setCurrentDate(prev => addMonths(prev, 1));
              if (info.offset.x > 100) setCurrentDate(prev => subMonths(prev, 1));
            }}
            className="grid grid-cols-7 grid-rows-6 absolute inset-0 touch-none bg-[var(--grid-line)] gap-[0.5px]"
          >
            {days.map(day => (
              <div key={day.date.toString()} onClick={() => setSelectedDay(day)}>
                <CalendarCell day={day} isLocked={day.isLocked} onLongPress={(date: any, dia: any, isLocked: any) => setConfirmModal({ date, dia, isLocked })} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <DayDetailModal 
            date={selectedDay.date} originalDia={selectedDay.originalDia}
            customDayTypes={customDayTypes} onClose={() => setSelectedDay(null)}
            onDayTypeChange={(date: Date, type: string) => setCustomDayTypes({ ...customDayTypes, [format(date, 'yyyy-MM-dd')]: type })}
            overrides={overrides} setOverrides={setOverrides} sheetData={sheetData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftCalendar;