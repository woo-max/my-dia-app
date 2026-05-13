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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--surface-card)] w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl border border-[var(--border-line)]">
        <header className="flex justify-between items-start mb-6">
          <div><h3 className="text-xl font-black text-[var(--text-primary)]">{duty.name}</h3><p className="text-[11px] font-black opacity-40 uppercase tracking-widest text-[var(--text-primary)] mt-0.5">{format(duty.date, 'MM.dd eee', { locale: ko })}</p></div>
          <button onClick={onClose} className="p-1 opacity-20 text-[var(--text-primary)]"><X size={20}/></button>
        </header>

        <div className="flex justify-between items-end border-b border-[var(--border-line)] pb-4 mb-4">
          <div className="flex flex-col">
            <span className="text-4xl font-black italic font-serif text-[var(--text-primary)] leading-none">{duty.dia}</span>
            <span className="text-xs font-black text-[var(--text-primary)] opacity-40 mt-2">{duty.tabLabel}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[var(--text-primary)] opacity-40 mb-1">&lt;출근시간&gt;</span>
            <span className="text-2xl font-black text-[var(--text-primary)] leading-none">{calculateCheckIn(duty.rowN.content)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-[var(--memo-bg)] rounded-xl border border-[var(--border-line)]">
            <span className="text-[9px] font-black opacity-30 block mb-1">전반 ({duty.rowN.train})</span>
            <p className="text-[13px] font-black leading-tight text-[var(--text-primary)]">{duty.rowN.content || '-'}</p>
          </div>
          <div className="p-3 bg-[var(--memo-bg)] rounded-xl border border-[var(--border-line)]">
            <span className="text-[9px] font-black opacity-30 block mb-1">후반 ({duty.rowN1.train})</span>
            <p className="text-[13px] font-black leading-tight text-[var(--text-primary)]">{duty.rowN1.content || '-'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeammateDetailModal;