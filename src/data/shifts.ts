import { isHoliday, holidayName } from "./holidays";
import { DIA_DATA, CATEGORY_LABEL, extractDeparture, type DiaCategory, type DiaEntry } from "./diaTimings";

// 사용자 제공 교번 순서 (5/6 = 36 기준)
export const DIA_SEQUENCE: string[] = [
  "대1","49","~","휴1","16","34","~","휴10","8","26","휴16","대12","~","휴22",
  "3","33","42","~","휴4","9","46","~","휴29","대4","18","휴13","51","~",
  "휴19","19","31","43","~","휴7","14","대14","~","휴25","12","40","~","휴28",
  "13","24","휴32","38","~","휴17","1","29","54","~","휴2","대2","44","~",
  "휴30","17","30","37","~","휴11","대5","20","휴23","대13","~","휴5","15","35",
  "~","휴20","10","52","~","휴14","21","27","휴26","47","~","휴8","5","28",
  "53","~","휴31","대3","39","~","휴3","2","대11","~","휴18","6","23","휴12",
  "41","~","휴24","4","32","50","~","휴6","대6","45","~","휴21","11","22",
  "휴15","48","~","휴27","7","25","36","~","휴9",
];

const ANCHOR = new Date(2026, 4, 6);
const ANCHOR_INDEX = 118;

export type DiaKind = "평" | "휴" | "대" | "비";

export interface DiaInfo {
  raw: string;
  kind: DiaKind;
  number: string;       // 숫자만 (e.g. "16", "36")
  display: string;      // 달력 셀에 표시 (e.g. "16","휴1","대5","~")
  category: DiaCategory;
  categoryLabel: string;
  entry?: DiaEntry;
  departureTime?: string;
  holidayName?: string;
  isHoliday: boolean;
}

function classify(raw: string): DiaKind {
  if (raw === "~") return "비";
  if (raw.startsWith("휴")) return "휴";
  if (raw.startsWith("대")) return "대";
  return "평";
}

const numOnly = (raw: string) => raw.replace(/^(휴|대)/, "");

export function getDiaForDate(date: Date): DiaInfo {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const a = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth(), ANCHOR.getDate());
  const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
  const len = DIA_SEQUENCE.length;
  const idx = ((ANCHOR_INDEX + diff) % len + len) % len;
  const raw = DIA_SEQUENCE[idx];
  const kind = classify(raw);
  const num = numOnly(raw);
  const n = parseInt(num, 10);

  const todayHol = isHoliday(d);
  const tomorrow = new Date(d.getTime() + 86400000);
  const tomHol = isHoliday(tomorrow);

  let category: DiaCategory = "off";
  if (kind !== "비" && !isNaN(n)) {
    if (n <= 33) {
      category = todayHol ? "holiday_day" : "weekday_day";
    } else {
      // 34~54 야간: 오늘/내일 평/휴 조합
      if (!todayHol && !tomHol) category = "pp";
      else if (!todayHol && tomHol) category = "ph";
      else if (todayHol && !tomHol) category = "hp";
      else category = "hh";
    }
  }

  const entry = category !== "off"
    ? (DIA_DATA[category] as Record<string, DiaEntry>)[num]
    : undefined;

  return {
    raw,
    kind,
    number: num,
    display: raw,
    category,
    categoryLabel: CATEGORY_LABEL[category],
    entry,
    departureTime: entry ? extractDeparture(entry.first.dep) : undefined,
    holidayName: holidayName(d),
    isHoliday: todayHol,
  };
}

export const KIND_TEXT_COLOR: Record<DiaKind, string> = {
  평: "text-foreground",
  휴: "text-rose-500",
  대: "text-emerald-400",
  비: "text-muted-foreground",
};
