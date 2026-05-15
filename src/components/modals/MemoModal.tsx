import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const COLORS = ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF", "#5856D6", "#f86796", "#8E8E93", "#000000", "#f5baba", "#a5e9f5", "#a5e3a2", "#e39df1", "#efd982"];

const MemoModal = ({ memo, onClose, onSave }: any) => {
  const [text, setText] = useState(memo?.text || "");
  const [color, setColor] = useState(memo?.color || COLORS[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/40" onClick={onClose}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-main)] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[var(--border-line)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif font-black italic text-[var(--text-main)]">Memo</h3>
          <button onClick={onClose} className="p-1 opacity-20 text-[var(--text-main)] hover:opacity-100"><X size={20}/></button>
        </div>

        <div className="flex flex-col gap-6">
          <textarea 
            autoFocus value={text} onChange={e => setText(e.target.value)} 
            placeholder="내용을 입력하세요" 
            className="w-full h-32 bg-[var(--memo-bg)] rounded-2xl p-4 font-black text-[1rem] outline-none placeholder:opacity-20 text-[var(--text-main)] mb-1 resize-none" 
          />

          <div className="flex items-center justify-between bg-[var(--memo-bg)] p-4 rounded-2xl relative">
            <span className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-widest leading-none">Color</span>
            <button onClick={() => setIsOpen(!isOpen)} className="w-10 h-10 rounded-full border-4 border-white dark:border-black shadow-md active:scale-90 transition-transform" style={{ backgroundColor: color }} />

            <AnimatePresence>{isOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-16 right-0 bg-[var(--surface-card)] p-4 rounded-[24px] shadow-2xl grid grid-cols-5 gap-4 border border-[var(--border-line)] z-[170] min-w-[240px]"
              >
                {COLORS.map(c => <button key={c} onClick={() => { setColor(c); setIsOpen(false); }} className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95" style={{ backgroundColor: c }}>{color === c && <Check size={14} className="text-white" />}</button>)}
              </motion.div>
            )}</AnimatePresence>
          </div>

          <button disabled={!text.trim()} onClick={() => onSave({ ...memo,text, color })} className="w-full py-4 bg-black text-white dark:bg-white dark:text-black rounded-2xl font-black text-lg active:scale-95 disabled:opacity-20 transition-all shadow-xl">등록</button>
        </div>
      </motion.div>
    </div>
  );
};

export default MemoModal;