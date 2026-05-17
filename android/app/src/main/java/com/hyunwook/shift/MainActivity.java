package com.hyunwook.shift;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SharedPreferences.OnSharedPreferenceChangeListener prefListener;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        prefListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
                if ("WidgetAlarmData".equals(key)) {
                    // 1. 기존 오늘/내일 (4x2) 위젯 실시간 강제 새로고침 시그널
                    Intent intent = new Intent(MainActivity.this, ShiftWidgetProvider.class);
                    intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    int[] ids = AppWidgetManager.getInstance(getApplication()).getAppWidgetIds(
                            new ComponentName(getApplication(), ShiftWidgetProvider.class)
                    );
                    intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                    sendBroadcast(intent);

                    // 🚀 [추가 완료]: 신규 한달치 (4x6) 달력 위젯 실시간 강제 새로고침 시그널
                    Intent intentMonthly = new Intent(MainActivity.this, MonthlyWidgetProvider.class);
                    intentMonthly.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    int[] idsMonthly = AppWidgetManager.getInstance(getApplication()).getAppWidgetIds(
                            new ComponentName(getApplication(), MonthlyWidgetProvider.class)
                    );
                    intentMonthly.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, idsMonthly);
                    sendBroadcast(intentMonthly);
                }
            }
        };
        prefs.registerOnSharedPreferenceChangeListener(prefListener);

        // 앱이 완전 종료된 상태에서 위젯 클릭으로 구동될 때의 딥링크 처리
        handleWidgetIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // 앱이 백그라운드에 살아있는 상태에서 위젯 클릭 시 처리
        handleWidgetIntent(intent);
    }

    private void handleWidgetIntent(Intent intent) {
        if (intent != null && intent.hasExtra("targetDate")) {
            final String targetDate = intent.getStringExtra("targetDate");
            
            // WebView 내부에 JS 커스텀 이벤트를 비동기로 직접 주입하여 팝업 강제 트리거
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