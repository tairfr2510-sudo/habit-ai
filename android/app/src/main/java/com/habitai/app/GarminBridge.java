package com.habitai.app;

import android.content.Context;
import android.util.Log;

import com.garmin.android.connectiq.ConnectIQ;
import com.garmin.android.connectiq.IQApp;
import com.garmin.android.connectiq.IQDevice;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * גשר לשעון גרמין (אפליקציית Connect IQ שבתיקיית garmin/ בשורש הפרויקט).
 *
 * השעון מקבל בדיוק את אותו snapshot שהוויג'ט במסך הבית מציג (ההרגלים
 * הפתוחים להיום, ראה syncWidgetSnapshot בצד ה-JS), כך שאין לוגיקת הרגלים
 * נוספת לתחזק. סימון הרגל בשעון מגיע לכאן כהודעה, ומטופל בדיוק כמו לחיצה
 * בוויג'ט: עדכון אופטימי של ה-snapshot ופעולה ממתינה שה-JS מיישם על ה-state
 * האמיתי (ראה HabitWidgetProvider.setHabitDone).
 *
 * התקשורת עוברת דרך אפליקציית Garmin Connect בטלפון. אם היא לא מותקנת,
 * האתחול פשוט נכשל בשקט והשאר ממשיך לעבוד כרגיל.
 */
final class GarminBridge {

    // חייב להתאים ל-id שב-garmin/manifest.xml (שם הוא בלי מקפים)
    private static final String WATCH_APP_ID = "d0a31b02-014c-44d0-b79f-9abe45e201d8";

    private static final String TAG = "HabitAI-Garmin";

    private static final IQApp watchApp = new IQApp(WATCH_APP_ID);
    private static ConnectIQ connectIQ;
    private static Context appContext;
    private static boolean ready = false;

    private GarminBridge() {}

    static void init(Context context) {
        if (connectIQ != null) return;
        appContext = context.getApplicationContext();
        connectIQ = ConnectIQ.getInstance(appContext, ConnectIQ.IQConnectType.WIRELESS);
        connectIQ.initialize(appContext, false, new ConnectIQ.ConnectIQListener() {
            @Override
            public void onSdkReady() {
                Log.i(TAG, "SDK ready");
                ready = true;
                registerForWatchMessages();
                sendSnapshot();
            }

            @Override
            public void onInitializeError(ConnectIQ.IQSdkErrorStatus status) {
                Log.w(TAG, "init error: " + status);
                ready = false;
            }

            @Override
            public void onSdkShutDown() {
                ready = false;
            }
        });
    }

    private static void registerForWatchMessages() {
        try {
            for (IQDevice device : connectIQ.getKnownDevices()) {
                Log.i(TAG, "registering device " + device.getFriendlyName());
                connectIQ.registerForAppEvents(device, watchApp, GarminBridge::onWatchMessage);
            }
        } catch (Exception e) {
            Log.w(TAG, "register failed", e);
            // אין שעון מצומד / Garmin Connect לא זמין - אין מה לעשות
        }
    }

    /** שולח לשעון את ה-snapshot העדכני של הוויג'ט. בטוח לקרוא גם לפני שה-SDK מוכן. */
    static void sendSnapshot() {
        if (!ready || appContext == null) return;
        JSONObject snapshot = HabitWidgetProvider.readSnapshot(appContext);
        if (snapshot == null) return;

        Map<String, Object> message = toWatchMessage(snapshot);
        try {
            for (IQDevice device : connectIQ.getConnectedDevices()) {
                connectIQ.sendMessage(device, watchApp, message, (d, app, status) -> Log.i(TAG, "snapshot to " + d.getFriendlyName() + ": " + status));
            }
        } catch (Exception e) {
            Log.w(TAG, "send failed", e);
            // השעון לא מחובר כרגע - הוא יקבל snapshot בשינוי הבא
        }
    }

    // מבנה מצומצם לשעון (הודעות Connect IQ מוגבלות בגודל): תאריך ורשימת הרגלים
    private static Map<String, Object> toWatchMessage(JSONObject snapshot) {
        Map<String, Object> message = new HashMap<>();
        message.put("date", snapshot.optString("date", ""));
        List<Object> habits = new ArrayList<>();
        JSONArray source = snapshot.optJSONArray("habits");
        if (source != null) {
            for (int i = 0; i < source.length(); i++) {
                JSONObject habit = source.optJSONObject(i);
                if (habit == null) continue;
                Map<String, Object> item = new HashMap<>();
                item.put("id", habit.optString("id"));
                item.put("name", habit.optString("name"));
                item.put("done", habit.optBoolean("done", false));
                habits.add(item);
            }
        }
        message.put("habits", habits);
        return message;
    }

    private static void onWatchMessage(IQDevice device, IQApp app, List<Object> data, ConnectIQ.IQMessageStatus status) {
        Log.i(TAG, "message from watch: " + status + " " + data);
        if (status != ConnectIQ.IQMessageStatus.SUCCESS || data == null) return;
        for (Object item : data) {
            if (!(item instanceof Map)) continue;
            Map<?, ?> message = (Map<?, ?>) item;
            if (!"toggleHabit".equals(message.get("type"))) continue;

            Object habitId = message.get("habitId");
            Object date = message.get("date");
            Object done = message.get("done");
            if (!(habitId instanceof String) || !(date instanceof String) || !(done instanceof Boolean)) continue;

            HabitWidgetProvider.setHabitDone(appContext, (String) habitId, (String) date, (Boolean) done);
        }
        HabitWidgetPlugin.notifyPendingActions();
    }
}
