import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// מזהה קבוע לתזכורת היומית, כדי שנוכל לבטל/להחליף אותה בלי לצבור כפילויות
const DAILY_REMINDER_ID = 1001;

export const isNativePlatform = () => Capacitor.isNativePlatform();

export async function requestNativeNotificationPermission() {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

// מתזמן תזכורת לשעה שנבחרה, ישירות דרך מערכת ההפעלה של הטלפון - כך שהיא
// תופיע גם כשהאפליקציה סגורה לגמרי (בשונה מטיימר ב-JS שרץ רק כשהאפליקציה פתוחה).
//
// בכוונה זו תזכורת חד-פעמית (schedule.at) לקרות הבאה של השעה הנבחרת, ולא תזכורת
// חוזרת (repeats) - כי תזכורת חוזרת מקבלת תוכן קבוע בזמן התזמון ואי אפשר לעדכן
// אותה בזמן שהיא "מחכה" בתוך מערכת ההפעלה. כדי שהתוכן ישקף את ההרגלים שעוד לא
// הושלמו, האפליקציה קוראת לפונקציה הזו מחדש (מבטלת ומתזמנת מחדש) בכל פעם שרשימת
// ההרגלים או מצב ההשלמה שלהם משתנה - כך שבזמן שהתזכורת בפועל מגיעה, היא כבר
// מכילה את התמונה העדכנית ביותר שהייתה זמינה. המשמעות: התזכורת תישאר מדויקת כל
// עוד האפליקציה נפתחת מדי פעם באותו יום; אם היא לא נפתחת בכלל, לא תתוזמן תזכורת
// חדשה עד שהיא תיפתח שוב.
export async function scheduleNativeDailyReminder(reminderTime, message) {
  const [hourStr, minuteStr] = reminderTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);

  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: message?.title || 'זמן להתעורר! משימות מחכות לך ⏳',
        body: message?.body || 'בדוק/י אילו הרגלים עדיין לא סימנת היום ב-HabitAI.',
        schedule: { at: next, allowWhileIdle: true }
      }
    ]
  });
}

export async function cancelNativeDailyReminder() {
  await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
}
