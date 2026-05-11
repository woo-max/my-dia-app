// src/components/DetailPopup.tsx
import React from 'react';
import { format } from 'date-fns';
import { X, FileEdit } from 'lucide-react';
import { getHolidayData } from '../lib/types';

interface DetailPopupProps {
  selectedDate: Date;
  detailData: any;
  theme: any;
  onClose: () => void;
  onShiftMenu: () => void;
  onMemoInput: () => void;
  getDutyColor: (l: string, t: string) => string;
  memoList: string[];
  renderSwipeableMemo: (m: string, i: number) => React.ReactNode;
}

export const DetailPopup = ({ selectedDate, detailData, theme, onClose, onShiftMenu, onMemoInput, getDutyColor, memoList, renderSwipeableMemo }: DetailPopupProps) => {
  const h = getHolidayData(selectedDate);
  
  return (
    <div className="fixed inset-0 z-[200] flex flex-col animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div className="flex justify-end p-4 z-[210]">
        <button onClick={onClose} style={{ backgroundColor: theme.card }} className="p-2 rounded-full border shadow-sm active:scale-90"><X className="w-6 h-6"/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black tracking-tighter leading-none">{format(selectedDate, 'M월 d일')}</span>
            <span className="text-xs font-bold opacity-30 mb-0.5">{['일요일','월요일','화요일','수요일','목요일','금요일','토요일'][selectedDate.getDay()]}</span>
          </div>
          {detailData.isUser && (
            <button onClick={onShiftMenu} style={{ backgroundColor: theme.card }} className="text-[11px] font-black border px-3 py-1.5 rounded-lg shadow-sm active:scale-95 text-slate-500">근무 변경</button>
          )}
        </div>

        <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-2xl p-4 flex justify-between items-center shadow-sm mb-2">
          <div className="flex flex-col items-center">
            <div style={{ backgroundColor: theme.bg }} className="w-14 h-14 rounded-xl flex items-center justify-center border mb-1">
              <span style={{ color: detailData.isRed ? '#EF4444' : getDutyColor(detailData.label, theme.text), fontSize: detailData.diaNum?.length > 3 ? '13px' : '22px' }} className="font-black">{detailData.diaNum}</span>
            </div>
            <span className="text-[10px] font-black opacity-30 uppercase">{detailData.label}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black opacity-20 mb-0.5 uppercase">출근 시간</div>
            <div className="text-4xl font-black tracking-tighter">{detailData.reportTime || "--:--"}</div>
          </div>
        </div>

        {detailData.content1 && (
          <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-xl p-3 flex items-center gap-3 mb-1.5">
            <div style={{ backgroundColor: theme.bg }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] opacity-40 shrink-0">전반</div>
            <div className="font-bold text-[14px] leading-snug whitespace-pre-wrap">{detailData.content1}</div>
          </div>
        )}
        {detailData.content2 && (
          <div style={{ backgroundColor: theme.card, borderColor: theme.border }} className="border rounded-xl p-3 flex items-center gap-3 mb-1.5">
            <div style={{ backgroundColor: theme.bg }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] opacity-40 shrink-0">후반</div>
            <div className="font-bold text-[14px] leading-snug whitespace-pre-wrap">{detailData.content2}</div>
          </div>
        )}

        <div className="mt-4">
          {memoList.map((m, i) => renderSwipeableMemo(m, i))}
        </div>
      </div>

      <button onClick={onMemoInput} style={{ backgroundColor: theme.btnMute }} className="fixed bottom-8 right-8 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center z-[250] active:scale-95 bg-slate-800"><FileEdit className="w-6 h-6" /></button>
    </div>
  );
};

