import Toybox.Application;
import Toybox.Communications;
import Toybox.Lang;

// סנכרון מול הטלפון (GarminBridge.java בצד האנדרואיד).
//
// סימון בשעון נשמר קודם בתור מקומי ורק אז נשלח לטלפון. הוא נמחק מהתור רק
// כשמגיע snapshot מהטלפון שכבר כולל אותו - כך שאם האפליקציה בטלפון לא רצה
// בזמן השליחה וההודעה אבדה, הסימון נשלח שוב בפעם הבאה שמגיע snapshot.
module HabitSync {

    function setDone(id as String, done as Boolean) as Void {
        var snapshot = HabitStore.getSnapshot();
        if (snapshot == null) {
            return;
        }
        var date = snapshot["date"] as String;
        var pending = HabitStore.getPending();
        var updated = [] as Array;
        for (var i = 0; i < pending.size(); i++) {
            var entry = pending[i] as Dictionary;
            if (!(entry["id"].equals(id) && entry["date"].equals(date))) {
                updated.add(entry);
            }
        }
        var entry = { "id" => id, "date" => date, "done" => done };
        updated.add(entry);
        Application.Storage.setValue(HabitStore.PENDING_KEY, updated);
        transmit(entry);
    }

    // שולח שוב את כל מה שעוד לא אושר (נקרא כשהאפליקציה בשעון נפתחת)
    function flushPending() as Void {
        var pending = HabitStore.getPending();
        for (var i = 0; i < pending.size(); i++) {
            transmit(pending[i] as Dictionary);
        }
    }

    // snapshot חדש מהטלפון: שומרים אותו, מוחקים מהתור סימונים שהטלפון כבר קלט
    // (או שההרגל כבר לא ברשימה), ושולחים שוב את מה שעדיין לא נקלט. סימון מיום
    // קודם נשלח פעם אחרונה ונמחק - אין snapshot שיכול לאשר אותו.
    function onSnapshot(data) as Void {
        if (!(data instanceof Dictionary) || !(data["habits"] instanceof Array)) {
            return;
        }
        Application.Storage.setValue(HabitStore.SNAPSHOT_KEY, data);

        var date = data["date"];
        var habits = data["habits"] as Array;
        var pending = HabitStore.getPending();
        var remaining = [] as Array;
        for (var i = 0; i < pending.size(); i++) {
            var entry = pending[i] as Dictionary;
            if (!entry["date"].equals(date)) {
                transmit(entry);
                continue;
            }
            var habit = findHabit(habits, entry["id"]);
            if (habit != null && (habit["done"] == true) != (entry["done"] == true)) {
                remaining.add(entry);
                transmit(entry);
            }
        }
        Application.Storage.setValue(HabitStore.PENDING_KEY, remaining);
    }

    function findHabit(habits as Array, id) as Dictionary? {
        for (var i = 0; i < habits.size(); i++) {
            var habit = habits[i] as Dictionary;
            if (habit["id"].equals(id)) {
                return habit;
            }
        }
        return null;
    }

    function transmit(entry as Dictionary) as Void {
        Communications.transmit({
            "type" => "toggleHabit",
            "habitId" => entry["id"],
            "date" => entry["date"],
            "done" => entry["done"]
        }, null, new TransmitListener());
    }
}

// אין צורך לטפל בתוצאה - כשל נפתר ע"י השליחה החוזרת ב-onSnapshot / flushPending
class TransmitListener extends Communications.ConnectionListener {
    function initialize() {
        ConnectionListener.initialize();
    }

    function onComplete() as Void {
    }

    function onError() as Void {
    }
}
