const API_KEY = "AIzaSyCuRd69wp_x8iTaKajjdajZSO_31O_N7lk";
const SHEET_ID = "1FkZO46XQLJr52JHL62KKYgSge1ILP3107c8nGjqm_cc";

// 근무 시작 시간에서 30분을 빼는 함수 (동07:17... -> 06:47)
const calculateReportTime = (content: string) => {
  if (!content) return "";
  // 숫자 4개 연속(시간) 패턴 찾기
  const timeMatch = content.match(/(\d{2}):(\d{2})/);
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    let minutes = parseInt(timeMatch[2], 10);
    
    // 30분 빼기
    minutes -= 30;
    if (minutes < 0) {
      minutes += 60;
      hours -= 1;
    }
    // 00시 이전 처리 (필요시)
    if (hours < 0) hours += 24;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  return ""; // 시간을 찾을 수 없으면 빈칸
};

export const fetchAllRotationData = async () => {
  const fetchTab = async (tabName: string, label: string) => {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tabName)}!A:D?key=${API_KEY}&t=${Date.now()}`;
      const response = await fetch(url, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const data = await response.json();
      const rows = data.values || [];
      
      const formattedData = [];
      for (let i = 1; i < rows.length; i++) {
        const diaNumRaw = rows[i][0]?.toString().trim();
        if (diaNumRaw) {
          const nextRow = rows[i + 1];
          const hasSecondHalf = nextRow && (!nextRow[0] || nextRow[0].trim() === "");

          const content1 = rows[i][3]?.toString().trim() || "";
          
          formattedData.push({
            matchNum: diaNumRaw.replace(/[^a-zA-Z0-9가-힣~]/g, ""),
            diaNum: diaNumRaw,
            tabLabel: label,
            // 출근 시간 계산 추가
            reportTime: calculateReportTime(content1),
            // 전반
            shift1Type: rows[i][1]?.toString().trim() || "",
            content1: content1,
            // 후반
            shift2Type: hasSecondHalf ? nextRow[1]?.toString().trim() : "",
            content2: hasSecondHalf ? nextRow[3]?.toString().trim() : "",
            // 운휴 여부 체크
            isUnu: content1.includes("운휴")
          });
          if (hasSecondHalf) i++;
        }
      }
      return formattedData;
    } catch (e) {
      return [];
    }
  };

  const [wd, hd, ww, wh, hh, hw] = await Promise.all([
    fetchTab("평일주간", "평일"), fetchTab("휴일주간", "휴일"),
    fetchTab("평평", "평평"), fetchTab("평휴", "평휴"),
    fetchTab("휴휴", "휴휴"), fetchTab("휴평", "휴평")
  ]);

  return { wd, hd, ww, wh, hh, hw };
};
