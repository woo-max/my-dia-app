import React from 'react';
import { format } from 'date-fns';

const CalendarCell = React.memo(({ day }: any) => {
  const { date, dia, type, isToday, isInMonth } = day;
  
  // 일요일/토요일 색상 판별
  const isSunday = format(date, 'i') === '7';
  const isSaturday = format(date, 'i') === '6';

  return (
    <div className={`relative flex flex-col border-r border-b border-[var(--grid-line)] transition-colors ${
      isInMonth ? 'bg-[var(--bg-color)]' : 'bg-transparent opacity-10'
    }`}>
      {/* 상단 날짜 영역 */}
      <div className="p-2 flex justify-between">
        <span className={`text-[11px] font-bold ${
          isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-[var(--text-color)]'
        }`}>
          {format(date, 'd')}
        </span>
      </div>

      {/* 중앙 근무(DIA) 영역 - [수정] 모든 글씨색 통일 */}
      <div className="flex-1 flex items-center justify-center -mt-4">
        <span className="text-3xl font-black tracking-tighter text-[var(--text-color)]">
          {dia}
        </span>
      </div>

      {/* 오늘 날짜 하이라이트 */}
      {isToday && (
        <div className="absolute inset-0 bg-[var(--mint-highlight)] border-2 border-[#A8E6CF] pointer-events-none" />
      )}
    </div>
  );
});

export default CalendarCell;