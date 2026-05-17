import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion'; // 🚀 AnimatePresence 추가
import { X } from 'lucide-react';
import { LiveTrainChip } from '../LiveTrainChip'; // 🚀 실시간 위치 칩 컴포넌트 로드

const TeammateDetailModal = ({ duty, onClose }: any) => {
  const [isLiveMode, setIsLiveMode] = useState(false); // 🚀 라이브 모드 온/오프 상태

  const calculateCheckIn = (text: string) => {
    const match = text?.match(/\d{2}:\d{2}/);
    if (!match) return '--:--';
    const [h, m] = match[0].split(':').map(Number);
    const date = new Date();
    date.setHours(h, m - 30);
    return format(date, 'HH:mm');
  };

  // 🚀 전반(rowN)과 후반(rowN1) 머리말에서 4자리 열차번호 추출 로직
  const globalTrainNos = useMemo(() => {
    const type1 = String(duty.rowN?.type || "");
    const type2 = String(duty.rowN1?.type || "");
    const allTypeText = `${type1} ${type2}`;
    const matches = allTypeText.match(/\d{4}/g) || [];
    return Array.from(new Set(matches));
  }, [duty.rowN, duty.rowN1]);

  return (
    /* 🚀 배경 Overlay: 동일하게 0.08초 페이드 아웃 적용 */
    <motion.div 
      className="fixed inset-0 z-[500] flex items-end justify-center p-0 bg-black/30" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
    >
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        /* 🚀 퇴장 로직: 0.12초 만에 즉시 퇴근 */
        exit={{ y: "100%", transition: { duration: 0.12, ease: "easeIn" } }}
        
        transition={{ type: "spring", damping: 32, stiffness: 500 }}
        drag="y" 
        dragConstraints={{ top: 0, bottom: 0 }} 
        dragElastic={0.1}
        onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 500) onClose(); }}
        className="bg-[var(--surface-card)] w-full max-w-[430px] rounded-t-[40px] p-8 pb-12 shadow-2xl border-t border-[var(--border-line)] touch-none"
      >
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
            {/* 🚀 다이아 번호 터치 영역 및 미니 관제창 슬라이딩 배선 */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setIsLiveMode(!isLiveMode)}
                className="cursor-default active:scale-95 transition-transform"
              >
                <span className="text-5xl font-black italic font-serif text-[var(--text-main)] leading-none tracking-tighter">
                  {duty.dia}
                </span>
              </div>

              <AnimatePresence>
                {isLiveMode && globalTrainNos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -15, scale: 0.9 }}
                    className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-2xl backdrop-blur-sm"
                  >
                    {globalTrainNos.map(no => (
                      <LiveTrainChip key={no} trainNo={no} line="4" />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* 🚀 하단 라벨 영역: ~ 이나 휴 근무일 때는 아무것도 표시하지 않고 완전 공백 처리 */}
            <span className="text-[14px] font-black text-[var(--text-main)] mt-3">
              {duty.dia === '~' || duty.dia.includes('휴') ? '' : duty.tabLabel}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black text-[var(--text-muted)] mb-1">&lt;출근시간&gt;</span>
            <span className="text-3xl font-black text-[var(--text-main)] leading-none">{calculateCheckIn(duty.rowN?.content)}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* 전반 구역 (B열: type 사용) */}
          <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-line)]">
            <span className="text-[15px] font-black text-[var(--text-main)] block mb-2 uppercase">
              {duty.rowN?.type || '전반'}
            </span>
            <p className={`text-[15px] font-black leading-snug ${duty.rowN?.content?.includes('운휴') ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
              {duty.rowN?.content || '-'}
            </p>
          </div>

          {/* 후반 구역 (데이터가 있을 때만 렌더링) */}
          {duty.rowN1 && (
            <div className="p-5 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-line)]">
              <span className="text-[15px] font-black text-[var(--text-main)] block mb-2 uppercase">
                {duty.rowN1?.type || '후반'}
              </span>
              <p className={`text-[15px] font-black leading-snug ${duty.rowN1?.content?.includes('운휴') ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                {duty.rowN1?.content || '-'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeammateDetailModal;