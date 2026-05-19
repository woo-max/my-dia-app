import React, { useMemo } from 'react';
import { format, isToday, addDays } from 'date-fns';
import { getShiftForDate, getHolidayName } from '../../utils/rotation';

const TeammateCell = React.memo(({ date, teammate, sheetData, onClick }: any) => {
  const dutyInfo = useMemo(() => {
    if (!sheetData) return null;
    const baseDate = teammate.refDate instanceof Date ? teammate.refDate : new Date(teammate.refDate);
    const shift = getShiftForDate(date, baseDate, teammate.refDia);

    // 3. 기존 로직 그대로 유지
    const isTodayHoliday = !!getHolidayName(date) || [0, 6].includes(date.getDay());
    const diaString = String(shift.dia || "");
    const diaNum = parseInt(diaString.replace(/[^0-9]/g, '')) || 0;
    
    // 4. 나머지 탭 설정 및 로직 (기존과 동일)
    let predictedTab = '';
    const isPureJukan = /^\d+$/.test(diaString.trim()) && diaNum >= 1 && diaNum <= 33;
    if (isPureJukan) {
      predictedTab = isTodayHoliday ? '휴일주간' : '평일주간';
    } else {
      const nextDay = addDays(date, 1);
      const isNextHoliday = !!getHolidayName(nextDay) || [0, 6].includes(nextDay.getDay());
      if (isTodayHoliday && isNextHoliday) predictedTab = '휴휴';
      else if (isTodayHoliday && !isNextHoliday) predictedTab = '휴평';
      else if (!isPureJukan && isNextHoliday) predictedTab = '평휴';
      else predictedTab = '평평';
    }

    const allTabs = ['평일주간', '휴일주간', '평평', '평휴', '휴휴', '휴평'];
    const searchOrder = [predictedTab, ...allTabs.filter(t => t !== predictedTab)];
    
    let rowN = null;
    let rowN1 = null;
    let finalTab = '';

    for (const tab of searchOrder) {
      const rows = sheetData[tab] || [];
      const idx = rows.findIndex((r: any) => String(r.dia).trim() === String(shift.dia).trim());
      if (idx !== -1) {
        rowN = rows[idx];
        rowN1 = rows[idx + 1] || { content: '', train: '' };
        finalTab = tab;
        break;
      }
    }

    if (!rowN) rowN = { content: shift.dia === '~' ? '비번' : '', train: '', dia: shift.dia };
    if (!rowN1) rowN1 = { content: '', train: '' };

    const findInterim = (text: string) => {
      const targets = ['기', '불', '동', '진', '사', '오'];
      for (let i = text.length - 1; i >= 0; i--) { if (targets.includes(text[i])) return text[i]; }
      return null;
    };

    const findEndTime = (text: string) => {
      const matches = text.match(/\d{2}:\d{2}/g);
      return matches ? matches[matches.length - 1] : "";
    };

    return { 
      ...shift, 
      rowN, 
      rowN1, 
      tabLabel: finalTab || predictedTab,
      interim: findInterim(rowN.content || ""), 
      endTime: findEndTime(rowN1.content || rowN.content || ""), 
      isRedHighlight: String(shift.dia).includes('휴') || String(shift.dia).includes('운') || String(rowN.content).includes('운휴')
    };
  }, [date, teammate, sheetData]);

  const getInterimColor = (char: string | null) => {
    if (char === '기') return '#FF3B30';
    if (char === '불') return '#34C759';
    if (char === '동') return '#007AFF';
    return 'var(--text-main)';
  };

  if (!dutyInfo) return <div className="tm-cell-width h-[36px] border-r border-b border-[var(--border-line)] bg-[var(--off-gray)]" />;

  return (
    <div 
      onClick={() => onClick({ date, name: teammate.name, ...dutyInfo })}
      className={`tm-cell-width shrink-0 h-[36px] border-r border-b border-[var(--border-line)] relative flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
        isToday(date) ? 'bg-[var(--today-highlight)]' : ''
      } ${dutyInfo.isRedHighlight ? 'bg-[var(--holiday-red)]' : dutyInfo.dia === '~' ? 'bg-[var(--off-gray)]' : 'bg-[var(--surface-card)]'}`}
    >
      {dutyInfo.interim && (
        <span className="absolute top-0.5 left-0.5 text-[9.5px] font-black leading-none opacity-90" style={{ color: getInterimColor(dutyInfo.interim) }}>
          {dutyInfo.interim}
        </span>
      )}
      <span className={`text-[14.5px] font-black leading-none ${dutyInfo.isRedHighlight ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
        {dutyInfo.dia}
      </span>
      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-black text-[var(--text-main)] tracking-tighter leading-none opacity-50">
        {dutyInfo.endTime}
      </span>
    </div>
  );
});

export default TeammateCell;