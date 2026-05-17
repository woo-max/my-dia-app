package com.hyunwook.shift;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    
    // 시스템 오디오 서비스가 제어하므로 프로세스 킬 가드에 안전함
    private static Ringtone activeRingtone = null;
    private static Vibrator activeVibrator = null;
    private static final int NOTIFICATION_ID = 9999;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "🔔 수신된 액션: " + action);

        // ⏰ [알람 해제 버튼 및 배너 클릭 수신 구역]
        if ("com.hyunwook.shift.ACTION_DISMISS_ALARM".equals(action)) {
            Log.d(TAG, "🛑 [알람 해제] 오디오 스트림 및 진동판 즉시 소멸 실행");
            
            if (activeRingtone != null && activeRingtone.isPlaying()) {
                activeRingtone.stop();
                activeRingtone = null;
            }
            if (activeVibrator != null) {
                activeVibrator.cancel();
                activeVibrator = null;
            }

            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(NOTIFICATION_ID);
            }
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            AlarmScheduler.refreshAlarms(context);
            return;
        }

        if ("com.hyunwook.shift.ACTION_ALARM_TIMER".equals(action)) {
            String dateString = intent.getStringExtra("dateString");
            String timeText = intent.getStringExtra("timeText");

            // 1. 하드웨어 진동 루프 가동
            activeVibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (activeVibrator != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    activeVibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 1000, 1000}, 0));
                } else {
                    activeVibrator.vibrate(new long[]{0, 1000, 1000}, 0);
                }
            }

            // 2. 고성능 알람 채널 개설 
            // 💡 [핵심]: 완전히 새로운 ID를 부여해야만 갤럭시 OS가 새로운 소리와 버튼 레이아웃을 강제로 새로고침합니다.
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "shift_alarm_clean_rollback";

            // 🎵 리소스 폴더의 homecoming.mp3 주소 직접 바인딩
            Uri alarmSound = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.homecoming);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        channelId, "출근 자동 기상 알람", NotificationManager.IMPORTANCE_HIGH
                );
                
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build();
                
                channel.setSound(alarmSound, audioAttributes);
                channel.enableVibration(true);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }

            // 3. 알람 해제용 마스터 브레이크 신호 조립
            Intent dismissIntent = new Intent(context, AlarmReceiver.class);
            dismissIntent.setAction("com.hyunwook.shift.ACTION_DISMISS_ALARM");
            PendingIntent dismissPi = PendingIntent.getBroadcast(
                    context, 0, dismissIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // 4. 노티피케이션 조립 (배너 클릭 가드 우회 적용)
            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle("🚨 출근 알람 (" + timeText + ")")
                    .setContentText("터치하면 알람이 즉시 종료됩니다.") 
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(true) 
                    .setContentIntent(dismissPi) // 🚀 배너 전체 본체를 터치해도 즉시 꺼지도록 정밀 피팅
                    .addAction(android.R.drawable.ic_menu_close_clear_cancel, "⏰ 알람 끄기", dismissPi); // 확장 버튼 백업 유지

            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID, builder.build());
            }

            // 5. 시스템 오디오 세션에 파이프라인 결합 후 강제 가동
            try {
                activeRingtone = RingtoneManager.getRingtone(context, alarmSound);
                if (activeRingtone != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        activeRingtone.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
                    }
                    activeRingtone.play();
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ 오디오 구동 실패: ", e);
            }
        }
    }
}