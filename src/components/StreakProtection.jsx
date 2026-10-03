import { useState } from 'react';
import { ShieldCheck, Snowflake, MessageSquareText, Activity, X } from 'lucide-react';
import {
  getLastNDays,
  getTodayStr,
  formatDateToHebrew,
  getDailyStreakDayStatus,
  countFreeDaysInMonth,
  FREE_DAYS_PER_MONTH
} from '../utils/habitUtils';

// כמה ימים אחורה אפשר עוד להגן על הרצף
const PROTECTION_WINDOW_DAYS = 7;

// כרטיס "הגנת רצף": מציג את הימים האחרונים שבהם לא עמדת ב-80%, ומאפשר לכל
// אחד מהם לנצל יום חופש מהמכסה החודשית או לשלוח תירוץ שה-AI מחליט עליו.
// מוצג רק כשיש יום בסיכון או יום שכבר הוגן בחלון הזמן.
export default function StreakProtection({ habits, streakExemptions, applyFreeDay, removeExemption, submitStreakExcuse }) {
  const [openExcuseDate, setOpenExcuseDate] = useState(null);
  const [excuseText, setExcuseText] = useState('');
  const [pendingDate, setPendingDate] = useState(null);
  const [lastResult, setLastResult] = useState(null); // { dateStr, error }

  const today = getTodayStr();
  const days = getLastNDays(PROTECTION_WINDOW_DAYS).reverse()
    .map(dateStr => ({ dateStr, status: getDailyStreakDayStatus(habits, dateStr), exemption: streakExemptions[dateStr] }))
    .filter(({ status, exemption }) => exemption || (status.due > 0 && !status.passed));

  if (days.length === 0) return null;

  const freeDaysLeft = FREE_DAYS_PER_MONTH - countFreeDaysInMonth(streakExemptions, today);

  const handleSubmitExcuse = async (dateStr) => {
    if (!excuseText.trim()) return;
    setPendingDate(dateStr);
    setLastResult(null);
    const result = await submitStreakExcuse(dateStr, excuseText.trim());
    setPendingDate(null);
    if (result.error) {
      setLastResult({ dateStr, error: result.error });
    } else {
      setOpenExcuseDate(null);
      setExcuseText('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <ShieldCheck className="text-sky-500 bg-sky-50 dark:bg-sky-900/30 p-2 rounded-xl" size={40} />
          הגנת רצף
        </h3>
        <span className="text-sm font-medium bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 py-1.5 px-4 rounded-full flex items-center gap-1.5">
          <Snowflake size={16} /> נשארו {Math.max(0, freeDaysLeft)} ימי חופש החודש
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        ימים שבהם השלמת פחות מ-80% מהמשימות. אפשר להשתמש ביום חופש, או לכתוב סיבה וה-AI יחליט אם היא מוצדקת.
      </p>

      <div className="space-y-3">
        {days.map(({ dateStr, status, exemption }) => {
          const isToday = dateStr === today;
          const monthFreeLeft = FREE_DAYS_PER_MONTH - countFreeDaysInMonth(streakExemptions, dateStr);
          const isProtected = exemption?.type === 'freeze' || exemption?.type === 'excuse';
          const wasRejected = exemption?.type === 'rejected' || !!exemption?.rejectedExcuse;

          return (
            <div key={dateStr} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{isToday ? 'היום' : formatDateToHebrew(dateStr)}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    <bdi dir="ltr">{status.done}/{status.due}</bdi> הושלמו
                  </span>
                </div>

                {isProtected ? (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${exemption.type === 'freeze' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                      {exemption.type === 'freeze' ? '🛡️ יום חופש' : '✅ תירוץ אושר'}
                    </span>
                    <button onClick={() => removeExemption(dateStr)} title="ביטול" className="text-slate-400 hover:text-red-500 p-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyFreeDay(dateStr)}
                      disabled={monthFreeLeft <= 0}
                      className="text-sm font-medium px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Snowflake size={15} /> יום חופש
                    </button>
                    {!wasRejected && (
                      <button
                        onClick={() => { setOpenExcuseDate(openExcuseDate === dateStr ? null : dateStr); setExcuseText(''); setLastResult(null); }}
                        className="text-sm font-medium px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                      >
                        <MessageSquareText size={15} /> יש לי סיבה
                      </button>
                    )}
                  </div>
                )}
              </div>

              {exemption?.type === 'excuse' && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">"{exemption.reason}" — <span className="text-green-700 dark:text-green-400">{exemption.aiReply}</span></p>
              )}
              {(exemption?.type === 'rejected' || exemption?.rejectedExcuse) && (() => {
                const rejected = exemption.type === 'rejected' ? exemption : exemption.rejectedExcuse;
                return (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                    ❌ "{rejected.reason}" — <span className="text-red-600 dark:text-red-400">{rejected.aiReply}</span>
                  </p>
                );
              })()}

              {openExcuseDate === dateStr && !isProtected && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={excuseText}
                    onChange={(e) => setExcuseText(e.target.value)}
                    placeholder="למה לא עמדת ביעד באותו יום? (למשל: הייתי חולה עם חום)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSubmitExcuse(dateStr)}
                      disabled={!excuseText.trim() || pendingDate === dateStr}
                      className="text-sm font-medium px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {pendingDate === dateStr ? <><Activity className="animate-spin" size={15} /> ה-AI שוקל...</> : 'שלח ל-AI'}
                    </button>
                    <span className="text-xs text-slate-400">אפשר לשלוח תירוץ פעם אחת לכל יום</span>
                  </div>
                  {lastResult?.dateStr === dateStr && lastResult.error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{lastResult.error}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
