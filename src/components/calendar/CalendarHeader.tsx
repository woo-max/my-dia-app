import React from 'react';
import { format } from 'date-fns';
import { Settings, Target } from 'lucide-react';

interface Props {
  currentDate: Date;
  onGoToday: () => void;
  onOpenSettings: () => void;
}

const CalendarHeader = ({ currentDate, onGoToday, onOpenSettings }: Props) => (
  <header className="p-6 pt-12 flex justify-between items-end bg-[var(--header-bg)]">
    <div>
      <h1 className="text-4xl font-black font-serif tracking-tighter leading-none">
        {format(currentDate, 'MMMM')}
      </h1>
      <p className="text-sm italic opacity-40 font-serif">{format(currentDate, 'yyyy')}</p>
    </div>
    <div className="flex gap-4 items-center">
      <button onClick={onGoToday} className="opacity-30 hover:opacity-100">
        <Target size={22} strokeWidth={2.5} />
      </button>
      <button onClick={onOpenSettings} className="opacity-30 hover:opacity-100">
        <Settings size={22} strokeWidth={2.5} />
      </button>
    </div>
  </header>
);

export default CalendarHeader;