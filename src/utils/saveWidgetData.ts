import { Preferences } from '@capacitor/preferences';

interface WidgetAlarmData {
  alarm: {
    isAlarmEnabled: boolean;
    alarmTimeMillis: number;
    formattedAlarmTime: string;
    leadTimeMinutes: number;
  };
  shift: {
    shiftName: string;
    startTime: string;
    endTime: string;
    dateString: string;
  };
  updatedAt: number;
}

export const saveWidgetData = async (data: WidgetAlarmData) => {
  try {
    // 1. 단일 진실의 원본(SSOT) 데이터를 JSON 문자열로 직렬화
    const jsonString = JSON.stringify(data);

    // 2. CapacitorStorage 파일에 'WidgetAlarmData' 키로 저장
    await Preferences.set({
      key: 'WidgetAlarmData',
      value: jsonString,
    });

    console.log('위젯 데이터 동기화 완료:', data);
  } catch (error) {
    console.error('네이티브 스토리지 저장 실패:', error);
  }
};