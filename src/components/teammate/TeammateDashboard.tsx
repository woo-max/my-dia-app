import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, eachDayOfInterval, endOfMonth, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings2, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import TeammateCell from './TeammateCell';
import TeammateDetailModal from '../modals/TeammateDetailModal';
import TeammateAddModal from '../modals/TeammateAddModal';
import GroupEditModal from '../modals/GroupEditModal';

const TeammateDashboard = ({ teammates, setTeammates, groupNames, setGroupNames, sheetData, myConfig, isDarkMode, toggleDarkMode }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [selectedDuty, setSelectedDuty] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  useEffect(() => {
    if (!scrollRef.current || days.length === 0) return;
    const todayIdx = days.findIndex(d => isToday(d));
    if (todayIdx !== -1) scrollRef.current.scrollLeft = (todayIdx * 50) - 10;
  }, [days]);

  const filteredTeammates = useMemo(() => {
    const myData = { id: 'me', name: '나', group: selectedGroup, refDate: myConfig.date, refDia: myConfig.dia };
    const others = teammates.filter((t: any) => Number(t.group) === Number(selectedGroup));
    return [myData, ...others];
  }, [teammates, selectedGroup, myConfig]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden relative">
      <header className="p-6 pt-12 flex justify-between items-end border-b border-[var(--border-line)] bg-[var(--surface-card)] shrink-0">
        <div className="flex items-end gap-3 text-[var(--text-primary)]">
          <button onClick={() => setCurrentDate(prev => subMonths(prev, 1))} className="p-1 opacity-20"><ChevronLeft size={20}/></button>
          <h1 className="text-4xl font-black font-serif italic tracking-tighter leading-none">{format(currentDate, 'M월')}</h1>
          <button onClick={() => setCurrentDate(prev => addMonths(prev, 1))} className="p-1 opacity-20"><ChevronRight size={20}/></button>
        </div>
        <button onClick={toggleDarkMode} className="p-2 opacity-30 text-[var(--text-primary)]">{isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}</button>
      </header>

      <div className="flex-1 overflow-auto no-scrollbar relative bg-[var(--bg-main)]" ref={scrollRef}>
        <div className="flex w-max sticky top-0 z-20 bg-[var(--surface-card)] border-b border-[var(--border-line)]">
          <div className="tm-name-width shrink-0 h-[45px] sticky left-0 z-30 bg-[var(--surface-card)] border-r border-[var(--border-line)] flex items-center justify-center">
            <span className="text-[10px] font-black opacity-20 tracking-widest uppercase text-[var(--text-primary)]">Name</span>
          </div>
          {days.map(d => (
            <div key={format(d, 'yyyy-MM-dd')} className={`tm-cell-width shrink-0 h-[45px] py-2 flex flex-col items-center border-r border-[var(--border-line)] bg-[var(--surface-card)] ${isToday(d) ? 'bg-[var(--today-highlight)]' : ''}`}>
              <span className={`text-[8px] font-black opacity-30 ${format(d, 'i')==='7'?'text-red-500':format(d, 'i')==='6'?'text-blue-500':'text-[var(--text-primary)]'}`}>{format(d, 'eee').toUpperCase()}</span>
              <span className={`text-[12px] font-black ${format(d, 'i')==='7'?'text-red-500':format(d, 'i')==='6'?'text-blue-500':'text-[var(--text-primary)]'}`}>{format(d, 'd')}</span>
            </div>
          ))}
        </div>

        {filteredTeammates.map(tm => (
          <div key={tm.id} className="flex w-max border-b border-[var(--border-line)]">
            <div className="tm-name-width shrink-0 h-[60px] sticky left-0 z-10 bg-[var(--surface-card)] border-r border-[var(--border-line)] flex items-center justify-center">
              <span className="text-sm font-black text-[var(--text-primary)]">{tm.name}</span>
            </div>
            {days.map(d => (
              <TeammateCell key={format(d, 'yyyy-MM-dd')} date={d} teammate={tm} sheetData={sheetData} onClick={setSelectedDuty} />
            ))}
          </div>
        ))}
      </div>

      <div className="relative h-[60px] bg-[var(--surface-card)] border-t border-[var(--border-line)] flex px-4 shrink-0">
        <div className="absolute -top-14 right-4 flex gap-2 pointer-events-none z-40">
          <button onClick={() => setShowGroupModal({ type: 'edit' })} className="pointer-events-auto w-11 h-11 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full flex items-center justify-center shadow-md text-[var(--text-primary)] active:scale-90 transition-all">
            <Settings2 size={18} className="opacity-40" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="pointer-events-auto w-11 h-11 bg-[var(--surface-card)] border border-[var(--border-line)] rounded-full flex items-center justify-center shadow-md text-[var(--text-primary)] active:scale-95 transition-all">
            <Plus size={22} className="opacity-60" />
          </button>
        </div>

        {groupNames.map((name: string, i: number) => (
          <button key={i} onClick={() => setSelectedGroup(i)} onContextMenu={(e) => { e.preventDefault(); setShowGroupModal({ index: i, name, type: 'name' }); }} className={`flex-1 flex flex-col items-center justify-center transition-all ${selectedGroup === i ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-[10px] font-black truncate w-full text-center text-[var(--text-primary)]">{name}</span>
            {selectedGroup === i && <motion.div layoutId="tab-underline" className="w-4 h-0.5 bg-blue-500 mt-1 rounded-full" />}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedDuty && <TeammateDetailModal duty={selectedDuty} onClose={() => setSelectedDuty(null)} />}
        {showAddModal && <TeammateAddModal onClose={() => setShowAddModal(false)} onAdd={(t: any) => setTeammates([...teammates, t])} groupNames={groupNames} currentGroup={selectedGroup} />}
        {showGroupModal && <GroupEditModal mode={showGroupModal} onClose={() => setShowGroupModal(null)} onSave={setGroupNames} onUpdateTeammates={setTeammates} teammates={teammates} groupNames={groupNames} />}
      </AnimatePresence>
    </div>
  );
};

export default TeammateDashboard;