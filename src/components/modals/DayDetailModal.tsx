import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { X, Edit3, ChevronLeft, GripVertical, Trash2, Plus } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { getShiftMapping, calculateReportTime, getBaseDayType, ALL_DIA_OPTIONS, getHolidayName } from '../../utils/rotation';
import MemoModal from './MemoModal';
import { LiveTrainChip } from '../LiveTrainChip';

const OTHER_LEAVES = ['병가', '공가', '장기재직', '청원휴가', '회행', '육아휴직'];

const MemoItem = ({ memo, onEdit, onDelete, onDragStart, onDragEnd }: any) => { // 👈 프롭스 추가
  const controls = useDragControls();
  return (
    <Reorder.Item 
      value={memo} 
      dragListener={false} 
      dragControls={controls} 
      onDragEnd={onDragEnd} // 👈 드래그가 완전히 끝났을 때 락 해제 보장
      className="relative mb-1.5 touch-none"
    >
      <motion.div 
        drag="x" dragConstraints={{ left: -75, right: 0 }} dragElastic={0.05} dragMomentum={false}
        className="bg-[var(--surface-card)] border border-[var(--border-line)] rounded-xl flex items-center p-2.5 relative z-10 shadow-sm"
      >
        {/* 🚀 센서 부착: 누르면 락 걸기, 떼면 락 풀기 */}
        <div 
          onPointerDown={(e) => {
            if (onDragStart) onDragStart();
            controls.start(e);
          }} 
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          style={{ touchAction: 'none' }}
          className="mr-2.5 p-1 opacity-20 cursor-grab text-[var(--text-main)]"
        >
          <GripVertical size={18} />
        </div>
        <div className="w-[3.5px] self-stretch rounded-full mr-3.5" style={{ backgroundColor: memo.color }} />
        <p className="text-[1rem] font-black leading-tight flex-1 py-0.5 text-[var(--text-main)]" onClick={() => onEdit(memo)}>{memo.text}</p>
      </motion.div>
      <button onClick={() => onDelete(memo.id)} className="absolute inset-y-0 right-0 w-[70px] bg-red-500 text-white rounded-xl flex items-center justify-center"><Trash2 size={18} /></button>
    </Reorder.Item>
  );
};

const DayDetailModal = ({ date, originalDia, overrideType, onClose, customDayTypes, onDayTypeChange, overrides, setOverrides, memos = {}, setMemos, sheetData }: any) => {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState<any>(null);
  const [showDiaPicker, setShowDiaPicker] = useState<any>(null);
  const [showOtherLeavePicker, setShowOtherLeavePicker] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [isSorting, setIsSorting] = useState(false);

  const dateKey = format(date || new Date(), 'yyyy-MM-dd');
  const holidayName = getHolidayName(date || new Date());
  const currentOverride = overrides[dateKey];
  const currentDia = currentOverride ? currentOverride.dia : originalDia;
  const currentOverrideType = currentOverride ? currentOverride.type : overrideType;
  const dayMemos = useMemo(() => memos[dateKey] || [], [memos, dateKey]);

  const mapping = useMemo(() => getShiftMapping(date || new Date(), currentDia, customDayTypes), [date, currentDia, customDayTypes]);

  const realData = useMemo(() => {
    if (!sheetData || currentDia === '~' || (currentOverrideType === 'red' && currentDia !== '~')) return [];
    return (sheetData[mapping.tab] || []).filter((row: any) => String(row.dia).trim() === String(currentDia).trim());
  }, [currentDia, mapping.tab, sheetData, currentOverrideType]);

  // 🚀 [머리말 전용 센서] 실험하신 대로 item.type에서만 열차번호 4자리를 뽑습니다.
  const globalTrainNos = useMemo(() => {
    const allTypeText = realData.map((item: any) => String(item.type || "")).join(" ");
    const matches = allTypeText.match(/\d{4}/g) || [];
    return Array.from(new Set(matches));
  }, [realData]);

  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (showMemoInput) { setShowMemoInput(null); return; }
      if (showDiaPicker) { setShowDiaPicker(null); return; }
      if (showOtherLeavePicker) { setShowOtherLeavePicker(false); return; }
      if (showOverrideMenu) { setShowOverrideMenu(false); return; }
    });
    return () => { backListener.then(h => h.remove()); };
  }, [showMemoInput, showDiaPicker, showOtherLeavePicker, showOverrideMenu]);

  return (
    <motion.div 
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/30" 
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
    >
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ y: "100%" }} animate={{ y: 0 }} 
        exit={{ y: "100%", transition: { duration: 0.12, ease: "easeIn" } }}
        
        // 🚀 2. 모터 전원 제어: isSorting이 켜지면 drag 기능을 끕니다.
        drag={isSorting ? false : "y"} 
        
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.7} dragMomentum={false} 
        onDragEnd={(_, info) => { if (info.offset.y > 70 || info.velocity.y > 300) onClose(); }}
        transition={{ type: "spring", damping: 35, stiffness: 500 }} 
        className="bg-[var(--bg-main)] w-full max-w-[430px] h-[85vh] rounded-t-[32px] flex flex-col overflow-hidden relative shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-[var(--text-main)] opacity-10 rounded-full mx-auto mb-2 mt-4 flex-shrink-0" />
        
        <header className="p-5 border-b border-[var(--border-line)] flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex bg-[var(--memo-bg)] rounded-lg p-0.5 w-fit mb-1">
              {['wd', 'hd'].map(t => (
                <button key={t} onClick={() => onDayTypeChange(date, t)} className={`px-4 py-1 text-[10px] rounded-md font-black ${(customDayTypes[dateKey] || getBaseDayType(date)) === t ? 'bg-[var(--surface-card)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-main)] opacity-30'}`}>{t==='wd'?'평일':'휴일'}</button>
              ))}
            </div>
            <h2 className="text-3xl font-serif font-black italic text-[var(--text-main)]">{format(date || new Date(), 'MM.dd')} <span className="text-sm font-sans opacity-20 ml-1">{format(date || new Date(), 'eee', { locale: ko }).charAt(0)}</span></h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={onClose} className="p-1 text-[var(--text-muted)]"><X size={24}/></button>
            <button onClick={() => setShowOverrideMenu(true)} className="px-3 py-1.5 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full text-[10px] font-black shadow-sm text-[var(--text-main)] active:scale-95 transition-transform">근무변경</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* ✅ 여기서부터 아래 코드를 넣으세요 ✅ */}
<div className="flex flex-col gap-4">
  <div className="flex justify-between items-end gap-2 relative">
    
    {/* 1. 왼쪽: 다이아 번호 + 옆으로 튀어나오는 팝업 묶음 */}
    <div className="flex items-center gap-3">
      
      {/* 🚀 비밀 버튼: 다이아 번호 숫자 (4174 같은 거) */}
      <div 
        onClick={() => setIsLiveMode(!isLiveMode)}
        className="cursor-default active:scale-95 transition-transform"
      >
        <span className={`text-5xl font-black ${
          currentOverrideType === 'red' || realData.some((item: any) => item.content.includes('운휴')) 
            ? 'text-red-500' : 'text-[var(--text-main)]'
        }`}>
          {currentDia}
        </span>
      </div>

      {/* 🚀 이스터에그: 번호 옆에서 오른쪽으로 슥 튀어나오는 미니 관제창 */}
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

    {/* 2. 오른쪽: 출근 시간 (기존 로직 유지) */}
    {/* 2. 오른쪽: 공휴일 이름 + 출근 시간 세로 정렬 */}
    <div className="flex flex-col items-end gap-1">
      {/* 공휴일 이름이 존재할 때만 빨간 글씨로 노출 */}
      {holidayName && (
        <span className="text-[13px] font-black text-red-500 tracking-tight mb-0.5 animate-fade-in">
          {holidayName}
        </span>
      )}
      
      {currentOverrideType !== 'red' && (
        <span className="text-4xl font-black text-[var(--text-main)] tracking-tighter leading-none">
          {calculateReportTime(realData[0]?.content || "")}
        </span>
      )}
    </div>
  </div>
  
  {/* 3. 하단 다이아 라벨 (기존 로직 유지) */}
  <span className="text-[12pt] font-black opacity-60 mt-2 text-[var(--text-main)]">
    {mapping.label} {currentOverride && <span className="opacity-30 text-[10pt] ml-2">(원래 {originalDia})</span>}
  </span>
</div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {realData.map((item: any, i: number) => {
                const rawContent = String(item.content || "");
                return (
                  <div key={i} className="border border-[var(--border-line)] p-5 rounded-2xl bg-[var(--memo-bg)]">
                    {/* 🚀 하드코딩된 text-black을 제거하고 테마 변수를 주입하여 다크모드 자동 대응 */}
                    <span className="text-[14px] font-black text-[var(--text-main)] opacity-50 uppercase mb-2 block">{item.type}</span>
                    <p className={`text-[1.5rem] font-black leading-snug ${rawContent.includes('운휴') ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                      {rawContent}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border-line)] pt-6">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">MEMOS</span>
              <button onClick={() => setShowMemoInput({})} className="p-1.5 bg-[var(--memo-bg)] rounded-full text-[var(--text-muted)]"><Plus size={16}/></button>
            </div>
            <Reorder.Group axis="y" values={dayMemos} onReorder={(o) => setMemos({...memos, [dateKey]: o})} className="flex flex-col">
              {dayMemos.map((m: any) => ( 
                <MemoItem 
                  key={m.id} 
                  memo={m} 
                  onEdit={setShowMemoInput} 
                  onDelete={(id: string) => setMemos({...memos, [dateKey]: dayMemos.filter((x:any)=>x.id!==id)})} 
                  
                  // 🚀 3. 센서 연결: 손잡이를 잡고 놓을 때 팝업창에 신호 전달
                  onDragStart={() => setIsSorting(true)}
                  onDragEnd={() => setIsSorting(false)}
                /> 
              ))}
            </Reorder.Group>
          </div>
        </main>

        {/* 🚀 이 AnimatePresence 블록이 함수 밖으로 나가있어서 에러가 났던 겁니다. 안으로 안전하게 모셨습니다. */}
        <AnimatePresence>
          {showOverrideMenu && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.1 }} className="absolute inset-0 z-[120] bg-[var(--bg-main)] p-6 pt-10 flex flex-col">
              <div className="flex justify-end mb-4"><button onClick={() => setShowOverrideMenu(false)} className="p-2 text-[var(--text-muted)]"><X /></button></div>
              <div className="grid grid-cols-2 grid-rows-6 gap-3 flex-1 pb-6">
                {['연차','촉진연차','대체휴가','만근휴가','개인학습','지정휴무'].map(i => (
                  <button key={i} onClick={() => { setOverrides({...overrides, [dateKey]: { dia: i, type: 'red' }}); setShowOverrideMenu(false); }} className="bg-red-500/10 text-red-500 rounded-2xl font-black text-sm active:scale-95 transition-all">{i}</button>
                ))}
                {['지정근무','대기충당','교번교체'].map(i => (
                  <button key={i} onClick={() => setShowDiaPicker({ label: i, type: 'blue' })} className="bg-blue-500/10 text-blue-500 rounded-2xl font-black text-sm active:scale-95 transition-all">{i}</button>
                ))}
                <button onClick={() => setShowDiaPicker({ label: '휴무충당', type: 'yellow' })} className="bg-amber-500/10 text-amber-500 rounded-2xl font-black text-sm active:scale-95 transition-all">휴무충당</button>
                <button onClick={() => setShowOtherLeavePicker(true)} className="bg-red-500/10 text-red-500 rounded-2xl font-black text-sm active:scale-95 transition-all">기타</button>
                <button onClick={() => { const next = { ...overrides }; delete next[dateKey]; setOverrides(next); setShowOverrideMenu(false); }} className="bg-[var(--surface-card)] border border-[var(--border-line)] text-[var(--text-muted)] rounded-2xl font-black text-sm active:scale-95">원래근무로</button>
              </div>
            </motion.div>
          )}

          {showMemoInput && <MemoModal memo={showMemoInput} onClose={() => setShowMemoInput(null)} onSave={(n: any) => { const updated = showMemoInput.id ? dayMemos.map((m: any) => m.id === showMemoInput.id ? n : m) : [...dayMemos, { ...n, id: Date.now().toString() }]; setMemos({ ...memos, [dateKey]: updated }); setShowMemoInput(null); }} />}

          {/* 📍 150번 줄 근처 showDiaPicker 구역 */}
          {showDiaPicker && (
            <div className="absolute inset-0 z-[130] bg-black/60 flex items-center justify-center p-6">
              <div className="bg-[var(--surface-card)] rounded-[32px] p-6 w-full max-h-[70vh] flex flex-col border border-[var(--border-line)] shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-lg text-[var(--text-main)]">{showDiaPicker.label} - DIA 선택</span>
                  <button onClick={() => setShowDiaPicker(null)} className="text-[var(--text-main)]"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-5 gap-2 overflow-y-auto no-scrollbar">
                  {ALL_DIA_OPTIONS.map(d => (
                    <button 
                      key={d} 
                      onClick={() => { 
                        // 1. 데이터 저장
                        setOverrides({...overrides, [dateKey]: { dia: d, type: showDiaPicker.type }}); 
                        
                        // 🚀 2. 휴무충당이면 팝업 켜기
                        if (showDiaPicker.label === '휴무충당') {
                          setShowCongrats(true);
                        }

                        // 3. 메뉴 닫기
                        setShowDiaPicker(null); 
                        setShowOverrideMenu(false); 
                      }} 
                      className="py-3 bg-[var(--memo-bg)] rounded-xl font-black text-xs text-[var(--text-main)] active:bg-blue-500 active:text-white transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showOtherLeavePicker && (
            <div className="absolute inset-0 z-[140] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowOtherLeavePicker(false)}>
              <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--surface-card)] rounded-[32px] p-6 w-full max-w-sm flex flex-col border border-[var(--border-line)] shadow-2xl">
                <div className="flex justify-between items-center mb-6"><span className="font-black text-lg text-[var(--text-main)] italic">특수휴가</span><button onClick={() => setShowOtherLeavePicker(false)} className="text-[var(--text-main)] opacity-30"><X size={24}/></button></div>
                <div className="grid grid-cols-1 gap-2">
                  {OTHER_LEAVES.map(leave => (
                    <button key={leave} onClick={() => { setOverrides({ ...overrides, [dateKey]: { dia: leave, type: 'red' } }); setShowOtherLeavePicker(false); setShowOverrideMenu(false); }} className="py-4 bg-[var(--memo-bg)] rounded-2xl font-black text-sm text-[var(--text-main)] active:bg-red-500 active:text-white transition-all text-left px-6">{leave}</button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
          {/* 🚀 자본주의의 승리 팝업 시작 */}
          {showCongrats && (
            <div className="absolute inset-0 z-[200] bg-black/60 flex items-center justify-center p-8">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-[var(--surface-card)] rounded-[40px] p-8 w-full max-w-xs flex flex-col items-center border-4 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
              >
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 text-center">
                  축하합니다~~
                </h3>
                
                
                <button 
                  onClick={() => setShowCongrats(false)}
                  className="w-32 py-2 bg-amber-400/50 hover:bg-amber-500 text-black rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
                >
                  🎉🎊
                </button>
              </motion.div>
            </div>
          )}
          {/* 🚀 자본주의의 승리 팝업 끝 */}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DayDetailModal;