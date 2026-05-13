import { differenceInDays, startOfDay } from 'date-fns';

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

/**
 * @param targetDate 계산할 날짜
 * @param refDate 사용자가 설정한 기준 날짜
 * @param refDia 사용자가 설정한 기준 다이아
 */
export const getShiftForDate = (targetDate: Date, refDate: Date, refDia: string) => {
  const startOffset = MASTER_121_DIAS.indexOf(refDia);
  const diff = differenceInDays(startOfDay(targetDate), startOfDay(refDate));
  
  const index = ((startOffset + diff) % 121 + 121) % 121;
  const dia = MASTER_121_DIAS[index];

  let type: 'WORK' | 'OFF' | 'HOLIDAY' | 'STANDBY' = 'WORK';
  
  // 타입 판별 로직 (표시는 원본 그대로 하되, 색상 분류는 유지)
  if (dia === '~') type = 'OFF';
  else if (dia.includes('휴')) type = 'HOLIDAY';
  else if (dia.startsWith('대')) type = 'STANDBY';

  return { dia, type }; // "~"를 "비번"으로 바꾸는 로직 삭제
};