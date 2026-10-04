import Toybox.Application;
import Toybox.Communications;
import Toybox.Lang;
import Toybox.WatchUi;

// אפליקציית השעון של HabitAI: glance עם ההתקדמות של היום, ובלחיצה עליו
// רשימת ההרגלים הפתוחים להיום עם אפשרות לסמן. הנתונים מגיעים מהאפליקציה
// בטלפון (GarminBridge.java) - בשעון עצמו אין לוגיקת הרגלים.
(:glance)
class HabitApp extends Application.AppBase {
    private var _menu = null;

    function initialize() {
        AppBase.initialize();
    }

    function getInitialView() {
        seedDebugSnapshot();
        Communications.registerForPhoneAppMessages(method(:onPhoneMessage));
        HabitSync.flushPending();
        var view = buildMainView();
        _menu = view[0] instanceof HabitMenu ? view[0] : null;
        return view;
    }

    function getGlanceView() {
        seedDebugSnapshot();
        return [new HabitGlanceView()];
    }

    // snapshot חדש מהטלפון: מעדכנים את הרשימה במקום אם אפשר, אחרת בונים מחדש
    function onPhoneMessage(message as Communications.PhoneAppMessage) as Void {
        HabitSync.onSnapshot(message.data);
        if (_menu == null || !_menu.refresh()) {
            var view = buildMainView();
            _menu = view[0] instanceof HabitMenu ? view[0] : null;
            WatchUi.switchToView(view[0], view[1], WatchUi.SLIDE_IMMEDIATE);
        }
        WatchUi.requestUpdate();
    }
}
