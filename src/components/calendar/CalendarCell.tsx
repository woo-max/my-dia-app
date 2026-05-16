import React, { useRef } from 'react';
import { format } from 'date-fns';

// 🚀 1. todayColor 프롭스 추가 (기본값은 기존 회색빛 유지)
const CalendarCell = React.memo(({ day, isLocked, memos = [], onLongPress, todayColor = 'var(--surface-active)' }: any) => {
  const { date, dia, isToday, isInMonth, isUnhyu, overrideType, reportTime, holidayName } = day;
  const isSun = format(date, 'i') === '7';
  const isSat = format(date, 'i') === '6';
  
  const timerRef = useRef<any>(null);
  const handleStart = () => { timerRef.current = setTimeout(() => { onLongPress(date, dia, isLocked); timerRef.current = null; }, 600); };
  const handleEnd = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  let textColor = 'text-[var(--text-main)]';
  if (overrideType === 'red') textColor = 'text-red-500';
  else if (overrideType === 'blue') textColor = 'text-blue-500';
  else if (overrideType === 'yellow') textColor = 'text-amber-500'; 
  else if (dia.includes('휴') || dia.includes('운') || isUnhyu) textColor = 'text-red-500';

  return (
    <div 
      onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchEnd={handleEnd} onTouchCancel={handleEnd}
      style={{ transition: 'none' }}
      className={`relative flex flex-col border-r border-b border-[var(--border-line)] h-full bg-[var(--surface-card)] ${
        !isInMonth ? 'opacity-[0.2]' : ''
      }`}
    >
      {/* 🚀 2. className에 고정되어 있던 배경색을 빼고, style 속성으로 직접 색을 주입받는 구조로 변경 */}
      <div 
        className="h-[16px] px-1 flex justify-between items-center border-b border-[var(--border-line)]"
        style={{ backgroundColor: isToday ? todayColor : 'transparent' }}
      >
        <div className="flex items-center gap-0.5">
          <span className={`text-[9pt] font-black leading-none ${isSun || holidayName ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-[var(--text-main)]'}`}>
            {format(date, 'd')}
          </span>
          {isLocked && <span className="text-[7px] opacity-40 ml-0.5 text-[var(--text-main)]">🔒</span>}
        </div>
        {holidayName && (
          <span className="text-[7px] font-black text-red-500 truncate max-w-[35px] leading-none">
            {holidayName}
          </span>
        )}
      </div>

      <div className="flex flex-col p-1 gap-0.5 overflow-hidden flex-1">
        <div className="flex justify-between items-start w-full">
          <span className={`font-black leading-none tracking-tighter text-[12pt] mb-1 ${textColor}`}>         
            {dia}
          </span>
          {reportTime !== '' && !dia.includes('휴') && (
            <span className="text-[8pt] font-black text-[var(--text-main)] tracking-tighter leading-none mt-0.5">  
              {reportTime}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-[1px] w-full ml-[-2px]">
          {memos.slice(0, 5).map((memo: any) => (
            <div key={memo.id} className="flex items-center h-[12px] w-full overflow-hidden">
              <div className="w-[2.5px] h-[7px] flex-shrink-0" style={{ backgroundColor: memo.color }} />
              <span className="text-[6.5pt] font-black leading-none pl-[1px] truncate w-full tracking-tighter text-[var(--text-main)]">
                {memo.text}
              </span>
            </div>
          ))}
          {memos.length > 5 && <span className="text-[5pt] opacity-30 font-black text-center leading-none text-[var(--text-main)]">...</span>}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.day.dia === next.day.dia &&
    prev.day.reportTime === next.day.reportTime &&
    prev.day.isUnhyu === next.day.isUnhyu &&
    prev.day.overrideType === next.day.overrideType &&
    prev.day.isToday === next.day.isToday &&
    prev.day.isInMonth === next.day.isInMonth &&
    prev.day.date.getTime() === next.day.date.getTime() &&
    prev.day.memoHash === next.day.memoHash &&
    prev.isLocked === next.isLocked &&
    prev.onLongPress === next.onLongPress &&
    prev.todayColor === next.todayColor // 🚀 3. 메모이제이션에 색상 변경 조건 추가
  );
});

export default CalendarCell;