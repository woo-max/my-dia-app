import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, endOfMonth, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings2, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import TeammateCell from './TeammateCell';
import TeammateDetailModal from '../modals/TeammateDetailModal';
import TeammateAddModal from '../modals/TeammateAddModal';
import GroupEditModal from '../modals/GroupEditModal';

const TeammateDashboard = ({ 
  teammates, setTeammates, groupNames, setGroupNames, sheetData, myConfig, isDarkMode, toggleDarkMode,
  setSelectedDuty, selectedDuty, showAddModal, setShowAddModal, showGroupModal, setShowGroupModal
}: any) => {
  if (!sheetData || !myConfig) {
    return <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">데이터 로딩 중...</div>;
  }
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [editingGroup, setEditingGroup] = useState<{index: number, name: string} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  useEffect(() => {
    if (!scrollRef.current || days.length === 0) return;
    const todayIdx = days.findIndex(d => isToday(d));
    if (todayIdx !== -1) scrollRef.current.scrollLeft = (todayIdx * 40) ;
  }, [days]);

  const filteredTeammates = useMemo(() => {
    const myData = { id: 'me', name: '나', group: selectedGroup, refDate: myConfig.date, refDia: myConfig.dia };
    const others = teammates.filter((t: any) => Number(t.group) === Number(selectedGroup));
    return [myData, ...others];
  }, [teammates, selectedGroup, myConfig]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-main)] overflow-hidden relative">
      <header className="px-4 pt-4 pb-2 flex justify-between items-end border-b border-[var(--border-line)] bg-[var(--surface-card)] shrink-0">
        <div className="flex items-end gap-2 text-[var(--text-main)]">
          <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="p-1 text-[var(--text-muted)]"><ChevronLeft size={18}/></button>
          <h1 className="text-2xl font-black font-serif italic tracking-tighter leading-none">{format(currentDate, 'M월')}</h1>
          <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="p-1 text-[var(--text-muted)]"><ChevronRight size={18}/></button>
        </div>
        <button onClick={toggleDarkMode} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </header>

      <div className="flex-1 overflow-auto no-scrollbar relative bg-[var(--bg-main)]" ref={scrollRef}>
        <div className="flex w-max sticky top-0 z-20 bg-[var(--surface-card)] border-b border-[var(--border-line)]">
          <div className="tm-name-width shrink-0 h-[30px] sticky left-0 z-30 bg-[var(--surface-card)] border-r border-[var(--border-line)] flex items-center justify-center">
            <span className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase">Name</span>
          </div>
          {days.map(d => (
            <div key={format(d, 'yyyy-MM-dd')} className={`tm-cell-width shrink-0 h-[30px] flex flex-col items-center justify-center border-r border-[var(--border-line)] bg-[var(--surface-card)] ${isToday(d) ? 'bg-[var(--today-highlight)]' : ''}`}>
              <span className={`text-[10px] font-black ${format(d, 'i')==='7'?'text-red-500':format(d, 'i')==='6'?'text-blue-500':'text-[var(--text-main)]'}`}>{format(d, 'd')}</span>
            </div>
          ))}
        </div>

        {/* 행 높이 축소: 42px -> 36px */}
        {filteredTeammates.map(tm => (
          <div key={tm.id} className="flex w-max border-b border-[var(--border-line)]">
            <div className="tm-name-width shrink-0 h-[36px] sticky left-0 z-10 bg-[var(--surface-card)] border-r border-[var(--border-line)] flex items-center justify-center">
              <span className="text-[13px] font-black text-[var(--text-main)]">{tm.name}</span>
            </div>
            {days.map(d => (
              <TeammateCell key={format(d, 'yyyy-MM-dd')} date={d} teammate={tm} sheetData={sheetData} onClick={setSelectedDuty} />
            ))}
          </div>
        ))}
        <div className="h-24 w-full" />
      </div>

      <div className="relative h-[60px] bg-[var(--surface-card)] border-t border-[var(--border-line)] flex px-4 shrink-0 pb-4">
        <div className="absolute -top-14 right-4 flex gap-2 pointer-events-none z-40">
          <button onClick={() => setShowGroupModal({ type: 'edit' })} className="pointer-events-auto w-11 h-11 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all"><Settings2 size={18} className="text-[var(--text-muted)]" /></button>
          <button onClick={() => setShowAddModal(true)} className="pointer-events-auto w-11 h-11 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all"><Plus size={22} className="text-[var(--text-main)] opacity-60" /></button>
        </div>
        {groupNames.map((name: string, i: number) => (
  <button 
    key={i} 
    onClick={() => setSelectedGroup(i)}
    // 🚀 꾹 눌렀을 때 커스텀 모달을 띄우는 회로입니다.
    onContextMenu={(e) => {
      e.preventDefault();
      setEditingGroup({ index: i, name: name });
    }}
    className={`flex-1 flex flex-col items-center justify-center transition-all ${selectedGroup === i ? 'opacity-100' : 'text-[var(--text-muted)]'}`}
  >
    <span className="text-[10px] font-black truncate w-full text-center">{name}</span>
    {selectedGroup === i && <motion.div layoutId="tab-underline" className="w-4 h-0.5 bg-blue-500 mt-1 rounded-full" />}
  </button>
))}
      </div>

      <AnimatePresence>
        {selectedDuty && <TeammateDetailModal duty={selectedDuty} onClose={() => setSelectedDuty(null)} />}
        {showAddModal && (
          <TeammateAddModal 
            onClose={() => setShowAddModal(false)} 
            onAdd={(t: any) => setTeammates([...teammates, t])} 
            groupNames={groupNames} 
            currentGroup={selectedGroup} 
          />
        )}
        {showGroupModal && (
          <GroupEditModal 
            mode={showGroupModal} 
            onClose={() => setShowGroupModal(null)} 
            onSave={setGroupNames} 
            onUpdateTeammates={setTeammates} 
            teammates={teammates} 
            groupNames={groupNames} 
          />
        )}
          {/* 🚀 여기서부터 그룹 이름 변경 커스텀 모달 시작 */}
        {editingGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingGroup(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--surface-card)] rounded-[32px] p-8 shadow-2xl border border-[var(--border-line)]"
            >
              <h3 className="text-xl font-black text-[var(--text-main)] mb-6 italic">이름 변경</h3>
              <input 
                autoFocus
                className="w-full bg-[var(--bg-main)] border border-[var(--border-line)] rounded-2xl px-5 py-4 text-[var(--text-main)] font-bold text-lg focus:outline-none focus:border-blue-500 mb-6"
                defaultValue={editingGroup.name}
                id="group-name-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (val) {
                      const next = [...groupNames];
                      next[editingGroup.index] = val;
                      setGroupNames(next);
                      setEditingGroup(null);
                    }
                  }
                }}
              />
              <div className="flex gap-3">
                <button onClick={() => setEditingGroup(null)} className="flex-1 py-4 bg-[var(--bg-main)] text-[var(--text-muted)] rounded-2xl font-black text-sm active:scale-95">취소</button>
                <button 
                  onClick={() => {
                    const input = document.getElementById('group-name-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      const next = [...groupNames];
                      next[editingGroup.index] = val;
                      setGroupNames(next);
                      setEditingGroup(null);
                    }
                  }}
                  className="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black text-sm shadow-lg active:scale-95"
                >
                  변경하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeammateDashboard;