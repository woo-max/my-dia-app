import { differenceInDays, startOfDay, format, isSunday, isSaturday, addDays, subMinutes, parse } from 'date-fns';

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
export const getBaseDayType = (date: Date) => (isSunday(date) || isSaturday(date) || !!getHolidayName(date)) ? 'hd' : 'wd';

const DAY_DIAS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','대1','대2','대3','대4','대5','대6'];

export const getShiftMapping = (date: Date, dia: string, customDayTypes: any) => {
  const getFinalType = (d: Date) => customDayTypes[format(d, 'yyyy-MM-dd')] || getBaseDayType(d);
  const isDaytime = DAY_DIAS.includes(dia);
  const today = getFinalType(date);

  if (isDaytime) return { label: today === 'wd' ? '평일' : '휴일', tab: today === 'wd' ? '평일주간' : '휴일주간' };

  const tomorrow = getFinalType(addDays(date, 1));
  const mapping: { [key: string]: string } = { 'wdwd': '평평', 'wdhd': '평휴', 'hdhd': '휴휴', 'hdwd': '휴평' };
  const label = mapping[today + tomorrow] || '평일';
  return { label, tab: label };
};

// [로직] HH:mm 인식 후 30분 차감
export const calculateReportTime = (content: string) => {
  if (!content || typeof content !== 'string') return '';

  try {
    // 1. 문자열 내의 모든 시간 형태(HH:mm)를 순서대로 찾습니다.
    const allTimes = content.match(/(\d{1,2}):(\d{2})/g);
    if (!allTimes || allTimes.length === 0) return '';

    // 2. [진짜 핵심] 무조건 '첫 번째'로 등장하는 시간을 선택 (야간 근무 대응)
    let startTime = allTimes[0]; 

    // 3. 시간 포맷 보정 (7:30 -> 07:30)
    if (startTime.length === 4) startTime = '0' + startTime;

    const [hours, minutes] = startTime.split(':').map(Number);
    
    // 4. 30분 차감 계산
    let totalMinutes = hours * 60 + minutes - 30;
    if (totalMinutes < 0) totalMinutes += 1440; // 00:00 이전 보정

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
};

export const getShiftForDate = (targetDate: Date, refDate: Date, refDia: string) => {
  let startOffset = MASTER_121_DIAS.indexOf(refDia);
  if (startOffset === -1) startOffset = 0;
  const diff = differenceInDays(startOfDay(targetDate), startOfDay(refDate));
  const totalLength = MASTER_121_DIAS.length;
  const index = ((startOffset + diff) % totalLength + totalLength) % totalLength;
  return { dia: MASTER_121_DIAS[index] };
};

// 🚀 여기서부터 새로 추가되는 마스터 명단입니다!
export const ALL_DIA_OPTIONS = [
  // 1번부터 54번까지 자동으로 숫자를 만들어요
  ...Array.from({ length: 54 }, (_, i) => String(i + 1)), 
  
  '~', // 비번
  
  // 실제로 사용하는 대기 다이아만 딱 골랐어요 (7, 8, 9, 10은 뺐어요!)
  '대1', '대2', '대3', '대4', '대5', '대6', 
  '대11', '대12', '대13', '대14',

  ...Array.from({ length: 32 }, (_, i) => `휴${i + 1}`)   // 휴1~휴32 
];