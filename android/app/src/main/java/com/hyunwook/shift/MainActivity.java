package com.hyunwook.shift;

import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SharedPreferences.OnSharedPreferenceChangeListener prefListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🚀 [알림 가드 해제 공정]: 안드로이드 13 이상일 때 실행 시 권한 승인 팝업 강제 구동
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1002);
            }
        }

        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        prefListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
                if ("WidgetAlarmData".equals(key)) {
                    // 1. 기존 오늘/내일 위젯 강제 새로고침
                    Intent intent = new Intent(MainActivity.this, ShiftWidgetProvider.class);
                    intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    int[] ids = AppWidgetManager.getInstance(getApplication()).getAppWidgetIds(
                            new ComponentName(getApplication(), ShiftWidgetProvider.class)
                    );
                    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                    sendBroadcast(intent);

                    // 2. 신규 한달치 달력 위젯 강제 새로고침
                    Intent intentMonthly = new Intent(MainActivity.this, MonthlyWidgetProvider.class);
                    intentMonthly.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    int[] idsMonthly = AppWidgetManager.getInstance(getApplication()).getAppWidgetIds(
                            new ComponentName(getApplication(), MonthlyWidgetProvider.class)
                    );
                    intentMonthly.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, idsMonthly);
                    sendBroadcast(intentMonthly);

                    // 알람 커널 스케줄러 동기화
                    AlarmScheduler.refreshAlarms(MainActivity.this);
                }
            }
        };
        prefs.registerOnSharedPreferenceChangeListener(prefListener);

        // 앱 구동 즉시 알람 초기 동기화 및 로그 출력
        AlarmScheduler.refreshAlarms(this);

        // 위젯 클릭 인텐트 처리
        handleWidgetIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleWidgetIntent(intent);
    }

    private void handleWidgetIntent(Intent intent) {
        if (intent != null && intent.hasExtra("targetDate")) {
            final String targetDate = intent.getStringExtra("targetDate");
            
            getBridge().getWebView().post(new Runnable() {
                @Override
                public void run() {
                    getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('widgetClickDate', { detail: '" + targetDate + "' }));",
                        null
                    );
                }
            });
        }
    }
}