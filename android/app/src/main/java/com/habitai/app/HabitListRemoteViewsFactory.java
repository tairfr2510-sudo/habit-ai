package com.habitai.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StrikethroughSpan;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * מזין את ה-ListView הגולל בתוך הוויג'ט מתוך אותו snapshot שנכתב ב-SharedPreferences
 * (ראה HabitWidgetProvider). כל עוד יש יותר הרגלים ממה שנכנס בגובה הוויג'ט, הרשימה
 * גוללת במקום לחתוך אותם ל-"+N נוספים" כמו בגרסה הקודמת.
 */
public class HabitListRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private final Context context;
    private final List<JSONObject> habits = new ArrayList<>();

    HabitListRemoteViewsFactory(Context context) {
        this.context = context;
    }

    @Override
    public void onCreate() {
        loadHabits();
    }

    @Override
    public void onDataSetChanged() {
        loadHabits();
    }

    @Override
    public void onDestroy() {
        habits.clear();
    }

    private void loadHabits() {
        habits.clear();
        JSONObject snapshot = HabitWidgetProvider.readSnapshot(context);
        if (snapshot == null) return;
        JSONArray array = snapshot.optJSONArray("habits");
        if (array == null) return;
        for (int i = 0; i < array.length(); i++) {
            JSONObject habit = array.optJSONObject(i);
            if (habit != null) habits.add(habit);
        }
    }

    @Override
    public int getCount() {
        return habits.size();
    }

    @Override
    public RemoteViews getViewAt(int position) {
        RemoteViews item = new RemoteViews(context.getPackageName(), R.layout.widget_habit_list_item);
        JSONObject habit = habits.get(position);
        String habitId = habit.optString("id");
        String name = habit.optString("name");
        boolean isDone = habit.optBoolean("done", false);

        item.setImageViewResource(R.id.widget_list_item_icon, isDone ? R.drawable.widget_check_on : R.drawable.widget_check_off);
        item.setInt(R.id.widget_list_item_dot, "setColorFilter", HabitWidgetProvider.categoryColor(context, habit.optString("category")));

        SpannableString label = new SpannableString(name);
        if (isDone) {
            label.setSpan(new StrikethroughSpan(), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        item.setTextViewText(R.id.widget_list_item_text, label);
        item.setTextColor(
            R.id.widget_list_item_text,
            isDone ? context.getColor(R.color.widget_text_muted) : context.getColor(R.color.widget_text_primary)
        );

        Intent fillInIntent = new Intent();
        fillInIntent.putExtra("habit_id", habitId);
        fillInIntent.setData(Uri.parse("habitwidget://toggle/" + habitId));
        item.setOnClickFillInIntent(R.id.widget_list_item_root, fillInIntent);

        return item;
    }

    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    @Override
    public int getViewTypeCount() {
        return 1;
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public boolean hasStableIds() {
        return false;
    }
}
