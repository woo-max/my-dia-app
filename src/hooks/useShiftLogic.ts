// src/hooks/useShiftLogic.ts
import { useCallback } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ROTATION_ORDER, RED_ITEMS, getHolidayData } from '../lib/types';

export const useShiftLogic = (allData: any, overrides: any) => {
  
  // [역순 추적] 뒤에서부터 가장 먼저 만나는 역 타겟을 반환
  const getStandbyLoc = useCallback((content1?: string) => {
    if (!content1) return null;
    const targets = ['사', '진', '오', '기', '불', '동'];
    for (let i = content1.length - 1; i >= 0; i--) {
      if (targets.includes(content1[i])) return content1[i];
    }
    return null;
  }, []);

  // [근무 계산] 야간 분기점(ww, wh, hh, hw) 및 주간 평/휴 연산
  const calculateShift = useCallback((date: Date, anchorDStr: string, anchorI: number, isUser: boolean = false) => {
    try {
      const dk = format(date, 'yyyy-MM-dd');
      const diff = differenceInDays(date, parseISO(anchorDStr));
      const idx = (((anchorI + diff) % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length;
      const calcDia = ROTATION_ORDER[idx] || "";
      const targetDia = (isUser && overrides?.[dk]) ? overrides[dk].diaNum : calcDia;
      
      const isRed = targetDia.includes("휴") || RED_ITEMS.includes(targetDia);
      const base = { diaNum: targetDia, label: (isUser && overrides?.[dk]) ? overrides[dk].label : "", isRed, reportTime: "", content1: "", content2: "", isUser };

      // 데이터가 아직 로딩 중이면 기본 다이아 정보만 반환 (Black Screen 방지)
      if (!allData) return base;

      const hInfo = getHolidayData(date);
      const numOnly = parseInt(targetDia.replace(/[^0-9]/g, '') || '0', 10);
      
      let sheet = allData.wd;
      let label = hInfo.name || (hInfo.isH ? "휴일" : "평일");

      // 야간근무 (34~54번) 분기 로직: 오늘과 내일의 공휴일 여부를 체크
      if (numOnly >= 34 && numOnly <= 54) {
        const isTomorrowH = getHolidayData(addDays(date, 1)).isH;
        if (!hInfo.isH && !isTomorrowH) { sheet = allData.ww; label = "평평"; }
        else if (!hInfo.isH && isTomorrowH) { sheet = allData.wh; label = "평휴"; }
        else if (hInfo.isH && isTomorrowH) { sheet = allData.hh; label = "휴휴"; }
        else { sheet = allData.hw; label = "휴평"; }
      } else if (numOnly >= 1 && numOnly <= 33) {
        // 주간근무 (1~33번)
        sheet = (date.getDay() === 0 || hInfo.isH) ? allData.hd : allData.wd;
      }

      const matchNum = targetDia.replace(/[^a-zA-Z0-9가-힣~]/g, "");
      const row = (sheet || []).find((item: any) => item.matchNum === matchNum);
      
      return { ...base, label: base.label || label, ...(row || {}) };
    } catch (e) {
      // 런타임 에러 시 최소한의 데이터로 앱 구동 유지
      return { diaNum: "?", label: "오류", isRed: false, reportTime: "", content1: "", content2: "", isUser };
    }
  }, [allData, overrides]);

  return { calculateShift, getStandbyLoc };
};
