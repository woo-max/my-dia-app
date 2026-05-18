package com.hyunwook.shift;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class MonthlyWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout_monthly);

        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String rawJson = prefs.getString("WidgetAlarmData", null);
            if (rawJson != null) {
                JSONObject root = new JSONObject(rawJson);

                if (root.has("today")) {
                    String dateText = root.getJSONObject("today").optString("dateString", "");
                    if (dateText.length() >= 7) {
                        String monthStr = dateText.substring(5, 7);
                        if (monthStr.startsWith("0")) monthStr = monthStr.substring(1);
                        views.setTextViewText(R.id.txt_widget_month_title, monthStr + "월");
                    }
                }

                if (root.has("monthDays")) {
                    JSONArray monthDays = root.getJSONArray("monthDays");
                    int totalLength = Math.min(monthDays.length(), 42);

                    for (int i = 0; i < totalLength; i++) {
                        JSONObject day = monthDays.getJSONObject(i);

                        String dateText = day.getString("dateText");
                        String dia = day.getString("dia");
                        String label = day.optString("label", "");
                        String timeText = day.getString("timeText");
                        String overrideType = day.optString("overrideType", "");
                        // 🚀 [추가]: React가 보낸 구글시트 운휴 원장 판정 도장 획득 (꺼내오기)
boolean isUnhyu = day.optBoolean("isUnhyu", false);
                        boolean isToday = day.getBoolean("isToday");
                        boolean isInMonth = day.getBoolean("isInMonth");
                        boolean isHoliday = day.getBoolean("isHoliday");
                        boolean isSat = day.getBoolean("isSat");
                        boolean isSun = day.getBoolean("isSun");
                        String holidayName = day.optString("holidayName", "");
                        String memo1 = day.optString("memo1", "");
                        String memo2 = day.optString("memo2", "");
                        boolean hasMore = day.optBoolean("hasMore", false);

                        int cellId = context.getResources().getIdentifier("cell_" + i, "id", context.getPackageName());
                        int txtDateId = context.getResources().getIdentifier("txt_date_" + i, "id", context.getPackageName());
                        int txtDiaId = context.getResources().getIdentifier("txt_dia_" + i, "id", context.getPackageName());
                        int txtTimeId = context.getResources().getIdentifier("txt_time_" + i, "id", context.getPackageName());
                        int txtMemo1Id = context.getResources().getIdentifier("txt_memo1_" + i, "id", context.getPackageName());
                        int txtMemo2Id = context.getResources().getIdentifier("txt_memo2_" + i, "id", context.getPackageName());
                        int txtMoreId = context.getResources().getIdentifier("txt_more_" + i, "id", context.getPackageName());

                        if (cellId == 0) continue;

                        if (!isInMonth) {
                            views.setViewVisibility(cellId, View.INVISIBLE);
                            continue;
                        } else {
                            views.setViewVisibility(cellId, View.VISIBLE);
                        }

                        // Text mapping
                        String finalDateText = dateText;
                        if (!holidayName.isEmpty()) {
                            finalDateText += " " + holidayName;
                        }
                        views.setTextViewText(txtDateId, finalDateText);

                        String finalDiaText = dia;
                        if (!label.isEmpty()) {
                            finalDiaText += " " + label;
                        }
                        views.setTextViewText(txtDiaId, finalDiaText);
                        views.setTextViewText(txtTimeId, timeText);

                        // Colors binding
int baseTextColor = Color.parseColor("#E3E2E6");
if (isSun || isHoliday) {
    baseTextColor = Color.parseColor("#FF4D4D");
} else if (isSat) {
    baseTextColor = Color.parseColor("#4D94FF");
}
views.setTextColor(txtDateId, baseTextColor);

// 🚀 [완전 교정]: CalendarCell.tsx 소스 코드와 1:1 대치되는 위젯 전용 텍스트 컬러 분기 엔진
int diaTextColor = Color.WHITE; // 기본값 (흰색)

// 🚀 [완전 교정]: overrideType이 red(휴가류)이거나 구글 시트 원장 판정이 운휴(isUnhyu == true)인 경우 강제 빨간색 렌더링
if (overrideType.equals("red") || isUnhyu) { 
    diaTextColor = Color.parseColor("#FF4D4D");
     // 휴가류 및 시트상 운휴 확정일 (빨간색)
} else if (overrideType.equals("blue")) {
    diaTextColor = Color.parseColor("#4D94FF");
     // 교번교체, 대기충당, 지정근무 (파란색)
} else if (overrideType.equals("yellow")) {
    diaTextColor = Color.parseColor("#FFB300");
     // 휴무충당 (노란색/Amber)
} else if (dia.contains("휴") || dia.contains("운")) {
    diaTextColor = Color.parseColor("#FF4D4D");
     // 일반 스케줄상의 휴무 및 운휴 (빨간색)
}

views.setTextColor(txtDiaId, diaTextColor);

                        // Today Highlight matrix
                        if (isToday) {
                            views.setInt(cellId, "setBackgroundColor", Color.parseColor("#33D6FFBD"));
                        } else {
                            views.setInt(cellId, "setBackgroundColor", Color.parseColor("#1A1C1E"));
                        }

                        // Memos matrix
                        if (!memo1.isEmpty()) {
                            views.setViewVisibility(txtMemo1Id, View.VISIBLE);
                            views.setTextViewText(txtMemo1Id, memo1);
                        } else {
                            views.setViewVisibility(txtMemo1Id, View.GONE);
                        }

                        if (!memo2.isEmpty()) {
                            views.setViewVisibility(txtMemo2Id, View.VISIBLE);
                            views.setTextViewText(txtMemo2Id, memo2);
                        } else {
                            views.setViewVisibility(txtMemo2Id, View.GONE);
                        }

                        views.setViewVisibility(txtMoreId, hasMore ? View.VISIBLE : View.GONE);

                        // Safe PendingIntent binding matching 4x2 spec
                        Intent clickIntent = new Intent(context, MainActivity.class);
                        clickIntent.putExtra("targetDate", day.getString("dateString"));
                        clickIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        PendingIntent pi = PendingIntent.getActivity(context, 500 + i, clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                        views.setOnClickPendingIntent(cellId, pi);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
