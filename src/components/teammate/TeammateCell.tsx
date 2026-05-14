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

  // 하드코딩 색상을 다크모드에서도 명확한 iOS 시스템 컬러 느낌으로 유지
  const getInterimColor = (char: string | null) => {
    if (char === '기') return '#FF3B30'; // iOS Red
    if (char === '불') return '#34C759'; // iOS Green
    if (char === '동') return '#007AFF'; // iOS Blue
    return 'var(--text-main)';
  };

  if (!dutyInfo) return <div className="tm-cell-width h-[60px] border-r border-b border-[var(--border-line)] bg-[var(--off-gray)]" />;

  return (
    <div 
      onClick={() => onClick({ date, ...dutyInfo })}
      className={`tm-cell-width shrink-0 h-[60px] border-r border-b border-[var(--border-line)] relative flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
        isToday(date) ? 'bg-[var(--today-highlight)]' : ''
      } ${dutyInfo.isRedHighlight ? 'bg-[var(--holiday-red)]' : dutyInfo.dia === '~' ? 'bg-[var(--off-gray)]' : 'bg-[var(--surface-card)]'}`}
    >
      {dutyInfo.interim && (
        <span className="absolute top-1 left-1 text-[9.5pt] font-black leading-none" style={{ color: getInterimColor(dutyInfo.interim) }}>
          {dutyInfo.interim}
        </span>
      )}
      
      {/* text-primary 제거 -> text-main 교체 */}
      <span className={`text-[14.5px] font-black leading-none ${dutyInfo.isRedHighlight ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
        {dutyInfo.dia}
      </span>

      {/* opacity-30 대신 text-muted를 사용하여 다크모드 가독성 확보 */}
      <span className="absolute bottom-1 right-1 text-[9pt] font-black text-[var(--text-muted)] tracking-tighter leading-none">
        {dutyInfo.endTime}
      </span>
    </div>
  );
});

export default TeammateCell;