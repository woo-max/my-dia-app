export type ShiftType = 'WORK' | 'OFF' | 'HOLIDAY' | 'STANDBY';

export interface ShiftDay {
  date: Date;
  dia: string;
  type: ShiftType;
  isToday: boolean;
  isInMonth: boolean;
  isLocked: boolean;
  memo: string | null;
  customColor: string | null;
}