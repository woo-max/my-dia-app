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
    
    // 1. 예측 탭 설정
    let predictedTab = '';
    const isPureJukan = /^\d+$/.test(shift.dia.trim()) && diaNum >= 1 && diaNum <= 33;
    if (isPureJukan) {
      predictedTab = isTodayHoliday ? '휴일주간' : '평일주간';
    } else {
      const nextDay = addDays(date, 1);
      const isNextHoliday = !!getHolidayName(nextDay) || [0, 6].includes(nextDay.getDay());
      if (isTodayHoliday && isNextHoliday) predictedTab = '휴휴';
      else if (isTodayHoliday && !isNextHoliday) predictedTab = '휴평';
      else if (!isTodayHoliday && isNextHoliday) predictedTab = '평휴';
      else predictedTab = '평평';
    }

    // 2. [핀셋] 전수 조사 로직: 예측한 탭에 없으면 모든 탭을 다 뒤짐
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

    // 데이터가 아예 없을 경우 예외처리
    if (!rowN) rowN = { content: shift.dia === '~' ? '비번/휴무' : '', train: '', dia: shift.dia };
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

    // 3. [핀셋] rowN, rowN1, tabLabel을 보따리에 담아서 리턴
    return { 
      ...shift, 
      rowN, 
      rowN1, 
      tabLabel: finalTab || predictedTab,
      interim: findInterim(rowN.content), 
      endTime: findEndTime(rowN1.content || rowN.content), 
      isRedHighlight: shift.dia.includes('휴') || shift.dia.includes('운') || rowN.content.includes('운휴')
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