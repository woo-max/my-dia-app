// src/lib/types.ts

// 1. 교번 순서 마스터 데이터 (수정 금지)
export const ROTATION_ORDER = ["대1","49","~","휴1","16","34","~","휴10","8","26","휴16","대12","~","휴22","3","33","42","~","휴4","9","46","~","휴29","대4","18","휴13","51","~","휴19","19","31","43","~","휴7","14","대14","~","휴25","12","40","~","휴28","13","24","휴32","38","~","휴17","1","29","54","~","휴2","대2","44","~","휴30","17","30","37","~","휴11","대5","20","휴23","대13","~","휴5","15","35","~","휴20","10","52","~","휴14","21","27","휴26","47","~","휴8","5","28","53","~","휴31","대3","39","~","휴3","2","대11","~","휴18","6","23","휴12","41","~","휴24","4","32","50","~","휴6","대6","45","~","휴21","11","22","휴15","48","~","휴27","7","25","36","~","휴9"];

// 2. 다이아 번호 리스트
export const DIA_NUMBERS = [ ...Array.from({ length: 54 }, (_, i) => (i + 1).toString()), "~", "대1", "대2", "대3", "대4", "대5", "대6", "대11", "대12", "대13", "대14" ];

// 3. 휴가 및 붉은색 표시 항목
export const RED_ITEMS = ['연차', '촉진연차', '대체휴가', '만근휴가', '개인학습', '지정휴무', '휴'];

// 4. 근무 성격별 색상 로직 (중앙 관리)
export const getDutyColor = (label: string, defaultColor: string) => {
  if (!label) return defaultColor;
  if (label.includes('지정근무') || label.includes('대기충당') || label.includes('교번교체')) return '#2563EB'; // 블루
  if (label.includes('휴무충당')) return '#D97706'; // 오렌지
  return defaultColor;
};

// 5. 2026년 공휴일 및 대체공휴일 (동준 님 요청: 명칭 누락 방지)
export const getHolidayData = (date: Date) => {
  const mmdd = `${date.getMonth() + 1}-${date.getDate()}`;
  const hList: { [key: string]: string } = {
    '1-1': '신정', '3-1': '삼일절', '5-1': '노동절', '5-5': '어린이날',
    '6-6': '현충일', '8-15': '광복절', '10-3': '개천절', '10-9': '한글날', '12-25': '성탄절'
  };
  
  if (date.getFullYear() === 2026) {
    if (['2-16', '2-17', '2-18'].includes(mmdd)) return { isH: true, name: '설날' };
    if (mmdd === '2-19') return { isH: true, name: '대체' };
    if (mmdd === '5-24') return { isH: true, name: '석탄' };
    if (mmdd === '5-25') return { isH: true, name: '대체' };
    if (['9-24', '9-25', '9-26'].includes(mmdd)) return { isH: true, name: '추석' };
    if (mmdd === '9-28') return { isH: true, name: '대체' };
  }
  
  return {
    isH: !!hList[mmdd] || date.getDay() === 0,
    isSat: date.getDay() === 6,
    name: hList[mmdd] || ''
  };
};
