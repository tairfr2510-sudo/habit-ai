package com.habitai.app;

import android.content.Intent;
import android.widget.RemoteViewsService;

/**
 * מספק ל-ListView בתוך הוויג'ט את ה-RemoteViewsFactory שמזין אותו - זהו מנגנון
 * האנדרואיד הרשמי לרשימה גוללת בתוך App Widget (ראה HabitListRemoteViewsFactory).
 */
public class HabitWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new HabitListRemoteViewsFactory(getApplicationContext());
    }
}
