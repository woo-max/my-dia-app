import React, { useState, useMemo, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, isSameDay, startOfWeek, isSameMonth, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Target, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { getShiftForDate, getShiftMapping } from '../../utils/rotation';
import CalendarCell from './CalendarCell';
import DayDetailModal from '../modals/DayDetailModal';

const ShiftCalendar = ({ onOpenSettings, isDarkMode, toggleDarkMode, refConfig, lockedShifts, setLockedShifts, customDayTypes, setCustomDayTypes, overrides, setOverrides, memos, setMemos, sheetData }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (selectedDay) { setSelectedDay(null); } 
      else if (confirmModal) { setConfirmModal(null); }
    });
    return () => { backListener.then(h => h.remove()); };
  }, [selectedDay, confirmModal]);

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

      return { 
        date, ...finalInfo, originalDia: originalInfo.dia, 
        isToday: isSameDay(date, startOfDay(new Date())), 
        isInMonth: isSameMonth(date, monthStart), 
        isLocked: !!lockData,
        memos: memos[dateKey] || [],
        overrideType: overrideData?.type
      };
    });
  }, [currentDate, refConfig, lockedShifts, overrides, memos]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden relative transition-none">
      <header className="p-6 pt-12 flex justify-between items-end z-10">
        <div className="flex items-end gap-3">
          <div className="flex gap-2 mb-1">
            <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="p-1 opacity-20"><ChevronLeft size={24}/></button>
            <h1 className="text-5xl font-black font-serif tracking-tighter text-[var(--text-main)] leading-none italic mx-1">{format(currentDate, 'M월')}</h1>
            <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="p-1 opacity-20"><ChevronRight size={24}/></button>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDarkMode} className="p-2 opacity-30 text-[var(--text-main)]">{isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
          <button onClick={() => setCurrentDate(new Date())} className="p-2 opacity-30 text-[var(--text-main)]"><Target size={22}/></button>
          <button onClick={onOpenSettings} className="p-2 bg-black/5 rounded-full opacity-20 text-[var(--text-main)]"><Settings size={20}/></button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-[var(--border-line)]">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className={`py-3 text-center text-[10px] font-black tracking-widest ${i===0?'text-red-500':i===6?'text-blue-500':'text-[var(--text-main)] opacity-20'}`}>{d}</div>
        ))}
      </div>

      <div className="flex-1 relative bg-[var(--border-line)] min-h-0 px-px">
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
            className="grid grid-cols-7 grid-rows-6 absolute inset-0 touch-none bg-[var(--bg-main)] gap-[0.5px]"
          >
            {days.map(day => (
              <div key={day.date.toString()} onClick={() => setSelectedDay(day)}>
                <CalendarCell day={day} isLocked={day.isLocked} memos={day.memos} onLongPress={(date: any, dia: any, isLocked: any) => setConfirmModal({ date, dia, isLocked })} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <DayDetailModal 
            date={selectedDay.date} originalDia={selectedDay.originalDia}
            overrideType={selectedDay.overrideType} customDayTypes={customDayTypes}
            onClose={() => setSelectedDay(null)}
            onDayTypeChange={(date: Date, type: string) => setCustomDayTypes({ ...customDayTypes, [format(date, 'yyyy-MM-dd')]: type })}
            overrides={overrides} setOverrides={setOverrides} memos={memos} setMemos={setMemos} sheetData={sheetData}
          />
        )}
        {confirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60" onClick={() => setConfirmModal(null)}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--surface-card)] p-8 rounded-[32px] w-full max-w-sm border border-[var(--border-line)] shadow-2xl">
              <h3 className="text-xl font-black mb-2 text-[var(--text-main)]">고정 설정</h3>
              <p className="text-sm opacity-60 mb-8 leading-relaxed text-[var(--text-main)]">
                {confirmModal.isLocked ? '근무 고정을 해제할까요?' : '근무를 현재 상태로 고정하시겠습니까?'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 py-4 bg-black/5 rounded-2xl font-bold text-[var(--text-main)]">취소</button>
                <button onClick={() => {
                  const { date, isLocked } = confirmModal;
                  const newLocked = { ...lockedShifts };
                  const range = eachDayOfInterval({ start: startOfMonth(date), end: date });
                  if (isLocked) {
                    range.forEach(d => delete newLocked[format(d, 'yyyy-MM-dd')]);
                  } else {
                    range.forEach(d => {
                      const key = format(d, 'yyyy-MM-dd');
                      const dayData = days.find(day => isSameDay(day.date, d));
                      if (dayData) newLocked[key] = { dia: dayData.dia, locked: true };
                    });
                  }
                  setLockedShifts(newLocked);
                  setConfirmModal(null);
                }} className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black">확인</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftCalendar;