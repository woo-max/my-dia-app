const TABS = ["평일주간", "휴일주간", "평평", "평휴", "휴휴", "휴평"];

export const fetchSheetData = async (sheetId: string, apiKey: string) => {
  if (!sheetId || !apiKey) return null;

  try {
    const ranges = TABS.map(tab => `ranges=${encodeURIComponent(tab)}!A:D`).join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?${ranges}&key=${apiKey}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    
    const json = await res.json();
    const valueRanges = json.valueRanges || [];
    const result: any = {};

    valueRanges.forEach((range: any, index: number) => {
      const tabName = TABS[index];
      const rows = range.values || [];
      
      let lastDia = "";
      // [로직] A열 빈칸 시 이전 DIA 번호를 유지하며 전처리
      result[tabName] = rows.map((row: any[]) => {
        if (row[0] && row[0].trim() !== "") {
          lastDia = row[0].trim();
        }
        return {
          dia: lastDia,      // 번호 상속 로직 적용
          type: row[1] || "", // 전반/후반
          content: row[3] || "" // 사업내용
        };
      });
    });

    return result;
  } catch (error) {
    console.error("Google Sheets API Error:", error);
    return null;
  }
};