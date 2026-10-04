import Toybox.Graphics;
import Toybox.Lang;
import Toybox.WatchUi;

// השורה ברשימת ה-glances: כמה הרגלים בוצעו היום ופס התקדמות
(:glance)
class HabitGlanceView extends WatchUi.GlanceView {
    function initialize() {
        GlanceView.initialize();
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var width = dc.getWidth();
        var height = dc.getHeight();
        var stale = HabitStore.isStale();
        var counts = HabitStore.getCounts();
        var done = counts[0];
        var total = counts[1];

        // הספירה צמודה לכותרת ולא לקצה הימני, שנחתך במסך העגול
        var title = "HABITAI";
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(0, height * 0.3, Graphics.FONT_GLANCE, title,
            Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER);

        var status = stale ? "--" : done + "/" + total;
        var titleWidth = dc.getTextWidthInPixels(title + "  ", Graphics.FONT_GLANCE);
        dc.setColor(done == total && total > 0 && !stale ? Graphics.COLOR_GREEN : Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(titleWidth, height * 0.3, Graphics.FONT_GLANCE, status,
            Graphics.TEXT_JUSTIFY_LEFT | Graphics.TEXT_JUSTIFY_VCENTER);

        var barY = height * 0.7;
        var barHeight = 6;
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.fillRoundedRectangle(0, barY, width, barHeight, barHeight / 2);
        if (!stale && total > 0 && done > 0) {
            dc.setColor(done == total ? Graphics.COLOR_GREEN : 0x6366F1, Graphics.COLOR_TRANSPARENT);
            dc.fillRoundedRectangle(0, barY, width * done / total, barHeight, barHeight / 2);
        }
    }
}
