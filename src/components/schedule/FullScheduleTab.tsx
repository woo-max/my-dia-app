import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { format, parse } from 'date-fns';

const FullScheduleTab = ({ sheetData }: any) => {
  const [activeTab, setActiveTab] = useState('평일주간');
  const [searchQuery, setSearchQuery] = useState('');
  const [isError, setIsError] = useState(false);

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
    const swipeThreshold = 50; // 이 픽셀 이상 움직여야 탭이 넘어감

    const currentIndex = tabs.indexOf(activeTab);

    if (distance > swipeThreshold) {
      // 🚀 왼쪽으로 스와이프 (다음 탭으로)
      // 마지막 탭이면 0번(처음)으로 돌아가고, 아니면 +1
      const nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      setActiveTab(tabs[nextIndex]);
      setSearchQuery('');
    } else if (distance < -swipeThreshold) {
      // 🚀 오른쪽으로 스와이프 (이전 탭으로)
      // 0번(처음) 탭이면 마지막으로 돌아가고, 아니면 -1
      const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      setActiveTab(tabs[prevIndex]);
      setSearchQuery('');
    }
  };

  // 동준 님이 지정한 121개 순환근무 고정 데이터
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

  // [교번순서] 121개 그리드 (번호 지우고 글자에 맞춰 박스 축소)
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
      let block = { rowN: row, rowN1: { content: "", train: "" } };
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
              <div className={`w-[38px] shrink-0 flex items-center justify-center border-r border-[var(--border-line)] text-[12px] font-black py-[1.7px] ${isDiaMatch ? 'bg-[rgba(255,159,10,0.3)] text-[var(--text-main)]' : 'bg-[var(--surface-card)] text-[var(--text-main)]'}`}>{rowN.dia}</div>
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
      {/* 상단 탭: 가로선 제거, 흑백 대비 강화, 세로 구분선 */}
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
    </div>
  );
};

export default FullScheduleTab;