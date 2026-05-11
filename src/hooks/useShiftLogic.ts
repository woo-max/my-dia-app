// src/hooks/useShiftLogic.ts
import { useCallback } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ROTATION_ORDER, RED_ITEMS, getHolidayData } from '../lib/types';

export const useShiftLogic = (allData: any, overrides: any) => {
  const getStandbyLoc = useCallback((content1?: string) => {
    if (!content1) return null;
    const targets = ['사', '진', '오', '기', '불', '동'];
    for (let i = content1.length - 1; i >= 0; i--) {
      if (targets.includes(content1[i])) return content1[i];
    }
    return null;
  }, []);

  const calculateShift = useCallback((date: Date, anchorDStr: string, anchorI: number, isUser: boolean = false) => {
    try {
      const dk = format(date, 'yyyy-MM-dd');
      const diff = differenceInDays(date, parseISO(anchorDStr));
      const idx = (((anchorI + diff) % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length;
      const targetDia = (isUser && overrides?.[dk]) ? overrides[dk].diaNum : ROTATION_ORDER[idx];
      
      const base = { diaNum: targetDia, label: (isUser && overrides?.[dk]) ? overrides[dk].label : "", isRed: targetDia.includes("휴") || RED_ITEMS.includes(targetDia), reportTime: "", content1: "", content2: "", isUser };
      if (!allData) return base;

      const hToday = getHolidayData(date);
      const num = parseInt(targetDia.replace(/[^0-9]/g, '') || '0', 10);
      
      let sheet = allData.wd; let cat = hToday.isH ? "휴일" : "평일";

      if (num >= 34 && num <= 54) {
        const hTomorrow = getHolidayData(addDays(date, 1));
        if (!hToday.isH && !hTomorrow.isH) { sheet = allData.ww; cat = "평평"; }
        else if (!hToday.isH && hTomorrow.isH) { sheet = allData.wh; cat = "평휴"; }
        else if (hToday.isH && hTomorrow.isH) { sheet = allData.hh; cat = "휴휴"; }
        else { sheet = allData.hw; cat = "휴평"; }
      } else if (num >= 1 && num <= 33) {
        sheet = hToday.isH ? allData.hd : allData.wd;
      }

      const row = (sheet || []).find((r: any) => r.matchNum === targetDia.replace(/[^a-zA-Z0-9가-힣~]/g, ""));
      return { ...base, label: base.label || cat, ...(row || {}) };
    } catch { return { diaNum: "?", label: "에러", isRed: false, isUser }; }
  }, [allData, overrides]);

  return { calculateShift, getStandbyLoc };
};
