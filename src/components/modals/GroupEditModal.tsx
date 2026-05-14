import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { X, Trash2, GripVertical } from 'lucide-react';

const GroupEditModal = ({ mode, onClose, onSave, onUpdateTeammates, teammates, groupNames }: any) => {
  const [editingName, setEditingName] = useState(mode.name || "");
  const [selectedGroup, setSelectedGroup] = useState(mode.index || 0);
  const groupTeammates = teammates.filter((t: any) => Number(t.group) === Number(selectedGroup));

  const handleReorder = (newOrder: any[]) => {
    const others = teammates.filter((t: any) => Number(t.group) !== Number(selectedGroup));
    onUpdateTeammates([...others, ...newOrder]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        onClick={e => e.stopPropagation()} 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[var(--surface-card)] w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-[var(--border-line)]"
      >
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-[var(--text-main)]">
            {mode.type === 'edit' ? '그룹 관리' : '이름 변경'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <X size={24}/>
          </button>
        </header>
        
        {mode.type === 'edit' ? (
          <div className="space-y-4">
            {/* 상단 그룹 선택 탭 */}
            <div className="flex gap-1 bg-[var(--memo-bg)] p-1 rounded-xl border border-[var(--border-line)]">
              {groupNames.map((name: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedGroup(i)} 
                  className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                    selectedGroup === i 
                      ? 'bg-[var(--surface-card)] text-[var(--text-main)] shadow-sm' 
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* 동료 목록 리오더링 */}
            <Reorder.Group 
              axis="y" 
              values={groupTeammates} 
              onReorder={handleReorder} 
              className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar"
            >
              {groupTeammates.map((t: any) => (
                <Reorder.Item 
                  key={t.id} 
                  value={t} 
                  className="flex items-center gap-3 p-4 bg-[var(--memo-bg)] rounded-2xl border border-[var(--border-line)] active:scale-95 transition-all"
                >
                  {/* 드래그 핸들: opacity 제거 및 muted 컬러 적용 */}
                  <GripVertical size={18} className="text-[var(--text-muted)] shrink-0"/>
                  <span className="flex-1 font-black text-[var(--text-main)] text-sm truncate">
                    {t.name}
                  </span>
                  <button 
                    onClick={() => onUpdateTeammates(teammates.filter((x:any)=>x.id!==t.id))} 
                    className="text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18}/>
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 이름 변경 인풋 */}
            <input 
              autoFocus
              value={editingName} 
              onChange={e => setEditingName(e.target.value)} 
              className="w-full bg-[var(--memo-bg)] text-[var(--text-main)] rounded-2xl p-4 font-black border border-[var(--border-line)] outline-none placeholder:text-[var(--text-muted)]" 
            />
            <button 
              onClick={() => {
                onSave((p: any) => {
                  const n = [...p]; 
                  n[mode.index] = editingName; 
                  return n;
                }); 
                onClose();
              }} 
              className="w-full py-4 bg-[var(--text-main)] text-[var(--surface-card)] rounded-2xl font-black shadow-xl active:scale-95 transition-all"
            >
              SAVE NAME
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GroupEditModal;