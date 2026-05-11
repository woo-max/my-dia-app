// src/hooks/useShiftLogic.ts
import { useCallback } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ROTATION_ORDER, RED_ITEMS, getHolidayData } from '../lib/types';

export const useShiftLogic = (allData: any, overrides: any) => {
  const calculateShift = useCallback((date: Date, anchorDStr: string, anchorI: number, isUser: boolean = false) => {
    try {
      const dk = format(date, 'yyyy-MM-dd');
      const diff = differenceInDays(date, parseISO(anchorDStr));
      const idx = (((anchorI + diff) % ROTATION_ORDER.length) + ROTATION_ORDER.length) % ROTATION_ORDER.length;
      const calcDia = ROTATION_ORDER[idx] || "";
      const targetDia = (isUser && overrides?.[dk]) ? overrides[dk].diaNum : calcDia;
      
      const isRed = targetDia.includes("휴") || RED_ITEMS.includes(targetDia);
      const base = { diaNum: targetDia, label: (isUser && overrides?.[dk]) ? overrides[dk].label : "", isRed, reportTime: "", content1: "", content2: "", isUser };

      if (!allData) return base;

      const hInfo = getHolidayData(date);
      const numOnly = parseInt(targetDia.replace(/[^0-9]/g, '') || '0', 10);
      let sheet = allData.wd;
      let label = hInfo.name || (hInfo.isH ? "휴일" : "평일");

      if (numOnly >= 34 && numOnly <= 54) {
        const isTH = getHolidayData(addDays(date, 1)).isH;
        if (!hInfo.isH && !isTH) { sheet = allData.ww; label = "평평"; }
        else if (!hInfo.isH && isTH) { sheet = allData.wh; label = "평휴"; }
        else if (hInfo.isH && isTH) { sheet = allData.hh; label = "휴휴"; }
        else { sheet = allData.hw; label = "휴평"; }
      } else if (numOnly >= 1 && numOnly <= 33) {
        sheet = hInfo.isH ? allData.hd : allData.wd;
      }

      const row = (sheet || []).find((item: any) => item.matchNum === targetDia.replace(/[^a-zA-Z0-9가-힣~]/g, ""));
      return { ...base, label: base.label || label, ...(row || {}) };
    } catch (e) {
      return { diaNum: "?", label: "에러", isRed: false, reportTime: "", content1: "", content2: "", isUser };
    }
  }, [allData, overrides]);

  return { calculateShift };
};
