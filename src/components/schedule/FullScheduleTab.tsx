import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react'; // 🚀 닫기 버튼(X) 추가
import { format, parse } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion'; // 🚀 애니메이션 부품 장착

const FullScheduleTab = ({ sheetData }: any) => {
  const [activeTab, setActiveTab] = useState('평일주간');
  const [searchQuery, setSearchQuery] = useState('');
  const [isError, setIsError] = useState(false);
  
  // 🚀 행로표 이미지 팝업 상태 제어실
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const tabs = ['평일주간', '휴일주간', '평평', '평휴', '휴휴', '휴평', '교번순서'];
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = touchStartX.current - touchEndX.current;
    const swipeThreshold = 50; 

    const currentIndex = tabs.indexOf(activeTab);

    if (distance > swipeThreshold) {
      const nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      setActiveTab(tabs[nextIndex]);
      setSearchQuery('');
    } else if (distance < -swipeThreshold) {
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      setActiveTab(tabs[prevIndex]);
      setSearchQuery('');
    }
  };

  const rotationData = [
    '대1', '49', '~', '휴1', '16', '34', '~', '휴10', '8', '26', '휴16', '대12', '~', '휴22',
    '3', '33', '42', '~', '휴4', '9', '46', '~', '휴29', '대4', '18', '휴13', '51', '~',
    '휴19', '19', '31', '43', '~', '휴7', '14', '대14', '~', '휴25', '12', '40', '~', '휴28',
    '13', '24', '휴32', '38', '~', '휴17', '1', '29', '54', '~', '휴2', '대2', '44', '~',
    '휴30', '17', '30', '37', '~', '휴11', '대5', '20', '휴23', '대13', '~', '휴5', '15',
    '35', '~', '휴20', '10', '52', '~', '휴14', '21', '27', '휴26', '47', '~', '휴8', '5',
    '28', '53', '~', '휴31', '대3', '39', '~', '휴3', '2', '대11', '~', '휴18', '6', '23',
    '휴12', '41', '~', '휴24', '4', '32', '50', '~', '휴6', '대6', '45', '~', '휴21', '11',
    '22', '휴15', '48', '~', '휴27', '7', '25', '36', '~', '휴9'
  ];

  const isTimeLater = (content: string, targetTimeStr: string) => {
    if (!targetTimeStr.includes(':') || targetTimeStr.length < 4) return false;
    try {
      const targetTime = parse(targetTimeStr, 'HH:mm', new Date());
      const chunks = content.split(/[/|\s]/); 
      return chunks.some(chunk => {
        const timesInChunk = chunk.match(/\d{2}:\d{2}/g);
        if (!timesInChunk) return false;
        const startTimeStr = timesInChunk[0];
        const startTime = parse(startTimeStr, 'HH:mm', new Date());
        return startTime > targetTime;
      });
    } catch { return false; }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    if (val && !activeTab.includes('교번') && !/^\d{2}:\d{2}$/.test(val) && !/^\d+$/.test(val)) {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
    }
  };

  const renderRotationGrid = () => (
    <div className="flex-1 overflow-y-auto touch-auto no-scrollbar bg-[var(--bg-main)]">
      <div className="grid grid-cols-7 gap-px bg-[var(--border-line)] border-b border-[var(--border-line)]">
        {rotationData.map((duty, i) => {
          const isMatch = searchQuery === duty;
          const isHoliday = duty.includes('휴');
          return (
            <div 
              key={i} 
              className={`h-[35px] flex items-center justify-center transition-all ${
                isMatch ? 'bg-[rgba(76,217,100,0.5)]' : 'bg-[var(--surface-card)]'
              }`}
            >
              <span className={`text-[13px] font-black leading-none ${
                isMatch ? 'text-white' : isHoliday ? 'text-red-500' : 'text-[var(--text-main)]'
              }`}>
                {duty}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderScheduleList = () => {
    const rawRows = sheetData?.[activeTab] || [];
    const diaBlocks: any[] = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.dia || /dia|number/i.test(row.dia)) continue;
      const nextRow = rawRows[i + 1];
      let block = { rowN: row, rowN1: { content: "", train: "", image: row.image || null } }; // 🚀 E열 데이터 연동 구조 보존
      if (nextRow && (!nextRow.dia || nextRow.dia.trim() === "" || nextRow.dia === row.dia)) {
        block.rowN1 = nextRow; i++; 
      }
      diaBlocks.push(block);
    }

    return (
      <div className="flex-1 overflow-y-auto touch-auto no-scrollbar bg-[var(--bg-main)]">
        <div className="flex sticky top-0 z-10 bg-[var(--surface-card)] border-b border-[var(--border-line)] text-[10px] font-black text-[var(--text-muted)] uppercase tracking-tighter">
          <div className="w-[38px] shrink-0 h-6 flex items-center justify-center border-r border-[var(--border-line)]">Dia</div>
          <div className="w-[52px] shrink-0 h-6 flex items-center justify-center border-r border-[var(--border-line)]">출근</div>
          <div className="flex-[1.3] h-6 flex items-center justify-center border-r border-[var(--border-line)]">전반사업</div>
          <div className="flex-[0.7] h-6 flex items-center justify-center">후반사업</div>
        </div>

        {diaBlocks.map((block, idx) => {
          const { rowN, rowN1 } = block;
          const searchTime = searchQuery.includes(':') ? searchQuery : null;
          const isRowNMatch = searchTime && isTimeLater(rowN.content, searchTime);
          const isRowN1Match = searchTime && isTimeLater(rowN1.content, searchTime);
          const isDiaMatch = (isRowNMatch || isRowN1Match) || (searchQuery && rowN.dia === searchQuery);
          const isRowNUnHyu = rowN.content.includes('운휴');
          const isRowN1UnHyu = rowN1.content.includes('운휴');

          const calculateCheckIn = (text: string) => {
            const match = text.match(/\d{2}:\d{2}/);
            if (!match) return '--:--';
            const [h, m] = match[0].split(':').map(Number);
            const d = new Date(); d.setHours(h, m - 30);
            return format(d, 'HH:mm');
          };

          return (
            <div key={idx} className="flex border-b border-[var(--border-line)] min-h-0 h-fit">
              {/* 🚀 [비밀 통로 개설] 클릭 시 이미지가 있을 때만 조용히 가동 (active 효과 완전 제거) */}
              <div 
                onClick={() => {
                  if (rowN.image) {
                    setSelectedImage(rowN.image);
                  }
                }}
                className={`w-[38px] shrink-0 flex items-center justify-center border-r border-[var(--border-line)] text-[12px] font-black py-[1.7px] cursor-default select-none ${
                  isDiaMatch ? 'bg-[rgba(255,159,10,0.3)] text-[var(--text-main)]' : 'bg-[var(--surface-card)] text-[var(--text-main)]'
                }`}
              >
                {rowN.dia}
              </div>
              <div className="w-[52px] shrink-0 flex items-center justify-center border-r border-[var(--border-line)] font-black text-[11px] text-[var(--text-muted)] bg-[var(--bg-main)] py-[1.7px]">{calculateCheckIn(rowN.content)}</div>
              <div className={`flex-[1.3] flex items-center justify-center text-center text-[11.5px] font-black border-r border-[var(--border-line)] leading-none tracking-tighter py-[1.7px] px-0.5 ${isRowNMatch ? 'bg-[rgba(255,159,10,0.2)]' : 'bg-[var(--surface-card)]'} ${isRowNUnHyu ? 'text-red-500' : 'text-[var(--text-main)]'}`}>{rowN.content}</div>
              <div className={`flex-[0.7] flex items-center justify-center text-center text-[11.5px] font-black leading-none tracking-tighter py-[1.7px] px-0.5 ${isRowN1Match ? 'bg-[rgba(255,159,10,0.2)]' : 'bg-[var(--surface-card)]'} ${isRowN1UnHyu ? 'text-red-500' : 'text-[var(--text-main)]'}`}>{rowN1.content}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-main)] overflow-hidden">
      <nav className="flex bg-[var(--surface-card)] shrink-0 h-10">
        {tabs.map((tab, i) => (
          <button 
            key={tab} 
            onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
            className={`flex-1 flex items-center justify-center text-[11px] font-serif italic font-black transition-all ${
              i !== tabs.length - 1 ? 'border-r border-[var(--border-line)]' : ''
            } ${
              activeTab === tab ? 'bg-[var(--text-main)] text-[var(--surface-card)]' : 'text-[var(--text-main)] opacity-40'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="p-2 shrink-0 bg-[var(--bg-main)]">
        <div className={`relative flex items-center border-2 rounded-lg px-2 bg-[var(--surface-card)] ${isError ? 'border-red-500 animate-pulse' : 'border-[var(--border-line)]'}`}>
          <Search size={14} className="text-[var(--text-muted)]" />
          <input 
            value={searchQuery} 
            onChange={(e) => handleSearch(e.target.value)} 
            placeholder="" 
            className="flex-1 p-1.5 bg-transparent outline-none font-black text-[13px] text-[var(--text-main)]" 
          />
        </div>
      </div>

      <div 
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === '교번순서' ? renderRotationGrid() : renderScheduleList()}
      </div>

      {/* 🚀 [행로표 전용 이미지 뷰어 모달 부품] */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4"
          >
            {/* 행로표 이미지 출력부 (클릭 시 창 닫힘 전파 방지) */}
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedImage} 
              alt="행로표 상세" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            {/* 상단 닫기 우회 버튼 */}
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-12 right-6 p-2 text-white/60 active:text-white transition-colors"
            >
              <X size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FullScheduleTab;