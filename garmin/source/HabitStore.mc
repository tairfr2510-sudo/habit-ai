import Toybox.Application;
import Toybox.Lang;
import Toybox.Time;
import Toybox.Time.Gregorian;

// קריאה מהאחסון המקומי בשעון: ה-snapshot האחרון שהגיע מהטלפון (אותו snapshot
// שהוויג'ט במסך הבית מציג), ותור של סימונים שבוצעו בשעון ועוד לא אושרו ע"י
// snapshot חדש מהטלפון. זמין גם ל-glance - לכן כאן רק קריאה (כתיבה ב-HabitSync).
(:glance)
module HabitStore {
    const SNAPSHOT_KEY = "snapshot";
    const PENDING_KEY = "pending";

    // התאריך של היום בפורמט של האפליקציה (YYYY-MM-DD)
    function todayStr() as String {
        var info = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        return Lang.format("$1$-$2$-$3$", [
            info.year,
            (info.month as Number).format("%02d"),
            info.day.format("%02d")
        ]);
    }

    function getSnapshot() as Dictionary? {
        return Application.Storage.getValue(SNAPSHOT_KEY) as Dictionary?;
    }

    // ה-snapshot חסר או מיום אחר - האפליקציה בטלפון לא נפתחה מאז חצות
    function isStale() as Boolean {
        var snapshot = getSnapshot();
        return snapshot == null || !todayStr().equals(snapshot["date"]);
    }

    function getHabits() as Array {
        var snapshot = getSnapshot();
        if (snapshot == null || !(snapshot["habits"] instanceof Array)) {
            return [];
        }
        return snapshot["habits"] as Array;
    }

    function getPending() as Array {
        var pending = Application.Storage.getValue(PENDING_KEY);
        return pending instanceof Array ? pending as Array : [];
    }

    function findPending(pending as Array, id, date) as Dictionary? {
        for (var i = 0; i < pending.size(); i++) {
            var entry = pending[i] as Dictionary;
            if (entry["id"].equals(id) && entry["date"].equals(date)) {
                return entry;
            }
        }
        return null;
    }

    // מצב ההרגל כפי שמוצג בשעון: סימון מקומי שעוד לא אושר גובר על ה-snapshot
    function isDone(habit as Dictionary) as Boolean {
        var snapshot = getSnapshot();
        if (snapshot != null) {
            var entry = findPending(getPending(), habit["id"], snapshot["date"]);
            if (entry != null) {
                return entry["done"] == true;
            }
        }
        return habit["done"] == true;
    }

    // [בוצעו, סה"כ]
    function getCounts() as Array<Number> {
        var habits = getHabits();
        var done = 0;
        for (var i = 0; i < habits.size(); i++) {
            if (isDone(habits[i] as Dictionary)) {
                done++;
            }
        }
        return [done, habits.size()];
    }
}
