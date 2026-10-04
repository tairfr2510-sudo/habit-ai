import Toybox.Graphics;
import Toybox.Lang;
import Toybox.WatchUi;

// בונה את המסך המלא המתאים למצב הנוכחי: רשימת הרגלים לסימון, או הודעה
// כשאין נתונים עדכניים מהטלפון / אין משימות להיום.
function buildMainView() as Array {
    if (HabitStore.isStale()) {
        return [new MessageView("פתח את HabitAI", "בטלפון כדי לעדכן"), new WatchUi.BehaviorDelegate()];
    }
    if (HabitStore.getHabits().size() == 0) {
        return [new MessageView("אין משימות", "להיום"), new WatchUi.BehaviorDelegate()];
    }
    var menu = new HabitMenu();
    return [menu, new HabitMenuDelegate(menu)];
}

// רשימת ההרגלים הפתוחים להיום, כל אחד עם תיבת סימון. רשימה רגילה של המערכת
// (CheckboxMenu), כך שגלילה, מגע וכפתורים עובדים מעצמם.
class HabitMenu extends WatchUi.CheckboxMenu {
    private var _ids as Array = [];

    function initialize() {
        CheckboxMenu.initialize({ :title => "" });
        var habits = HabitStore.getHabits();
        for (var i = 0; i < habits.size(); i++) {
            var habit = habits[i] as Dictionary;
            _ids.add(habit["id"]);
            addItem(new WatchUi.CheckboxMenuItem(habit["name"] as String, null, habit["id"], HabitStore.isDone(habit), null));
        }
        updateTitle();
    }

    function updateTitle() as Void {
        var counts = HabitStore.getCounts();
        setTitle(counts[0] + "/" + counts[1]);
    }

    // מעדכן את המסך אחרי snapshot חדש בלי לאבד את מיקום הגלילה. מחזיר false
    // אם רשימת ההרגלים עצמה השתנתה וצריך לבנות את המסך מחדש.
    function refresh() as Boolean {
        if (HabitStore.isStale()) {
            return false;
        }
        var habits = HabitStore.getHabits();
        if (habits.size() != _ids.size()) {
            return false;
        }
        for (var i = 0; i < habits.size(); i++) {
            var habit = habits[i] as Dictionary;
            if (!habit["id"].equals(_ids[i])) {
                return false;
            }
            var item = getItem(i);
            if (item instanceof WatchUi.CheckboxMenuItem) {
                item.setChecked(HabitStore.isDone(habit));
            }
        }
        updateTitle();
        return true;
    }
}

class HabitMenuDelegate extends WatchUi.Menu2InputDelegate {
    private var _menu as HabitMenu;

    function initialize(menu as HabitMenu) {
        Menu2InputDelegate.initialize();
        _menu = menu;
    }

    function onSelect(item as WatchUi.MenuItem) as Void {
        if (item instanceof WatchUi.CheckboxMenuItem) {
            HabitSync.setDone(item.getId() as String, item.isChecked());
            _menu.updateTitle();
            WatchUi.requestUpdate();
        }
    }
}

// מסך הודעה פשוט בשתי שורות
class MessageView extends WatchUi.View {
    private var _title as String;
    private var _subtitle as String;

    function initialize(title as String, subtitle as String) {
        View.initialize();
        _title = title;
        _subtitle = subtitle;
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var centerX = dc.getWidth() / 2;
        var centerY = dc.getHeight() / 2;
        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(centerX, centerY - 25, Graphics.FONT_MEDIUM, _title, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(centerX, centerY + 25, Graphics.FONT_SMALL, _subtitle, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }
}
