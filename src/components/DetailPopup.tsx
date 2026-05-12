import React from 'react';
import { format } from 'date-fns';
import { X, FileEdit, Trash2 } from 'lucide-react';

export const DetailPopup = ({ selectedDate, detailData, theme, onClose, onShiftMenu, onMemoInput, memoList, onDeleteMemo }: any) => {
  if (!detailData) return null;
  return (
    <div className="fixed inset-0 z-[500] flex flex-col animate-in slide-in-from-bottom duration-300" 
         style={{ backgroundColor: theme.bg, color: theme.text }} onClick={e => e.stopPropagation()}>
      <div className="flex justify-end p-4"><button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-full border bg-white/10 shadow-sm"><X className="w-6 h-6"/></button></div>
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-end gap-2"><span className="text-4xl font-black tracking-tighter leading-none">{format(selectedDate, 'M월 d일')}</span><span className="text-xs font-bold opacity-30 mb-0.5">{['일','월','화','수','목','금','토'][selectedDate.getDay()]}요일</span></div>
          {detailData.isUser && <button onClick={(e) => { e.stopPropagation(); onShiftMenu(); }} className="text-[11px] font-black border px-3 py-1.5 rounded-lg opacity-60">근무 변경</button>}
        </div>
        <div style={{ backgroundColor: theme.card }} className="border rounded-2xl p-4 flex justify-between items-center shadow-sm mb-2">
          <div className="flex flex-col items-center">
            <div style={{ backgroundColor: theme.bg }} className="w-16 h-16 rounded-xl flex items-center justify-center border mb-1">
              <span style={{ color: detailData.isRed ? '#EF4444' : theme.text, fontSize: detailData.diaNum?.length > 3 ? '16px' : '28px' }} className="font-black">{detailData.diaNum}</span>
            </div>
            <span className="text-[10px] font-black opacity-30 uppercase">{detailData.label}</span>
          </div>
          <div className="text-right"><div className="text-[10px] font-black opacity-20 mb-0.5 uppercase">출근</div><div className="text-5xl font-black tracking-tighter">{detailData.reportTime || "--:--"}</div></div>
        </div>
        {detailData.content1 && <div className="border rounded-xl p-3 flex items-center gap-3 mb-1.5 bg-white/5"><div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] opacity-40 border shrink-0">전반</div><div className="font-bold text-[15px] leading-snug">{detailData.content1}</div></div>}
        {detailData.content2 && <div className="border rounded-xl p-3 flex items-center gap-3 mb-1.5 bg-white/5"><div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] opacity-40 border shrink-0">후반</div><div className="font-bold text-[15px] leading-snug">{detailData.content2}</div></div>}
        <div className="mt-4 flex flex-col gap-2">
          {memoList.map((m: string, i: number) => (
            <div key={i} className="bg-red-500 rounded-xl relative h-12 flex items-center overflow-hidden">
              <button onClick={(e) => { e.stopPropagation(); onDeleteMemo(i); }} className="absolute right-4"><Trash2 className="w-4 h-4 text-white"/></button>
              <div style={{ backgroundColor: theme.card }} className="absolute inset-0 flex items-center px-4 font-bold text-sm border-l-4 border-l-blue-500">{m}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onMemoInput(); }} className="fixed bottom-8 right-8 w-14 h-14 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-[510]"><FileEdit className="w-6 h-6"/></button>
    </div>
  );
};
