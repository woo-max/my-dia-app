import React, { useMemo } from 'react';
import { format, isToday, addDays } from 'date-fns';
import { getShiftForDate, getHolidayName } from '../../utils/rotation';

const TeammateCell = React.memo(({ date, teammate, sheetData, onClick }: any) => {
  const dutyInfo = useMemo(() => {
    if (!sheetData) return null;
    const baseDate = teammate.refDate instanceof Date ? teammate.refDate : new Date(teammate.refDate);
    const shift = getShiftForDate(date, baseDate, teammate.refDia);
    
    const isTodayHoliday = !!getHolidayName(date) || [0, 6].includes(date.getDay());
    const diaNum = parseInt(shift.dia.replace(/[^0-9]/g, '')) || 0;
    
    let targetTab = '';
    if (diaNum >= 1 && diaNum <= 33) {
      targetTab = isTodayHoliday ? '휴일주간' : '평일주간';
    } else {
      const nextDay = addDays(date, 1);
      const isNextHoliday = !!getHolidayName(nextDay) || [0, 6].includes(nextDay.getDay());
      if (isTodayHoliday && isNextHoliday) targetTab = '휴휴';
      else if (isTodayHoliday && !isNextHoliday) targetTab = '휴평';
      else if (!isTodayHoliday && isNextHoliday) targetTab = '평휴';
      else targetTab = '평평';
    }

    const rows = sheetData[targetTab] || [];
    const diaIndex = rows.findIndex((r: any) => String(r.dia).trim() === String(shift.dia).trim());
    const rowN = rows[diaIndex] || { content: '', train: '', dia: shift.dia };
    const rowN1 = rows[diaIndex + 1] || { content: '', train: '' };

    const findInterim = (text: string) => {
      const targets = ['기', '불', '동', '진', '사', '오'];
      for (let i = text.length - 1; i >= 0; i--) {
        if (targets.includes(text[i])) return text[i];
      }
      return null;
    };

    const findEndTime = (text: string) => {
      const matches = text.match(/\d{2}:\d{2}/g);
      return matches ? matches[matches.length - 1] : "";
    };

    const isRedHighlight = shift.dia.includes('휴') || shift.dia.includes('운') || rowN.content.includes('운휴');

    return { 
      ...shift, name: teammate.name, interim: findInterim(rowN.content), endTime: findEndTime(rowN1.content), 
      isRedHighlight, tabLabel: targetTab, rowN, rowN1
    };
  }, [date, teammate, sheetData]);

  const getInterimColor = (char: string | null) => {
    if (char === '기') return '#FF2D55';
    if (char === '불') return '#4CD964';
    if (char === '동') return '#5AC8FA';
    return 'var(--text-primary)';
  };

  if (!dutyInfo) return <div className="tm-cell-width h-[60px] border-r border-b border-[var(--border-line)] bg-[var(--off-gray)]" />;

  return (
    <div 
      onClick={() => onClick({ date, ...dutyInfo })}
      className={`tm-cell-width shrink-0 h-[60px] border-r border-b border-[var(--border-line)] relative flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
        isToday(date) ? 'bg-[var(--today-highlight)]' : ''
      } ${dutyInfo.isRedHighlight ? 'bg-[var(--holiday-red)]' : dutyInfo.dia === '~' ? 'bg-[var(--off-gray)]' : 'bg-[var(--surface-card)]'}`}
    >
      {dutyInfo.interim && <span className="absolute top-1 left-1 text-[9.5pt] font-black leading-none" style={{ color: getInterimColor(dutyInfo.interim) }}>{dutyInfo.interim}</span>}
      <span className={`text-[14.5px] font-black leading-none ${dutyInfo.isRedHighlight ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
        {dutyInfo.dia}
      </span>
      <span className="absolute bottom-1 right-1 text-[9pt] font-black opacity-30 text-[var(--text-primary)] tracking-tighter leading-none">{dutyInfo.endTime}</span>
    </div>
  );
});

export default TeammateCell;