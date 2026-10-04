import Toybox.Application;
import Toybox.Lang;

// נתוני דוגמה לסימולטור בלבד (בנייה רגילה = debug). בבנייה לשעון (-r) הפונקציה
// ריקה, והנתונים מגיעים רק מהטלפון.
(:debug, :glance)
function seedDebugSnapshot() as Void {
    if (Application.Storage.getValue(HabitStore.SNAPSHOT_KEY) != null) {
        return;
    }
    Application.Storage.setValue(HabitStore.SNAPSHOT_KEY, {
        "date" => HabitStore.todayStr(),
        "habits" => [
            { "id" => "1", "name" => "שתיית 3 ליטר מים", "done" => true },
            { "id" => "2", "name" => "מדיטציה 10 דקות", "done" => false },
            { "id" => "3", "name" => "אימון כוח", "done" => false }
        ]
    });
}

(:release, :glance)
function seedDebugSnapshot() as Void {
}
