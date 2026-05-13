import { differenceInDays, startOfDay, format } from 'date-fns';

export const MASTER_121_DIAS = [
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

const HOLIDAYS_2026: { [key: string]: string } = {
  '2026-01-01': '신정', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날',
  '2026-03-01': '삼일절', '2026-03-02': '대체공휴일', '2026-05-05': '어린이날', 
  '2026-05-24': '석가탄신일', '2026-05-25': '대체공휴일', '2026-06-06': '현충일',
  '2026-08-15': '광복절', '2026-10-03': '개천절', '2026-10-05': '추석', 
  '2026-10-06': '추석', '2026-10-07': '추석', '2026-10-09': '한글날', '2026-12-25': '성탄절'
};

export const getHolidayName = (date: Date) => HOLIDAYS_2026[format(date, 'yyyy-MM-dd')] || null;

export const getShiftForDate = (targetDate: Date, refDate: Date, refDia: string) => {
  let startOffset = MASTER_121_DIAS.indexOf(refDia);
  if (startOffset === -1) startOffset = 0;
  const diff = differenceInDays(startOfDay(targetDate), startOfDay(refDate));
  const totalLength = MASTER_121_DIAS.length;
  const index = ((startOffset + diff) % totalLength + totalLength) % totalLength;
  const dia = MASTER_121_DIAS[index];
  return { dia, type: dia === '~' ? 'OFF' : dia.includes('휴') ? 'HOLIDAY' : dia.startsWith('대') ? 'STANDBY' : 'WORK' };
};