import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const TeammateDetailModal = ({ duty, onClose }: any) => {
  const calculateCheckIn = (text: string) => {
    const match = text.match(/\d{2}:\d{2}/);
    if (!match) return '--:--';
    const [h, m] = match[0].split(':').map(Number);
    const date = new Date();
    date.setHours(h, m - 30);
    return format(date, 'HH:mm');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        className="bg-[var(--surface-card)] w-full max-w-[430px] rounded-t-[40px] p-8 pb-12 shadow-2xl border-t border-[var(--border-line)]"
      >
        {/* 드래그 핸들 바: 다크모드에서 너무 흐리지 않게 조정 */}
        <div className="w-12 h-1.5 bg-[var(--text-main)] opacity-20 rounded-full mx-auto mb-6" />

        <header className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-[var(--text-main)]">{duty.name}</h3>
            <p className="text-[12px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
              {format(duty.date, 'MM.dd eee', { locale: ko })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><X size={24}/></button>
        </header>

        <div className="flex justify-between items-end border-b border-[var(--border-line)] pb-6 mb-6">
          <div className="flex flex-col">
            <span className="text-5xl font-black italic font-serif text-[var(--text-main)] leading-none tracking-tighter">
              {duty.dia}
            </span>
            <span className="text-xs font-black text-[var(--text-muted)] mt-3">{duty.tabLabel}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black text-[var(--text-muted)] mb-1">&lt;출근시간&gt;</span>
            <span className="text-3xl font-black text-[var(--text-main)] leading-none">{calculateCheckIn(duty.rowN?.content || "")}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-[var(--memo-bg)] rounded-[24px] border border-[var(--border-line)]">
            <span className="text-[10px] font-black text-[var(--text-muted)] block mb-2 uppercase">전반 {duty.rowN?.train && `(${duty.rowN.train})`}</span>
            <p className="text-[15px] font-black leading-snug text-[var(--text-main)]">{duty.rowN?.content || '-'}</p>
          </div>
          <div className="p-5 bg-[var(--memo-bg)] rounded-[24px] border border-[var(--border-line)]">
            <span className="text-[10px] font-black text-[var(--text-muted)] block mb-2 uppercase">후반 {duty.rowN1?.train && `(${duty.rowN1.train})`}</span>
            <p className="text-[15px] font-black leading-snug text-[var(--text-main)]">{duty.rowN1?.content || '-'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeammateDetailModal;