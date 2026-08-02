import { Target, Sparkles, Trophy, Star, CalendarDays, Plus, BrainCircuit, Activity } from 'lucide-react';
import { getTodayStr, getCompletionsThisWeek, formatDateToHebrew } from '../utils/habitUtils';
import HabitCard from './HabitCard';

export default function Dashboard({
  habits,
  userStats,
  aiInsight,
  isAiLoading,
  fetchAIInsight,
  setActiveTab,
  onToggleHabit,
  onOpenNote
}) {
  const today = getTodayStr();

  const dailyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'daily');
  const dailyCompletedCount = dailyHabits.filter(h => h.logs && h.logs[today]).length;
  const dailyProgress = dailyHabits.length > 0 ? (dailyCompletedCount / dailyHabits.length) * 100 : 0;

  const weeklyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'weekly');
  let weeklyTotalTargets = 0;
  let weeklyCurrentCompletions = 0;
  let weeklyGoalsMet = 0;

  weeklyHabits.forEach(habit => {
    const target = habit.frequency?.target || 7;
    const completionsThisWeek = getCompletionsThisWeek(habit.logs);
    weeklyTotalTargets += target;
    weeklyCurrentCompletions += Math.min(completionsThisWeek, target);
    if (completionsThisWeek >= target) weeklyGoalsMet++;
  });

  const weeklyProgress = weeklyTotalTargets > 0 ? (weeklyCurrentCompletions / weeklyTotalTargets) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 opacity-10 transform -translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 duration-700"><Target size={140} /></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">היום שלך</h2>
              <p className="text-indigo-100 sm:text-lg mb-2 flex items-center gap-2">
                <Sparkles size={18} /> השלמת {dailyCompletedCount} מתוך {dailyHabits.length} יעדים.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/20 rounded-full h-3 sm:h-4 mb-2 backdrop-blur-sm relative overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-blue-300 to-white rounded-full h-full transition-all duration-1000 ease-out relative" style={{ width: `${dailyProgress}%` }}>
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm font-medium opacity-90">
                 <span>התקדמות יומית</span><span>{Math.round(dailyProgress)}% הושלם</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 opacity-10 transform -translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 duration-700"><Trophy size={140} /></div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">השבוע שלך</h2>
                <p className="text-blue-100 sm:text-lg mb-2 flex items-center gap-2">
                  הושגו {weeklyGoalsMet} מתוך {weeklyHabits.length} יעדים.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-center bg-white/10 p-2 sm:p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                <span className="text-xs uppercase tracking-wider text-blue-100 font-semibold mb-1">רמה {userStats.level}</span>
                <div className="flex items-center gap-1 font-bold text-xl text-yellow-300"><Star size={20} className="fill-current" />{userStats.totalXP}</div>
              </div>
            </div>
            <div>
              <div className="w-full bg-black/20 rounded-full h-3 sm:h-4 mb-2 backdrop-blur-sm relative overflow-hidden shadow-inner">
                <div className="bg-white rounded-full h-full transition-all duration-1000 ease-out relative" style={{ width: `${weeklyProgress}%` }}>
                   <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm font-medium opacity-90">
                 <span>התקדמות שבועית כוללת</span><span>{Math.round(weeklyProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <CalendarDays className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
            משימות להיום
          </h3>
          <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1.5 px-4 rounded-full">{formatDateToHebrew(today)}</span>
        </div>

        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="bg-white dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300 dark:text-slate-400"><Plus size={32} /></div>
              <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">הדרך שלך מתחילה כאן!</h4>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">אין לך עדיין הרגלים מוגדרים להיום. הגיע הזמן לבנות את שגרת המנצחים שלך.</p>
              <button onClick={() => setActiveTab('manage')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-indigo-200">הוסף הרגל ראשון</button>
            </div>
          ) : (
            <div className="space-y-8">
              {dailyHabits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Target className="text-indigo-500" size={24} /> יעדים יומיים
                  </h4>
                  {dailyHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} today={today} onToggle={onToggleHabit} onOpenNote={onOpenNote} />
                  ))}
                </div>
              )}
              {weeklyHabits.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mt-4">
                    <CalendarDays className="text-indigo-500" size={24} /> יעדים שבועיים
                  </h4>
                  {weeklyHabits.map(habit => (
                    <HabitCard key={habit.id} habit={habit} today={today} onToggle={onToggleHabit} onOpenNote={onOpenNote} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100/50 dark:border-indigo-500/20 shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 dark:bg-purple-600/30 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 dark:bg-indigo-600/30 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
          <h3 className="text-xl font-bold text-indigo-950 dark:text-indigo-100 flex items-center gap-3">
            <BrainCircuit className="text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400 p-2 rounded-xl" size={40} />
            מאמן אישי AI
          </h3>
          <button onClick={fetchAIInsight} disabled={isAiLoading || habits.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md flex items-center justify-center gap-2">
            {isAiLoading ? <><Activity className="animate-spin" size={18} />מנתח...</> : <><Sparkles size={18} />קבל תובנה חכמה</>}
          </button>
        </div>
        <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-slate-700 shadow-inner min-h-[120px] flex items-center transition-all ${isAiLoading ? 'opacity-50' : 'opacity-100'} relative z-10`}>
          {aiInsight ? (
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg font-medium">{aiInsight}</p>
          ) : (
            <div className="text-center w-full space-y-2">
              <p className="text-slate-500 dark:text-slate-400 font-medium">לחיצה אחת והבינה המלאכותית שלנו תנתח את ההרגלים שלך</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">מומלץ לבקש תובנה בסוף היום לסיכום ההתקדמות</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
