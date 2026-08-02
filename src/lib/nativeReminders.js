import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// מזהה קבוע לתזכורת היומית, כדי שנוכל לבטל/להחליף אותה בלי לצבור כפילויות
const DAILY_REMINDER_ID = 1001;

export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function requestNativeNotificationPermission() {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

// מתזמן תזכורת יומית חוזרת בשעה שנבחרה, ישירות דרך מערכת ההפעלה של הטלפון -
// כך שהיא תופיע גם כשהאפליקציה סגורה לגמרי (בשונה מטיימר ב-JS שרץ רק כשהאפליקציה פתוחה).
export async function scheduleNativeDailyReminder(reminderTime) {
  const [hourStr, minuteStr] = reminderTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: 'זמן להתעורר! משימות מחכות לך ⏳',
        body: 'בדוק/י אילו הרגלים עדיין לא סימנת היום ב-HabitAI.',
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true }
      }
    ]
  });
}

export async function cancelNativeDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
}
