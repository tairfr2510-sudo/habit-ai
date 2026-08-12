import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { getTodayStr, isHabitScheduledOnDate } from '../utils/habitUtils';

// פלאגין נייטיבי קטן (נכתב בפרויקט האנדרואיד עצמו, ראה HabitWidgetPlugin.java) שמבקש
// מהוויג'ט להתרענן מיידית אחרי כתיבת snapshot חדש - בלי זה הוויג'ט מתעדכן רק
// בכל updatePeriodMillis (מינימום 30 דקות לפי מגבלת אנדרואיד).
const HabitWidget = registerPlugin('HabitWidget');

const SNAPSHOT_KEY = 'widget_snapshot';
const PENDING_KEY = 'widget_pending_actions';
const MAX_WIDGET_HABITS = 4;

export const isNativePlatform = () => Capacitor.isNativePlatform();

// כותב לנתונים שהוויג'ט הנייטיבי קורא ישירות (דרך SharedPreferences של @capacitor/preferences),
// ומבקש רענון מיידי. נקרא בכל שינוי ב-habits/waterStats.
export async function syncWidgetSnapshot(habits, waterStats) {
  if (!isNativePlatform()) return;
  const today = getTodayStr();

  const dueHabits = (habits || []).filter(h => {
    const freqType = h.frequency?.type || h.frequency;
    return freqType === 'weekly' || isHabitScheduledOnDate(h, today);
  });

  const widgetHabits = dueHabits.slice(0, MAX_WIDGET_HABITS).map(h => ({
    id: h.id,
    name: h.name,
    done: !!(h.logs && h.logs[today])
  }));

  const waterTotal = (waterStats?.entries?.[today] || []).reduce((sum, e) => sum + e.amount, 0);

  const snapshot = {
    date: today,
    habits: widgetHabits,
    totalHabits: dueHabits.length,
    doneHabits: dueHabits.filter(h => h.logs && h.logs[today]).length,
    water: { total: waterTotal, goal: Number(waterStats?.goal) || 2500 }
  };

  await Preferences.set({ key: SNAPSHOT_KEY, value: JSON.stringify(snapshot) });
  try {
    await HabitWidget.refresh();
  } catch {
    // הפלאגין לא זמין (למשל בדפדפן פיתוח בתוך המכשיר לפני build נייטיבי) - מתעלמים.
  }
}

// פעולות שבוצעו ישירות מהוויג'ט (סימון הרגל / הוספת מים) בזמן שהאפליקציה לא הייתה
// פתוחה. הצד הנייטיבי רק צובר אותן ב-Preferences; היישום בפועל על ה-state האמיתי
// קורה כאן, כשהאפליקציה נפתחת, כדי לא לשכפל את לוגיקת ההרגלים/סטריקים בצד הנייטיבי.
export async function drainWidgetPendingActions() {
  if (!isNativePlatform()) return [];
  const { value } = await Preferences.get({ key: PENDING_KEY });
  if (!value) return [];
  await Preferences.remove({ key: PENDING_KEY });
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
