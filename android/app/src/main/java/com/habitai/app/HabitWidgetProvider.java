package com.habitai.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StrikethroughSpan;
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
 */
public class HabitWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String SNAPSHOT_KEY = "widget_snapshot";
    private static final String PENDING_KEY = "widget_pending_actions";

    static final String ACTION_TOGGLE_HABIT = "com.habitai.app.widget.ACTION_TOGGLE_HABIT";
    static final String ACTION_ADD_WATER = "com.habitai.app.widget.ACTION_ADD_WATER";
    private static final int WATER_QUICK_ADD_ML = 250;

    private static final int[] ROW_IDS = {
        R.id.widget_habit_row_1, R.id.widget_habit_row_2, R.id.widget_habit_row_3, R.id.widget_habit_row_4
    };
    private static final int[] ICON_IDS = {
        R.id.widget_habit_icon_1, R.id.widget_habit_icon_2, R.id.widget_habit_icon_3, R.id.widget_habit_icon_4
    };
    private static final int[] DOT_IDS = {
        R.id.widget_habit_dot_1, R.id.widget_habit_dot_2, R.id.widget_habit_dot_3, R.id.widget_habit_dot_4
    };
    private static final int[] TEXT_IDS = {
        R.id.widget_habit_text_1, R.id.widget_habit_text_2, R.id.widget_habit_text_3, R.id.widget_habit_text_4
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        RemoteViews views = buildRemoteViews(context);
        for (int appWidgetId : appWidgetIds) {
            appWidgetManager.updateAppWidget(appWidgetId, views);
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

    private static JSONObject readSnapshot(Context context) {
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
        RemoteViews views = buildRemoteViews(context);
        for (int id : ids) {
            manager.updateAppWidget(id, views);
        }
    }

    private static int categoryColor(Context context, String category) {
        if ("mind".equals(category)) return context.getColor(R.color.widget_category_mind);
        if ("productivity".equals(category)) return context.getColor(R.color.widget_category_productivity);
        if ("social".equals(category)) return context.getColor(R.color.widget_category_social);
        return context.getColor(R.color.widget_category_health);
    }

    private static RemoteViews buildRemoteViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.habit_widget);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        Intent openAppIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent openAppPending = null;
        if (openAppIntent != null) {
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openAppPending = PendingIntent.getActivity(context, 0, openAppIntent, pendingFlags);
            views.setOnClickPendingIntent(R.id.widget_header, openAppPending);
            views.setOnClickPendingIntent(R.id.widget_more_row, openAppPending);
        }

        JSONObject snapshot = readSnapshot(context);
        if (snapshot == null) {
            views.setTextViewText(R.id.widget_date, "");
            views.setTextViewText(R.id.widget_done_count, "—");
            views.setTextViewText(R.id.widget_streak_count, "0");
            views.setProgressBar(R.id.widget_progress_bar, 100, 0, false);
            views.setViewVisibility(R.id.widget_more_row, View.GONE);
            views.setTextViewText(R.id.widget_water_text, "פתחו את HabitAI כדי להתחיל");
            views.setProgressBar(R.id.widget_water_progress_bar, 100, 0, false);
            views.setViewVisibility(R.id.widget_water_add_button, View.GONE);
            for (int rowId : ROW_IDS) {
                views.setViewVisibility(rowId, View.GONE);
            }
            return views;
        }

        try {
            int total = snapshot.optInt("totalHabits", 0);
            int done = snapshot.optInt("doneHabits", 0);
            int percent = total > 0 ? Math.min(100, Math.round((done * 100f) / total)) : 0;

            views.setTextViewText(R.id.widget_date, snapshot.optString("dateLabel", ""));
            views.setTextViewText(R.id.widget_done_count, done + "/" + total);
            views.setTextViewText(R.id.widget_streak_count, String.valueOf(snapshot.optInt("bestStreak", 0)));
            views.setProgressBar(R.id.widget_progress_bar, 100, percent, false);

            JSONArray habits = snapshot.optJSONArray("habits");
            int count = habits == null ? 0 : habits.length();
            for (int i = 0; i < ROW_IDS.length; i++) {
                if (habits == null || i >= count) {
                    views.setViewVisibility(ROW_IDS[i], View.GONE);
                    continue;
                }

                JSONObject habit = habits.getJSONObject(i);
                String habitId = habit.optString("id");
                String name = habit.optString("name");
                boolean isDone = habit.optBoolean("done", false);

                views.setViewVisibility(ROW_IDS[i], View.VISIBLE);
                views.setImageViewResource(ICON_IDS[i], isDone ? R.drawable.widget_check_on : R.drawable.widget_check_off);
                views.setInt(DOT_IDS[i], "setColorFilter", categoryColor(context, habit.optString("category")));

                SpannableString label = new SpannableString(name);
                if (isDone) {
                    label.setSpan(new StrikethroughSpan(), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
                views.setTextViewText(TEXT_IDS[i], label);
                views.setTextColor(TEXT_IDS[i], isDone ? context.getColor(R.color.widget_text_muted) : context.getColor(R.color.widget_text_primary));

                Intent toggleIntent = new Intent(context, HabitWidgetProvider.class);
                toggleIntent.setAction(ACTION_TOGGLE_HABIT);
                toggleIntent.setData(Uri.parse("habitwidget://toggle/" + habitId));
                toggleIntent.putExtra("habit_id", habitId);
                PendingIntent togglePending = PendingIntent.getBroadcast(context, habitId.hashCode(), toggleIntent, pendingFlags);
                views.setOnClickPendingIntent(ROW_IDS[i], togglePending);
            }

            int extra = total - count;
            if (extra > 0 && openAppPending != null) {
                views.setViewVisibility(R.id.widget_more_row, View.VISIBLE);
                views.setTextViewText(R.id.widget_more_row, "+" + extra + " הרגלים נוספים");
            } else {
                views.setViewVisibility(R.id.widget_more_row, View.GONE);
            }

            JSONObject water = snapshot.optJSONObject("water");
            int waterTotal = water == null ? 0 : water.optInt("total", 0);
            int waterGoal = water == null ? 2500 : water.optInt("goal", 2500);
            int waterPercent = waterGoal > 0 ? Math.min(100, Math.round((waterTotal * 100f) / waterGoal)) : 0;
            views.setTextViewText(R.id.widget_water_text, waterTotal + "/" + waterGoal + " מ\"ל");
            views.setProgressBar(R.id.widget_water_progress_bar, 100, waterPercent, false);
            views.setViewVisibility(R.id.widget_water_add_button, View.VISIBLE);

            Intent addWaterIntent = new Intent(context, HabitWidgetProvider.class);
            addWaterIntent.setAction(ACTION_ADD_WATER);
            PendingIntent addWaterPending = PendingIntent.getBroadcast(context, 999999, addWaterIntent, pendingFlags);
            views.setOnClickPendingIntent(R.id.widget_water_add_button, addWaterPending);
        } catch (JSONException e) {
            // במקרה של JSON פגום משאירים את מה שכבר הוגדר למעלה
        }

        return views;
    }
}
