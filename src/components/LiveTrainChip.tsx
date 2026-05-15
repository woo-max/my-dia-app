import React from 'react';
import { motion } from 'framer-motion';
import { useLiveTrainTracking } from '../hooks/useLiveTrainTracking';

export const LiveTrainChip = ({ trainNo, line }: { trainNo: string; line: string }) => {
  const { train, loading } = useLiveTrainTracking(trainNo, line);

  // 🚀 데이터를 찾는 중일 때
  if (loading) {
    return <span className="text-[14px] text-blue-500 font-black animate-pulse">📡 수신 중...</span>;
  }

  // 🚀 번호는 찾았는데 서버에 데이터가 없을 때 (운행 종료 등)
  if (!train) {
    return <span className="text-[14px] text-gray-400 font-black italic">💤 {trainNo} 미운행</span>;
  }

  // 🚀 데이터 수신 성공! (실시간 위치 표시)
  return (
    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
      <span className="text-[14px] font-black text-black">
        {train.stationName} <span className="text-blue-500">{train.status}</span>
      </span>
    </div>
  );
};