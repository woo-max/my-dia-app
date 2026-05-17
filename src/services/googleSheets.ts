const TABS = ["평일주간", "휴일주간", "평평", "평휴", "휴휴", "휴평"];

export const fetchSheetData = async (sheetId: string, apiKey: string) => {
  if (!sheetId || !apiKey) return null;

  try {
    // 🚀 1. 범위를 A:D에서 A:E로 확장하여 구글 시트의 E열(이미지 파일)까지 한꺼번에 긁어옵니다.
    const ranges = TABS.map(tab => `ranges=${encodeURIComponent(tab)}!A:E`).join('&');
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
      result[tabName] = rows.map((row: any[]) => {
        if (row[0] && row[0].trim() !== "") {
          lastDia = row[0].trim();
        }
        return {
          dia: lastDia,
          type: row[1] || "",
          content: row[3] || "",
          // 🚀 2. E열(5번째 칸 = row[4]) 데이터를 image라는 Key에 정확히 매핑하여 리액트 앱 전체로 유통시킵니다.
          image: row[4] || null 
        };
      });
    });

    return result;
  } catch (error) {
    console.error("Google Sheets API Error:", error);
    return null;
  }
};