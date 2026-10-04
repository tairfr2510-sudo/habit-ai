package com.habitai.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * גשר דק בין ה-JS לבין וויג'ט מסך הבית (HabitWidgetProvider): מבקש רענון
 * מיידי של הוויג'ט אחרי שה-JS כתב snapshot חדש ל-Preferences, כדי שהעדכון
 * לא יחכה למחזור updatePeriodMillis (מינימום 30 דקות לפי מגבלת אנדרואיד).
 * אותו snapshot נשלח גם לשעון הגרמין (GarminBridge).
 */
@CapacitorPlugin(name = "HabitWidget")
public class HabitWidgetPlugin extends Plugin {

    private static HabitWidgetPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        HabitWidgetProvider.refreshAllWidgets(getContext());
        GarminBridge.sendSnapshot();
        call.resolve(new JSObject());
    }

    /**
     * מודיע ל-JS שנוספו פעולות ממתינות (למשל סימון מהשעון בזמן שהאפליקציה
     * פתוחה), כדי שייושמו מיד ולא רק בחזרה הבאה של האפליקציה לחזית.
     */
    static void notifyPendingActions() {
        if (instance != null) instance.notifyListeners("pendingActions", new JSObject());
    }
}
