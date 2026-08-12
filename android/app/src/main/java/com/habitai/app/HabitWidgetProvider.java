package com.habitai.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * וויג'ט מסך הבית: קורא וכותב ישירות ל-SharedPreferences שבו שומר
 * @capacitor/preferences (ראה src/lib/nativeWidget.js בצד ה-JS), כך שאין
 * צורך שהאפליקציה תהיה פתוחה כדי שהוויג'ט יציג את המצב העדכני. פעולות
 * שמבוצעות מתוך הוויג'ט (סימון הרגל / הוספת מים) מעדכנות רק תצוגה אופטימית
 * כאן, ונצברות בתור "פעולות ממתינות" שה-JS מיישם בפועל על ה-state האמיתי
 * (ראה drainWidgetPendingActions) בפעם הבאה שהאפליקציה נפתחת.
 *
 * רשימת ההרגלים עצמה מוצגת ב-ListView (widget_habits_list) שמוזן ע"י
 * HabitWidgetService/HabitListRemoteViewsFactory, כדי שתהיה גוללת כשיש יותר
 * הרגלים ממה שנכנס בגובה הוויג'ט - זהו המנגנון הרשמי של אנדרואיד לרשימות
 * בתוך App Widget (טעינה רגילה של views לא תומכת בגלילה).
 */
public class HabitWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String SNAPSHOT_KEY = "widget_snapshot";
    private static final String PENDING_KEY = "widget_pending_actions";

    static final String ACTION_TOGGLE_HABIT = "com.habitai.app.widget.ACTION_TOGGLE_HABIT";
    static final String ACTION_ADD_WATER = "com.habitai.app.widget.ACTION_ADD_WATER";
    private static final int WATER_QUICK_ADD_ML = 250;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context, appWidgetId));
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_TOGGLE_HABIT.equals(action)) {
            handleToggleHabit(context, intent.getStringExtra("habit_id"));
        } else if (ACTION_ADD_WATER.equals(action)) {
            handleAddWater(context);
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    static JSONObject readSnapshot(Context context) {
        String raw = prefs(context).getString(SNAPSHOT_KEY, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null;
        }
    }

    private static void writeSnapshot(Context context, JSONObject snapshot) {
        prefs(context).edit().putString(SNAPSHOT_KEY, snapshot.toString()).apply();
    }

    private static void queuePendingAction(Context context, JSONObject action) {
        SharedPreferences sp = prefs(context);
        JSONArray queue;
        try {
            queue = new JSONArray(sp.getString(PENDING_KEY, "[]"));
        } catch (JSONException e) {
            queue = new JSONArray();
        }
        queue.put(action);
        sp.edit().putString(PENDING_KEY, queue.toString()).apply();
    }

    private void handleToggleHabit(Context context, String habitId) {
        if (habitId == null) return;
        JSONObject snapshot = readSnapshot(context);
        if (snapshot == null) return;

        try {
            String date = snapshot.optString("date", "");
            JSONArray habits = snapshot.optJSONArray("habits");
            if (habits == null) return;

            for (int i = 0; i < habits.length(); i++) {
                JSONObject habit = habits.getJSONObject(i);
                if (!habitId.equals(habit.optString("id"))) continue;

                boolean newDone = !habit.optBoolean("done", false);
                habit.put("done", newDone);
                int doneCount = snapshot.optInt("doneHabits", 0) + (newDone ? 1 : -1);
                snapshot.put("doneHabits", Math.max(0, doneCount));
                writeSnapshot(context, snapshot);

                JSONObject pendingAction = new JSONObject();
                pendingAction.put("type", "toggleHabit");
                pendingAction.put("habitId", habitId);
                pendingAction.put("date", date);
                pendingAction.put("done", newDone);
                queuePendingAction(context, pendingAction);
                break;
            }
        } catch (JSONException e) {
            // מתעלמים - הוויג'ט פשוט לא יתעדכן אופטימית עד לפתיחת האפליקציה הבאה
        }

        refreshAllWidgets(context);
    }

    private void handleAddWater(Context context) {
        JSONObject snapshot = readSnapshot(context);
        if (snapshot == null) return;

        try {
            JSONObject water = snapshot.optJSONObject("water");
            if (water == null) {
                water = new JSONObject();
                snapshot.put("water", water);
            }
            water.put("total", water.optInt("total", 0) + WATER_QUICK_ADD_ML);
            writeSnapshot(context, snapshot);

            JSONObject pendingAction = new JSONObject();
            pendingAction.put("type", "addWater");
            pendingAction.put("amount", WATER_QUICK_ADD_ML);
            queuePendingAction(context, pendingAction);
        } catch (JSONException e) {
            // מתעלמים
        }

        refreshAllWidgets(context);
    }

    static void refreshAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, HabitWidgetProvider.class));
        for (int id : ids) {
            manager.updateAppWidget(id, buildRemoteViews(context, id));
        }
        manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_habits_list);
    }

    static int categoryColor(Context context, String category) {
        if ("mind".equals(category)) return context.getColor(R.color.widget_category_mind);
        if ("productivity".equals(category)) return context.getColor(R.color.widget_category_productivity);
        if ("social".equals(category)) return context.getColor(R.color.widget_category_social);
        return context.getColor(R.color.widget_category_health);
    }

    private static RemoteViews buildRemoteViews(Context context, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.habit_widget);
        int immutableFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        Intent openAppIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (openAppIntent != null) {
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openAppPending = PendingIntent.getActivity(context, 0, openAppIntent, immutableFlags);
            views.setOnClickPendingIntent(R.id.widget_header, openAppPending);
        }

        // מזין את ה-ListView דרך HabitWidgetService; setData עם ה-appWidgetId מבטיח שכל
        // מופע וויג'ט יקבל Intent ייחודי (לא נחתך/משותף בטעות בין מופעים).
        Intent listIntent = new Intent(context, HabitWidgetService.class);
        listIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        listIntent.setData(Uri.parse("habitwidget://list/" + appWidgetId));
        views.setRemoteAdapter(R.id.widget_habits_list, listIntent);
        views.setEmptyView(R.id.widget_habits_list, R.id.widget_empty_view);

        // תבנית ה-PendingIntent לפריטי הרשימה חייבת mutable (לא immutable) כדי
        // שה-fillInIntent של כל פריט (habit_id) יוכל להתמזג לתוכה בזמן הלחיצה.
        Intent toggleIntent = new Intent(context, HabitWidgetProvider.class);
        toggleIntent.setAction(ACTION_TOGGLE_HABIT);
        PendingIntent toggleTemplate = PendingIntent.getBroadcast(
            context, 0, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
        views.setPendingIntentTemplate(R.id.widget_habits_list, toggleTemplate);

        JSONObject snapshot = readSnapshot(context);
        if (snapshot == null) {
            views.setTextViewText(R.id.widget_date, "");
            views.setTextViewText(R.id.widget_done_count, "—");
            views.setTextViewText(R.id.widget_streak_count, "0");
            views.setProgressBar(R.id.widget_progress_bar, 100, 0, false);
            views.setTextViewText(R.id.widget_water_text, "פתחו את HabitAI כדי להתחיל");
            views.setProgressBar(R.id.widget_water_progress_bar, 100, 0, false);
            views.setViewVisibility(R.id.widget_water_add_button, View.GONE);
            return views;
        }

        int total = snapshot.optInt("totalHabits", 0);
        int done = snapshot.optInt("doneHabits", 0);
        int percent = total > 0 ? Math.min(100, Math.round((done * 100f) / total)) : 0;

        views.setTextViewText(R.id.widget_date, snapshot.optString("dateLabel", ""));
        views.setTextViewText(R.id.widget_done_count, done + "/" + total);
        views.setTextViewText(R.id.widget_streak_count, String.valueOf(snapshot.optInt("bestStreak", 0)));
        views.setProgressBar(R.id.widget_progress_bar, 100, percent, false);

        JSONObject water = snapshot.optJSONObject("water");
        int waterTotal = water == null ? 0 : water.optInt("total", 0);
        int waterGoal = water == null ? 2500 : water.optInt("goal", 2500);
        int waterPercent = waterGoal > 0 ? Math.min(100, Math.round((waterTotal * 100f) / waterGoal)) : 0;
        views.setTextViewText(R.id.widget_water_text, waterTotal + "/" + waterGoal + " מ\"ל");
        views.setProgressBar(R.id.widget_water_progress_bar, 100, waterPercent, false);
        views.setViewVisibility(R.id.widget_water_add_button, View.VISIBLE);

        Intent addWaterIntent = new Intent(context, HabitWidgetProvider.class);
        addWaterIntent.setAction(ACTION_ADD_WATER);
        PendingIntent addWaterPending = PendingIntent.getBroadcast(context, 999999, addWaterIntent, immutableFlags);
        views.setOnClickPendingIntent(R.id.widget_water_add_button, addWaterPending);

        return views;
    }
}
