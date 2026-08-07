import { useState } from 'react';
import { Droplets, Plus, Target, X } from 'lucide-react';
import { getTodayStr, getLastNDays, formatDateToHebrew } from '../utils/habitUtils';

const QUICK_AMOUNTS = [200, 250, 500, 750];

const sumEntries = (entries) => (entries || []).reduce((total, e) => total + e.amount, 0);

export default function WaterTracker({ waterStats, addWaterIntake, removeWaterEntry, setWaterGoal }) {
  const [manualAmount, setManualAmount] = useState('');
  const today = getTodayStr();
  const todayEntries = waterStats?.entries?.[today] || [];
  const todayWater = sumEntries(todayEntries);
  const goal = Number(waterStats?.goal || 2500);
  const progress = goal > 0 ? Math.min(100, Math.round((todayWater / goal) * 100)) : 0;
  const goalReached = todayWater >= goal;

  const last7Days = getLastNDays(7);
  const weekAmounts = last7Days.map(d => sumEntries(waterStats?.entries?.[d]));
  const weekMax = Math.max(goal, ...weekAmounts, 1);

  const handleAddManual = () => {
    const amount = Number(manualAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    addWaterIntake(amount);
    setManualAmount('');
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-3xl border border-cyan-100 dark:border-cyan-900/40 p-5 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/70 shadow-sm">
              <Droplets className="text-cyan-600 dark:text-cyan-400" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">שתיית מים</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">מעקב יומי מקצועי עם יעד מותאם</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            היום: <span className="font-bold text-slate-800 dark:text-slate-200">{todayWater} מ"ל</span> מתוך <span className="font-bold text-slate-800 dark:text-slate-200">{goal} מ"ל</span>
            {goalReached && <span className="mr-2 text-emerald-600 dark:text-emerald-400 font-semibold">🎉 היעד הושג!</span>}
          </p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-cyan-100 dark:border-cyan-800 text-center">
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-400">{progress}%</div>
          <div className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">התקדמות</div>
        </div>
      </div>

      <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => addWaterIntake(amount)}
            className="flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/40 transition-colors"
          >
            <Plus size={16} className="text-cyan-600" />
            {amount} מ"ל
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="number"
          min="1"
          step="50"
          value={manualAmount}
          onChange={(e) => setManualAmount(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
          placeholder="הזן כמות מותאמת"
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleAddManual}
          className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
        >
          הוסף שתייה
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 px-3 py-2 border border-cyan-100 dark:border-cyan-800 mb-4">
        <Target size={16} className="text-cyan-600 shrink-0" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">יעד יומי</span>
        <input
          type="range"
          min="1000"
          max="5000"
          step="250"
          value={goal}
          onChange={(e) => setWaterGoal(Number(e.target.value))}
          className="flex-1 accent-cyan-600"
        />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 shrink-0">{goal} מ"ל</span>
      </div>

      {todayEntries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">שתייה היום</h4>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {[...todayEntries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-cyan-100 dark:border-cyan-900/40 px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-cyan-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{entry.amount} מ"ל</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(entry.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => removeWaterEntry(today, entry.id)}
                  title="מחק רשומה"
                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">7 ימים אחרונים</h4>
        <div className="flex items-end justify-between gap-1.5 h-20">
          {last7Days.map((d, i) => {
            const amount = weekAmounts[i];
            const barHeight = Math.max(4, Math.round((amount / weekMax) * 100));
            const reached = amount >= goal;
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-16 flex items-end rounded-lg bg-white/50 dark:bg-slate-900/50 overflow-hidden">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${reached ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-gradient-to-t from-cyan-500 to-blue-400'}`}
                    style={{ height: `${barHeight}%` }}
                    title={`${amount} מ"ל`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {d === today ? 'היום' : formatDateToHebrew(d).split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
