import { CheckCircle, Circle, Trophy, Flame, FileText } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { getCompletionsThisWeek, calculateStreak, getScheduleLabel } from '../utils/habitUtils';

export default function HabitCard({ habit, today, onToggle, onOpenNote }) {
  const isCompleted = habit.logs && !!habit.logs[today];
  const category = CATEGORIES.find(c => c.id === habit.category);
  const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
  const target = habit.frequency?.target || 7;
  const completionsThisWeek = getCompletionsThisWeek(habit.logs);
  const streak = calculateStreak(habit);
  const isWeeklyGoalMet = freqType === 'weekly' && completionsThisWeek >= target;
  const hasNote = habit.notes && habit.notes[today];

  return (
    <div
      key={habit.id}
      className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 group ${
        isCompleted
          ? 'bg-slate-50 border-slate-100 scale-[0.99] opacity-90 dark:bg-slate-800/50 dark:border-slate-800'
          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg dark:bg-slate-800 dark:border-slate-700 dark:hover:border-indigo-500/50'
      }`}
    >
      <div className="flex items-center gap-4 sm:gap-5 flex-1">
        <button onClick={() => onToggle(habit.id, today)} className={`transition-all duration-300 z-10 ${isCompleted ? 'text-green-500 scale-110 dark:text-green-400' : 'text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 dark:text-slate-600'}`}>
          {isCompleted ? <CheckCircle size={32} /> : <Circle size={32} />}
        </button>
        <div className="flex-1 cursor-pointer" onClick={() => onToggle(habit.id, today)}>
          <h4 className={`font-bold text-lg sm:text-xl flex items-center gap-2 transition-all ${isCompleted ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {habit.name}
            {isWeeklyGoalMet && <Trophy size={18} className="text-yellow-500 animate-bounce" title="היעד השבועי הושג!" />}
          </h4>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${category?.color}`}>
              {category?.name}
            </span>
            {freqType === 'weekly' ? (
              <span className={`text-xs flex items-center font-bold px-2.5 py-1 rounded-lg ${
                isWeeklyGoalMet ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {completionsThisWeek}/{target} השבוע
              </span>
            ) : (
              <>
                {freqType === 'custom' && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                    {getScheduleLabel(habit)}
                  </span>
                )}
                {streak > 2 && (
                  <span className="text-xs text-orange-600 flex items-center font-bold bg-orange-100 px-2.5 py-1 rounded-lg dark:bg-orange-900/30 dark:text-orange-400">
                    <Flame size={14} className="ml-1" />
                    {streak} ברצף!
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* כפתור פתק / יומן - מופיע רק כשמשימה הושלמה */}
        {isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenNote({ habitId: habit.id, dateStr: today, currentNote: habit.notes?.[today] || '' }); }}
            className={`p-2.5 rounded-xl transition-all border ${hasNote ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-indigo-50 hover:text-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
            title={hasNote ? 'צפה/ערוך הערה' : 'הוסף הערה ביומן'}
          >
            <FileText size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
