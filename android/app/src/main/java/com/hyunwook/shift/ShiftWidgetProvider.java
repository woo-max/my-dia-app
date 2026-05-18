package com.hyunwook.shift;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;
import com.hyunwook.shift.R;

public class ShiftWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);

        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            // 🚀 [교정]: 실제 원장 테이블 명칭인 _cap_ 접두사 주입
            String rawJson = prefs.getString("_cap_WidgetAlarmData", null); 

            if (rawJson != null) {
                JSONObject root = new JSONObject(rawJson);
                
                // 1. 오늘 영역 데이터 처리
                if (root.has("today")) {
                    JSONObject today = root.getJSONObject("today");
                    views.setTextViewText(R.id.txt_today_date, today.getString("dateText"));
                    views.setTextViewText(R.id.txt_today_dia, today.getString("dia"));
                    views.setTextViewText(R.id.txt_today_label, today.optString("label", "")); // 🚀 라벨 독립 수신
                    views.setTextViewText(R.id.txt_today_time, today.getString("timeText"));
                    
                    views.setInt(R.id.block_today_bg, "setBackgroundResource", R.drawable.bg_date_today);
                    views.setTextColor(R.id.txt_today_date, android.graphics.Color.parseColor("#121314"));

                    bindMemoRow(views, today, "memo1", R.id.layout_today_memo1, R.id.txt_today_memo1, R.id.v_today_memo1_bar);
                    bindMemoRow(views, today, "memo2", R.id.layout_today_memo2, R.id.txt_today_memo2, R.id.v_today_memo2_bar);
                    bindMemoRow(views, today, "memo3", R.id.layout_today_memo3, R.id.txt_today_memo3, R.id.v_today_memo3_bar);

                    Intent clickIntent = new Intent(context, MainActivity.class);
                    clickIntent.putExtra("targetDate", today.getString("dateString"));
                    clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    PendingIntent pi = PendingIntent.getActivity(context, 101, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(R.id.layout_today_row, pi);
                }

                // 2. 내일 영역 데이터 처리
                if (root.has("tomorrow")) {
                    JSONObject tomorrow = root.getJSONObject("tomorrow");
                    views.setTextViewText(R.id.txt_tomorrow_date, tomorrow.getString("dateText"));
                    views.setTextViewText(R.id.txt_tomorrow_dia, tomorrow.getString("dia"));
                    views.setTextViewText(R.id.txt_tomorrow_label, tomorrow.optString("label", "")); // 🚀 라벨 독립 수신
                    views.setTextViewText(R.id.txt_tomorrow_time, tomorrow.getString("timeText"));
                    
                    if (tomorrow.getBoolean("isHoliday")) {
                        views.setInt(R.id.block_tomorrow_bg, "setBackgroundResource", R.drawable.bg_date_red);
                    } else {
                        views.setInt(R.id.block_tomorrow_bg, "setBackgroundResource", R.drawable.bg_date_black);
                    }

                    bindMemoRow(views, tomorrow, "memo1", R.id.layout_tomorrow_memo1, R.id.txt_tomorrow_memo1, R.id.v_tomorrow_memo1_bar);
                    bindMemoRow(views, tomorrow, "memo2", R.id.layout_tomorrow_memo2, R.id.txt_tomorrow_memo2, R.id.v_tomorrow_memo2_bar);
                    bindMemoRow(views, tomorrow, "memo3", R.id.layout_tomorrow_memo3, R.id.txt_tomorrow_memo3, R.id.v_tomorrow_memo3_bar);

                    Intent clickIntent = new Intent(context, MainActivity.class);
                    clickIntent.putExtra("targetDate", tomorrow.getString("dateString"));
                    clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    PendingIntent pi = PendingIntent.getActivity(context, 102, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    views.setOnClickPendingIntent(R.id.layout_tomorrow_row, pi);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void bindMemoRow(RemoteViews views, JSONObject data, String apiKey, int layoutId, int textId, int barId) {
        try {
            if (data.has(apiKey) && !data.isNull(apiKey)) {
                JSONObject memoObj = data.getJSONObject(apiKey);
                String text = memoObj.getString("text");
                String color = memoObj.getString("color");
                
                if (text != null && !text.trim().isEmpty()) {
                    views.setViewVisibility(layoutId, View.VISIBLE);
                    views.setTextViewText(textId, text);
                    views.setInt(barId, "setBackgroundColor", android.graphics.Color.parseColor(color));
                    return;
                }
            }
        } catch (Exception ignored) {}
        views.setViewVisibility(layoutId, View.GONE);
    }
}