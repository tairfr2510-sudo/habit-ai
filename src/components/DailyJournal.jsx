import { useState } from 'react';
import { NotebookPen, Target } from 'lucide-react';
import { MOODS } from '../constants';
import { getTodayStr, formatDateToHebrew, getCompletionRateForDate } from '../utils/habitUtils';

export default function DailyJournal({ habits, journalEntries, saveJournalEntry }) {
  const today = getTodayStr();
  const todayEntry = journalEntries[today];

  const [selectedMood, setSelectedMood] = useState(todayEntry?.mood || null);
  const [journalText, setJournalText] = useState(todayEntry?.text || '');

  const todayRate = getCompletionRateForDate(habits, today);

  const handleSave = () => {
    saveJournalEntry(today, selectedMood, journalText);
  };

  // רשומות עבר ממוינות מהחדש לישן, כולל היום עצמו אם כבר נשמר
  const timelineDates = Object.keys(journalEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Today's Reflection */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <NotebookPen className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
            איך היה היום?
          </h3>
          <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-1.5 px-4 rounded-full flex items-center gap-2 w-fit">
            <Target size={14} className="text-indigo-500" /> {todayRate}% הושלם היום
          </span>
        </div>

        <div className="flex justify-center sm:justify-start gap-2 sm:gap-4 mb-6">
          {MOODS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedMood(emoji)}
              title={label}
              className={`text-3xl sm:text-4xl w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all border-2 ${
                selectedMood === emoji
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-400 dark:border-indigo-500 scale-110 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:scale-105'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <textarea
          placeholder="כתבו כאן חופשי - מה קרה היום, איך הרגשתם, מה למדתם על עצמכם..."
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-none resize-y mb-4 text-slate-700 dark:text-slate-200 leading-relaxed transition-colors"
        />

        <button
          onClick={handleSave}
          disabled={!selectedMood && !journalText.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
        >
          שמור ביומן
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <NotebookPen className="text-purple-500 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-xl" size={40} />
          ציר הזמן שלי
        </h3>

        {timelineDates.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 font-medium">עדיין אין רשומות ביומן - כתבו את הרשומה הראשונה שלכם למעלה!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineDates.map(dateStr => {
              const entry = journalEntries[dateStr];
              const rate = getCompletionRateForDate(habits, dateStr);
              return (
                <div key={dateStr} className="flex gap-4 p-4 sm:p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="text-3xl sm:text-4xl shrink-0">{entry.mood || '📝'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {dateStr === today ? 'היום' : formatDateToHebrew(dateStr)}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                        <Target size={12} className="text-indigo-500" /> {rate}% הרגלים הושלמו
                      </span>
                    </div>
                    {entry.text && (
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">{entry.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
