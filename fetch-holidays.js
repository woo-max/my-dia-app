import fs from 'fs';

// 기관사님의 일반인증키
const API_KEY = '2e4561d9691a2b7e3c71493a3b699f58adfbd37bc834e37ad788db2fa7efde6f';
const START_YEAR = 2024;
const END_YEAR = 2060;

async function fetchHolidays() {
  console.log(`🚀 ${START_YEAR}년부터 ${END_YEAR}년까지 공휴일 데이터를 추출합니다...`);
  const holidays = {};

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    // solMonth를 빼고 numOfRows를 100으로 주면 1년 치를 한 번에 가져옵니다.
    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${API_KEY}&solYear=${year}&numOfRows=100&_type=json`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      const items = data.response?.body?.items?.item;

      if (items) {
        // 휴일이 1개일 때는 객체로, 여러 개일 때는 배열로 오므로 배열로 통일
        const itemList = Array.isArray(items) ? items : [items];
        
        itemList.forEach(item => {
          const dateStr = String(item.locdate);
          // 20240101 -> 2024-01-01 포맷으로 변환
          const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          holidays[formattedDate] = item.dateName;
        });
      }
      console.log(`✅ ${year}년 데이터 수집 완료`);
    } catch (error) {
      console.error(`❌ ${year}년 데이터 수집 실패:`, error);
    }
    
    // 공공데이터포털 서버 과부하(트래픽 차단) 방지를 위해 0.5초 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 추출한 데이터를 TypeScript 파일 형태로 조립
  const fileContent = `// 🚀 한국천문연구원 특일정보 API에서 추출된 2024~2045년 공휴일 데이터\nexport const HOLIDAYS_DATA: { [key: string]: string } = ${JSON.stringify(holidays, null, 2)};\n`;

  // src/utils 폴더 안에 저장
  fs.writeFileSync('./src/utils/holidaysData.ts', fileContent, 'utf-8');
  console.log('\n🎉 모든 추출이 완료되었습니다! [src/utils/holidaysData.ts] 파일이 생성되었습니다.');
}

fetchHolidays();