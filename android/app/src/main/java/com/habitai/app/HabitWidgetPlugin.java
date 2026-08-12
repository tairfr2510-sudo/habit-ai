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
 */
@CapacitorPlugin(name = "HabitWidget")
public class HabitWidgetPlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        HabitWidgetProvider.refreshAllWidgets(getContext());
        call.resolve(new JSObject());
    }
}
