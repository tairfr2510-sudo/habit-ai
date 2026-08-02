import { Bell, Plus, Download, Upload, Settings, Trash2, GripVertical, ChevronUp, ChevronDown, Target } from 'lucide-react';
import { CATEGORIES } from '../constants';

export default function ManageHabits({
  browserNotifyEnabled,
  reminderTime,
  setReminderTime,
  requestNotificationPermission,
  newHabitName,
  setNewHabitName,
  newHabitCategory,
  setNewHabitCategory,
  newHabitFreqType,
  setNewHabitFreqType,
  newHabitFreqTarget,
  setNewHabitFreqTarget,
  addHabit,
  handleExportData,
  handleImportData,
  fileInputRef,
  habits,
  draggingIndex,
  handleHabitDragStart,
  handleHabitDragOver,
  handleHabitDrop,
  handleHabitDragEnd,
  moveHabit,
  deleteHabit
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Notifications Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm text-indigo-500 dark:text-indigo-400"><Bell size={32} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">התראות ותזכורות</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">בחר שעה לתזכורת יומית להשלמת משימות</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {browserNotifyEnabled && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border-2 border-indigo-100 dark:border-indigo-500/30 shadow-sm transition-all">
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">בשעה:</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-indigo-50 dark:bg-slate-700 border-none outline-none font-bold text-indigo-700 dark:text-indigo-300 rounded-lg p-1 cursor-pointer"
              />
            </div>
          )}
          <button
            onClick={requestNotificationPermission}
            disabled={browserNotifyEnabled}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${
              browserNotifyEnabled ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200 dark:bg-green-900/40 dark:text-green-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
            }`}
          >
            {browserNotifyEnabled ? '✓ פעילות' : 'הפעל התראות'}
          </button>
        </div>
      </div>

      {/* Add New Habit */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Plus className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          יצירת הרגל חדש
        </h3>

        <form onSubmit={addHabit} className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
               <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">שם ההרגל</label>
               <input
                type="text"
                placeholder="למשל: קריאת 10 עמודים ביום..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                required
              />
            </div>
            <div className="md:w-64">
               <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">קטגוריה</label>
               <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 cursor-pointer transition-colors"
               >
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">תדירות היעד</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex gap-6 w-full md:w-auto">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${newHabitFreqType === 'daily' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                     {newHabitFreqType === 'daily' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={newHabitFreqType === 'daily'} onChange={() => setNewHabitFreqType('daily')} />
                  <span className={`font-medium ${newHabitFreqType === 'daily' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>כל יום</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${newHabitFreqType === 'weekly' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                     {newHabitFreqType === 'weekly' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={newHabitFreqType === 'weekly'} onChange={() => setNewHabitFreqType('weekly')} />
                  <span className={`font-medium ${newHabitFreqType === 'weekly' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>מספר ימים בשבוע</span>
                </label>
              </div>

              {newHabitFreqType === 'weekly' && (
                <div className="flex items-center gap-3 md:mr-6 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto mt-4 md:mt-0 justify-center transition-colors">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">יעד:</span>
                  <input type="number" min="1" max="7" value={newHabitFreqTarget} onChange={(e) => setNewHabitFreqTarget(e.target.value)} className="w-16 p-1.5 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-lg text-center font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800 outline-none" />
                  <span className="text-slate-600 dark:text-slate-400 text-sm">פעמים בשבוע</span>
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg mt-2 flex items-center justify-center gap-2">
            <Plus size={20} /> שמור הרגל
          </button>
        </form>
      </div>

      {/* Backup & Restore (Import/Export) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Download className="text-green-500 bg-green-50 dark:bg-green-900/30 p-2 rounded-xl" size={40} />
          גיבוי ושחזור נתונים
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">שמור את הנתונים שלך בבטחה למחשב או שחזר אותם מקובץ גיבוי קיים.</p>
        <div className="flex flex-col sm:flex-row gap-4">
           <button onClick={handleExportData} className="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 font-bold py-3 px-6 rounded-xl border border-green-200 dark:border-green-800 transition-all flex items-center justify-center gap-2">
             <Download size={20} /> הורד קובץ גיבוי
           </button>
           <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2">
             <Upload size={20} /> טען נתונים מקובץ
           </button>
           <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
        </div>
      </div>

      {/* Manage Existing Habits */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Settings className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          ניהול הרגלים קיימים
        </h3>
        {habits.length === 0 ? (
           <p className="text-slate-500 dark:text-slate-400 text-center py-6">אין הרגלים לנהל כרגע.</p>
        ) : (
          <>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">גרור/י את הידית כדי לשנות את סדר ההרגלים, או השתמש/י בחיצים.</p>
            <div className="flex flex-col gap-3">
              {habits.map((habit, index) => {
                const category = CATEGORIES.find(c => c.id === habit.category);
                const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
                const target = habit.frequency?.target || 7;
                return (
                  <div
                    key={habit.id}
                    draggable
                    onDragStart={() => handleHabitDragStart(index)}
                    onDragOver={handleHabitDragOver}
                    onDrop={() => handleHabitDrop(index)}
                    onDragEnd={handleHabitDragEnd}
                    className={`p-5 border-2 rounded-2xl flex justify-between items-center transition-all bg-slate-50/50 dark:bg-slate-800/30 ${
                      draggingIndex === index ? 'opacity-40 border-indigo-300 dark:border-indigo-600' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500 shrink-0" title="גרור לשינוי סדר">
                        <GripVertical size={22} />
                      </div>
                      <div className="flex flex-col shrink-0">
                        <button
                          onClick={() => moveHabit(index, -1)}
                          disabled={index === 0}
                          className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-300 dark:disabled:hover:text-slate-600 transition-colors"
                          title="הזז למעלה"
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          onClick={() => moveHabit(index, 1)}
                          disabled={index === habits.length - 1}
                          className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-300 dark:disabled:hover:text-slate-600 transition-colors"
                          title="הזז למטה"
                        >
                          <ChevronDown size={18} />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg truncate">{habit.name}</h4>
                        <div className="flex gap-2 mt-2 flex-wrap">
                           <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${category?.color}`}>{category?.name}</span>
                          <span className="text-xs font-semibold px-2 py-1 rounded-lg border bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 flex items-center gap-1">
                            <Target size={12} />{freqType === 'daily' ? 'כל יום' : `${target} פעמים בשבוע`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-3 rounded-xl transition-colors shrink-0"><Trash2 size={22} /></button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
