export interface LiveTrain {
  trainNo: string;
  stationName: string;
  status: '도착' | '접근' | '출발' | '이동';
  destination: string;
  line: string;
}

export const parseTrainsFromHtml = (html: string, line: string): LiveTrain[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = doc.querySelectorAll('.tip[title]');
  const trains: LiveTrain[] = [];

  elements.forEach((el) => {
    const title = el.getAttribute('title') || '';
    // 정규식: [열차번호]열차 [현재역] [상태] [종착역]행
    const match = title.match(/([A-Z]?\d+)열차\s+(.+?)\s+(도착|접근|출발|이동)\s+(.+)/);
    
    if (match) {
      trains.push({
        trainNo: match[1],
        stationName: match[2].trim(),
        status: match[3] as LiveTrain['status'],
        destination: match[4].trim(),
        line,
      });
    }
  });
  return trains;
};