import { useState } from 'react';
import { History, CheckCircle, Circle, ChevronDown } from 'lucide-react';
import { getLastNDays, formatDateToHebrew, isHabitDueOnDate } from '../utils/habitUtils';

// כרטיס "שכחת לסמן אתמול?": מאפשר לסמן בדיעבד הרגלים שבוצעו אתמול. מציג
// הרגלים יומיים / "ימים נבחרים" שהיו מתוכננים לאתמול, וגם הרגלים שבועיים
// שהיעד השבועי שלהם עוד לא הושג עד אתמול. מקופל כברירת מחדל ומציג כמה עוד לא סומנו.
export default function YesterdayCatchUp({ habits, onToggleHabit }) {
  const yesterday = getLastNDays(2)[0];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const relevant = habits.filter(h => {
    // הרגל שנוצר רק היום לא היה קיים אתמול
    if (h.createdAt && new Date(h.createdAt) >= startOfToday && !h.logs?.[yesterday]) return false;
    return isHabitDueOnDate(h, yesterday);
  });
  const missingCount = relevant.filter(h => !h.logs?.[yesterday]).length;
  const [open, setOpen] = useState(false);

  if (relevant.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap justify-between items-center gap-3 text-right">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <History className="text-amber-500 bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl" size={40} />
          שכחת לסמן אתמול?
        </h3>
        <span className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          {missingCount > 0 ? `${missingCount} לא סומנו · ${formatDateToHebrew(yesterday)}` : `הכל סומן · ${formatDateToHebrew(yesterday)}`}
          <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-2">
          {relevant.map(habit => {
            const done = !!habit.logs?.[yesterday];
            return (
              <button
                key={habit.id}
                onClick={() => onToggleHabit(habit.id, yesterday)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-right transition-colors ${
                  done
                    ? 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'
                    : 'bg-white border-slate-100 hover:border-amber-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-amber-500/50'
                }`}
              >
                {done
                  ? <CheckCircle size={24} className="text-green-500 dark:text-green-400 shrink-0" />
                  : <Circle size={24} className="text-slate-300 dark:text-slate-600 shrink-0" />}
                <span className={`font-medium ${done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                  {habit.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
