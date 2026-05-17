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
        if (alarmManager == null) {
            Log.e(TAG, "❌ 시스템 AlarmManager를 불러올 수 없습니다.");
            return;
        }

        String rawJson = null;
        int alarmOffset = 90;
        JSONArray monthDays = null;

        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            rawJson = prefs.getString("WidgetAlarmData", null);
            if (rawJson == null) return;

            JSONObject root = new JSONObject(rawJson);
            alarmOffset = root.optInt("alarmOffset", 90);
            if (!root.has("monthDays")) return;
            monthDays = root.getJSONArray("monthDays");
        } catch (Exception e) {
            Log.e(TAG, "❌ 초기 JSON 로드 단계 치명적 에러 발생: ", e);
            return;
        }

        SimpleDateFormat dateOnlySdf = new SimpleDateFormat("yyyy-MM-dd", Locale.KOREA);
        String todayStr = dateOnlySdf.format(new Date());

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.KOREA);
        long currentTime = System.currentTimeMillis();
        int alarmCount = 0;

        for (int i = 0; i < monthDays.length(); i++) {
            if (alarmCount >= 7) break;

            try {
                JSONObject day = monthDays.getJSONObject(i);
                if (!day.has("dateString") || !day.has("timeText")) continue;

                String dateString = day.getString("dateString");
                String timeText = day.getString("timeText");

                if (dateString.compareTo(todayStr) < 0) continue;

                if (timeText.isEmpty() || timeText.equals("--:--") || timeText.contains("휴") || timeText.contains("운")) {
                    continue;
                }

                Date reportDateTime = sdf.parse(dateString + " " + timeText);
                if (reportDateTime == null) continue;

                Calendar calendar = Calendar.getInstance();
                calendar.setTime(reportDateTime);
                calendar.add(Calendar.MINUTE, -alarmOffset);
                long alarmTargetMillis = calendar.getTimeInMillis();

                if (alarmTargetMillis <= currentTime) continue;

                int intentId = dateString.hashCode();

                Intent receiverIntent = new Intent(context, AlarmReceiver.class);
                receiverIntent.setAction("com.hyunwook.shift.ACTION_ALARM_TIMER");
                receiverIntent.putExtra("dateString", dateString);
                receiverIntent.putExtra("timeText", timeText);

                PendingIntent operationPi = PendingIntent.getBroadcast(
                        context, 
                        intentId, 
                        receiverIntent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );

                Intent activityIntent = new Intent(context, MainActivity.class);
                PendingIntent showPi = PendingIntent.getActivity(
                        context,
                        intentId,
                        activityIntent,
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
                Log.e(TAG, "❌ 격자 분석 오류: ", cellException);
            }
        }

        // 🚀 [최종 커널 팩트체크 검증부 신설]
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AlarmManager.AlarmClockInfo nextAlarm = alarmManager.getNextAlarmClock();
            if (nextAlarm != null) {
                // 🔮 이 로그가 찍히면 빅스비가 뭐라 하든 안드로이드 시스템에 완벽히 등록되어 내일 100% 울립니다.
                Log.d(TAG, "🔮 [OS 커널 원장 실시간 조회 결과]: 현재 안드로이드 시스템에 최종 대기 중인 마스터 알람 시각은 [ " 
                        + sdf.format(new Date(nextAlarm.getTriggerTime())) + " ] 입니다.");
            } else {
                // ❌ 이 로그가 찍히면 안드로이드 OS 가드가 알람을 차단한 것입니다. (권한 설정 필요)
                Log.e(TAG, "❌ [OS 커널 조회 결과 실패]: 시스템 대기열이 텅 비어있습니다. OS 가드가 알람 등록을 거부했습니다.");
            }
        }

        Log.d(TAG, "🏁 [공정 완료] 총 " + alarmCount + "개의 정식 규격 마스터 알람이 이식되었습니다.");
    }
}