import { useState, useEffect, useCallback } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import { parseTrainsFromHtml, LiveTrain } from '../utils/liveTrainParser';

export const useLiveTrainTracking = (trainNo: string | null, line: string) => {
  const [train, setTrain] = useState<LiveTrain | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPosition = useCallback(async () => {
    if (!trainNo) return;
    setLoading(true);
    try {
      const url = `https://smss.seoulmetro.co.kr/traininfo/traininfoUserMap.do?searchLine=${line}`;
      const response = await CapacitorHttp.get({ url });

      // 🚀 [GPT 제안 반영] 데이터 타입 인터락: 문자열이 아니면 문자열로 변환
      const html = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);

      console.log("📡 수신된 HTML 길이:", html.length); // 로그 확인용

      const allTrains = parseTrainsFromHtml(html, line);
      console.log(`🔎 현재 ${line}호선에서 운행 중인 열차 수:`, allTrains.length);

      // K/S 접두어 제외하고 매칭
      const targetBase = trainNo.replace(/^[KS]/, '');
      const found = allTrains.find(t => 
        t.trainNo === trainNo || t.trainNo.replace(/^[KS]/, '') === targetBase
      );
      
      console.log("🎯 찾고 있는 열차:", trainNo, "찾은 결과:", found);
      
      setTrain(found || null);
    } catch (e) {
      console.error("🚨 관제 데이터 수신 에러:", e);
    } finally {
      setLoading(false);
    }
  }, [trainNo, line]);

  useEffect(() => {
    setTrain(null); // 열차 번호 바뀌면 초기화
    if (!trainNo) return;

    fetchPosition();
    const timer = setInterval(fetchPosition, 6000); // 6초 주기 동기화
    return () => clearInterval(timer);
  }, [trainNo, fetchPosition]);

  return { train, loading };
};