import { Cloud, Smartphone } from 'lucide-react';

const countHabits = (json) => {
  try { return JSON.parse(json).length; } catch { return 0; }
};

// מוצג כשמתחברים במכשיר שיש בו נתונים שונים ממה שיש בענן (למשל בפעם הראשונה במחשב),
// כדי שאף צד לא יידרס בלי שהמשתמש בחר.
export default function SyncConflictModal({ conflict, localHabitsCount, onResolve }) {
  if (!conflict) return null;

  const remoteHabits = conflict.remote.habits;
  const remoteUpdatedAt = Math.max(0, ...Object.values(conflict.remote).map(r => r.updatedAt || 0));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">אילו נתונים לשמור?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          בחשבון שלך בענן כבר יש נתונים, והם שונים ממה ששמור במכשיר הזה. בחר מה להשאיר - הצד השני יוחלף.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onResolve('cloud')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 hover:border-indigo-400 text-right transition-colors"
          >
            <Cloud size={28} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100">הנתונים מהענן (מומלץ)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {remoteHabits ? `${countHabits(remoteHabits.json)} הרגלים` : 'ללא הרגלים'}
                {remoteUpdatedAt > 0 && ` · עודכן ${new Date(remoteUpdatedAt).toLocaleString('he-IL')}`}
              </div>
            </div>
          </button>
          <button
            onClick={() => onResolve('local')}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-right transition-colors"
          >
            <Smartphone size={28} className="text-slate-500 shrink-0" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100">הנתונים מהמכשיר הזה</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{localHabitsCount} הרגלים</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
