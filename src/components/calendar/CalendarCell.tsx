import React, { useRef } from 'react';
import { format } from 'date-fns';
import { getHolidayName } from '../../utils/rotation';

const CalendarCell = React.memo(({ day, isLocked, onLongPress }: any) => {
  const { date, dia, isToday, isInMonth, isUnhyu } = day;
  const isSun = format(date, 'i') === '7';
  const isSat = format(date, 'i') === '6';
  const holidayName = getHolidayName(date);
  
  const timerRef = useRef<any>(null);
  const handleStart = () => { timerRef.current = setTimeout(() => { onLongPress(date, dia, isLocked); timerRef.current = null; }, 600); };
  const handleEnd = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  // 휴 포함 시 빨간색 OR 시트 내용에 '운휴' 포함 시 빨간색
  const isRedText = dia.includes('휴') || isUnhyu;

  return (
    <div 
      onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchEnd={handleEnd} onTouchCancel={handleEnd}
      className={`relative flex flex-col border-r border-b border-[var(--grid-line)] h-full transition-all ${
        isInMonth ? 'bg-[var(--cell-bg)]' : 'bg-transparent opacity-[0.1]'
      }`}
    >
      <div className={`h-[16px] px-1 flex justify-between items-center border-b border-[var(--grid-line)] ${isToday ? 'bg-[var(--mint-highlight)]' : 'bg-transparent'}`}>
        <div className="flex items-center gap-0.5">
          <span className={`text-[9pt] font-black leading-none ${isSun || holidayName ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-[var(--text-color)]'}`}>
            {format(date, 'd')}
          </span>
          {isLocked && <span className="text-[7px] opacity-40 ml-0.5">🔒</span>}
        </div>
        {holidayName && <span className="text-[5pt] font-bold text-red-500 truncate max-w-[35px] leading-none">{holidayName}</span>}
      </div>

      <div className="flex-1 flex flex-col p-1 relative">
        <span className={`text-[10pt] font-black leading-none tracking-tighter ${isRedText ? 'text-red-500' : 'text-[var(--text-color)]'}`}>
          {dia}
        </span>
      </div>
    </div>
  );
});

export default CalendarCell;