package com.hyunwook.shift;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";
    
    // 🚀 [핵심 수정] Ringtone 대신 MediaPlayer 사용 (루프 제어를 위함)
    private static MediaPlayer activePlayer = null;
    private static Vibrator activeVibrator = null;
    private static final int NOTIFICATION_ID = 9999;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "🔔 수신된 액션: " + action);

        // 1. 알람 해제 (오디오 및 진동 소멸)
        if ("com.hyunwook.shift.ACTION_DISMISS_ALARM".equals(action)) {
            Log.d(TAG, "🛑 [알람 해제] 오디오 및 진동판 즉시 소멸 실행");
            
            if (activePlayer != null) {
                if (activePlayer.isPlaying()) activePlayer.stop();
                activePlayer.release();
                activePlayer = null;
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

        // 2. 부팅 완료 처리
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            AlarmScheduler.refreshAlarms(context);
            return;
        }

        // 3. 알람 실행
        if ("com.hyunwook.shift.ACTION_ALARM_TIMER".equals(action)) {
            String timeText = intent.getStringExtra("timeText");

            // 진동 가동
            activeVibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (activeVibrator != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    activeVibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 1000, 1000}, 0));
                } else {
                    activeVibrator.vibrate(new long[]{0, 1000, 1000}, 0);
                }
            }

            // 고성능 알람 채널 개설
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "shift_alarm_clean_rollback";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        channelId, "출근 자동 기상 알람", NotificationManager.IMPORTANCE_HIGH
                );
                channel.enableVibration(true);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }

            Intent dismissIntent = new Intent(context, AlarmReceiver.class);
            dismissIntent.setAction("com.hyunwook.shift.ACTION_DISMISS_ALARM");
            PendingIntent dismissPi = PendingIntent.getBroadcast(
                    context, 0, dismissIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle("🚨 출근 알람 (" + (timeText != null ? timeText : "") + ")")
                    .setContentText("터치하면 알람이 즉시 종료됩니다.")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(true)
                    .setContentIntent(dismissPi)
                    .addAction(android.R.drawable.ic_menu_close_clear_cancel, "⏰ 알람 끄기", dismissPi);

            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID, builder.build());
            }

            // 🚀 [핵심 수정] MediaPlayer 사용하여 무한 루프 재생
            try {
                if (activePlayer != null) {
                    activePlayer.release();
                }
                activePlayer = MediaPlayer.create(context, R.raw.homecoming);
                if (activePlayer != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        activePlayer.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                .build());
                    }
                    activePlayer.setLooping(true); // 💡 무한 반복 핵심 설정
                    activePlayer.start();
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ 오디오 구동 실패: ", e);
            }
        }
    }
}