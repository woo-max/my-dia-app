import React, { useRef } from 'react';
import { format } from 'date-fns';
import { getHolidayName } from '../../utils/rotation';

const CalendarCell = React.memo(({ day, isLocked, memos = [], onLongPress }: any) => {
  const { date, dia, isToday, isInMonth, isUnhyu, overrideType } = day;
  const isSun = format(date, 'i') === '7';
  const isSat = format(date, 'i') === '6';
  const holidayName = getHolidayName(date);
  
  const timerRef = useRef<any>(null);
  const handleStart = () => { timerRef.current = setTimeout(() => { onLongPress(date, dia, isLocked); timerRef.current = null; }, 600); };
  const handleEnd = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  let textColor = 'text-[var(--text-main)]';
  if (overrideType === 'red') textColor = 'text-red-500';
  else if (overrideType === 'blue') textColor = 'text-blue-500';
  else if (overrideType === 'yellow') textColor = 'text-amber-500'; 
  else if (dia.includes('휴') || isUnhyu) textColor = 'text-red-500';

  return (
    <div 
      onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchEnd={handleEnd} onTouchCancel={handleEnd}
      className={`relative flex flex-col border-r border-b border-[var(--border-line)] h-full transition-none bg-[var(--surface-card)] ${
        !isInMonth ? 'opacity-[0.2]' : ''
      }`}
    >
      <div className={`h-[16px] px-1 flex justify-between items-center border-b border-[var(--border-line)] ${isToday ? 'bg-[var(--surface-active)]' : 'bg-transparent'}`}>
        <div className="flex items-center gap-0.5">
          <span className={`text-[9pt] font-black leading-none ${isSun || holidayName ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-[var(--text-main)]'}`}>
            {format(date, 'd')}
          </span>
          {isLocked && <span className="text-[7px] opacity-40 ml-0.5 text-[var(--text-main)]">🔒</span>}
        </div>

        {/* 공휴일 이름 표시 복구 완료 */}
        {holidayName && (
          <span className="text-[7px] font-black text-red-500 truncate max-w-[35px]">
            {holidayName}
          </span>
        )}
      </div>

      <div className="flex flex-col p-1 gap-0.5 overflow-hidden flex-1">
        <span className={`font-black leading-none tracking-tighter text-[10pt] mb-1 ${textColor}`}>
          {dia}
        </span>
        
        <div className="flex flex-col gap-[1px] w-full">
          {memos.slice(0, 5).map((memo: any) => (
            <div key={memo.id} className="flex items-center h-[12px] w-full overflow-hidden">
              {/* [복구] 좌측 세로 색상 바 */}
              <div className="w-[2.5px] h-full flex-shrink-0" style={{ backgroundColor: memo.color }} />
              
              {/* [유지] 배경 하이라이트 없이 텍스트만 표시 */}
              <span className="text-[7.5pt] font-black leading-none px-1 truncate w-full tracking-tighter text-[var(--text-main)]">
                {memo.text}
              </span>
            </div>
          ))}
          {memos.length > 5 && <span className="text-[5pt] opacity-30 font-black text-center leading-none text-[var(--text-main)]">...</span>}
        </div>
      </div>
    </div>
  );
});

export default CalendarCell;