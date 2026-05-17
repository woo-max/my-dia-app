package com.hyunwook.shift;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class AlarmScheduler {
    private static final String TAG = "AlarmEngine";

    public static void refreshAlarms(Context context) {
        Log.d(TAG, "⏰ [엔진 가동] 알람 스케줄러 동기화 스캔을 시작합니다.");
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        String rawJson = null;
        int alarmOffset = 90;
        boolean isAlarmEnabled = true; // 🚀 알람 전체 기능 ON/OFF 마스터 플래그
        JSONArray monthDays = null;

        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            rawJson = prefs.getString("WidgetAlarmData", null);
            if (rawJson == null) return;

            JSONObject root = new JSONObject(rawJson);
            alarmOffset = root.optInt("alarmOffset", 90);
            
            // 🚀 React에서 넘겨받을 스위치 키값 (보내주지 않으면 기본값 true로 작동)
            isAlarmEnabled = root.optBoolean("isAlarmEnabled", true); 
            
            if (!root.has("monthDays")) return;
            monthDays = root.getJSONArray("monthDays");
        } catch (Exception e) {
            Log.e(TAG, "❌ 초기 JSON 로드 단계 에러: ", e);
            return;
        }

        SimpleDateFormat dateOnlySdf = new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA);
        String todayStr = dateOnlySdf.format(new Date());
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.KOREA);
        long currentTime = System.currentTimeMillis();
        int alarmCount = 0;

        Log.d(TAG, "📢 현재 알람 기능 사용 여부 스위치 상태: " + isAlarmEnabled);

        for (int i = 0; i < monthDays.length(); i++) {
            try {
                JSONObject day = monthDays.getJSONObject(i);
                if (!day.has("dateString")) continue;

                String dateString = day.getString("dateString");
                int intentId = dateString.hashCode();

                // 알람 취소/등록에 공통으로 필요한 고유 펜딩 인텐트 조립
                Intent receiverIntent = new Intent(context, AlarmReceiver.class);
                receiverIntent.setAction("com.hyunwook.shift.ACTION_ALARM_TIMER");
                PendingIntent operationPi = PendingIntent.getBroadcast(
                        context, intentId, receiverIntent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                // 🚀 [마스터 OFF 메커니즘]: 스위치가 꺼져있다면 기존에 예약된 모든 칸의 알람을 OS 원장에서 강제 철거(Cancel)
                if (!isAlarmEnabled) {
                    alarmManager.cancel(operationPi);
                    continue;
                }

                // --- 아래는 스위치가 켜져있을(true) 때만 실행되는 정식 예약 공정 ---
                if (alarmCount >= 7) continue;
                if (!day.has("timeText")) continue;
                
                String timeText = day.getString("timeText");
                if (dateString.compareTo(todayStr) < 0) continue;
                
                if (timeText.isEmpty() || timeText.equals("--:--") || timeText.contains("휴") || timeText.contains("운")) {
                    alarmManager.cancel(operationPi); // 근무 없는 날도 알람 확실히 파괴
                    continue;
                }

                Date reportDateTime = sdf.parse(dateString + " " + timeText);
                if (reportDateTime == null) continue;

                Calendar calendar = Calendar.getInstance();
                calendar.setTime(reportDateTime);
                calendar.add(Calendar.MINUTE, -alarmOffset);
                long alarmTargetMillis = calendar.getTimeInMillis();

                if (alarmTargetMillis <= currentTime) {
                    alarmManager.cancel(operationPi);
                    continue;
                }

                Intent activityIntent = new Intent(context, MainActivity.class);
                PendingIntent showPi = PendingIntent.getActivity(
                        context, intentId, activityIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(alarmTargetMillis, showPi);
                    alarmManager.setAlarmClock(clockInfo, operationPi);
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, alarmTargetMillis, operationPi);
                }

                alarmCount++;

            } catch (Exception cellException) {
                Log.e(TAG, "❌ 격자 데이터 동기화 에러: ", cellException);
            }
        }

        // 최종 커널 검증부 로그 출력 변경
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AlarmManager.AlarmClockInfo nextAlarm = alarmManager.getNextAlarmClock();
            if (nextAlarm != null) {
                Log.d(TAG, "🔮 [OS 커널 원장 조회 결과]: 현재 대기 중인 최상위 마스터 알람 시각 -> [ " + sdf.format(new Date(nextAlarm.getTriggerTime())) + " ]");
            } else {
                Log.d(TAG, "🔮 [OS 커널 원장 조회 결과]: 현재 예약된 시스템 알람 대기열이 완전히 비어있습니다.");
            }
        }
        Log.d(TAG, "🏁 [공정 완료] 동기화 스캔 종료 (최종 등록 개수: " + alarmCount + "개)");
    }
}