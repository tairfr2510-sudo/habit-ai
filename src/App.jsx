import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2, 
  Activity, 
  BrainCircuit, 
  CalendarDays, 
  Settings,
  Trophy,
  Sparkles,
  Flame,
  LayoutDashboard,
  Star,
  Target,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const CATEGORIES = [
  { id: 'health', name: 'בריאות וכושר', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'mind', name: 'נפש ולמידה', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'productivity', name: 'פרודוקטיביות', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'social', name: 'חברה ומשפחה', color: 'bg-pink-100 text-pink-800 border-pink-200' }
];

const INITIAL_HABITS = [
  { id: '1', name: 'שתיית 3 ליטר מים', category: 'health', frequency: { type: 'daily' }, logs: {}, createdAt: new Date().toISOString() },
  { id: '2', name: 'מדיטציה 10 דקות', category: 'mind', frequency: { type: 'daily' }, logs: {}, createdAt: new Date().toISOString() },
  { id: '3', name: 'אימון כוח', category: 'health', frequency: { type: 'weekly', target: 3 }, logs: {}, createdAt: new Date().toISOString() },
];

const getTodayStr = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDateToHebrew = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(date);
};

const getCompletionsThisWeek = (logs) => {
  const today = new Date();
  const currentDay = today.getDay(); 
  let count = 0;
  for (let i = 0; i <= currentDay; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (logs[dateStr]) count++;
  }
  return count;
};

export default function App() {
  const [habits, setHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('health');
  const [newHabitFreqType, setNewHabitFreqType] = useState('daily');
  const [newHabitFreqTarget, setNewHabitFreqTarget] = useState(3);

  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Gamification state derived from habits
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, xpNextLevel: 100 });

  useEffect(() => {
    const savedHabits = localStorage.getItem('habitTracker_data_v2');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      setHabits(INITIAL_HABITS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_data_v2', JSON.stringify(habits));
      
      // Calculate XP and Levels
      let totalCompletions = 0;
      habits.forEach(habit => {
        totalCompletions += Object.keys(habit.logs).length;
      });
      
      const xpPerCompletion = 15;
      const totalXP = totalCompletions * xpPerCompletion;
      const level = Math.floor(Math.sqrt(totalXP / 20)) + 1; // Scaling level up slower
      const xpForCurrentLevel = 20 * Math.pow(level - 1, 2);
      const xpForNextLevel = 20 * Math.pow(level, 2);
      const xpProgress = totalXP - xpForCurrentLevel;
      const xpRequired = xpForNextLevel - xpForCurrentLevel;

      setUserStats({
        totalXP,
        level,
        xpProgress,
        xpRequired,
        percentToNext: Math.min(100, Math.max(0, (xpProgress / xpRequired) * 100))
      });
    }
  }, [habits, isLoaded]);

  const toggleHabit = (habitId, dateStr) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = !!habit.logs[dateStr];
        const updatedLogs = { ...habit.logs };
        if (isCompleted) {
          delete updatedLogs[dateStr];
        } else {
          updatedLogs[dateStr] = true;
        }
        return { ...habit, logs: updatedLogs };
      }
      return habit;
    }));
  };

  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      category: newHabitCategory,
      frequency: { type: newHabitFreqType, target: newHabitFreqType === 'weekly' ? parseInt(newHabitFreqTarget) : 7 },
      logs: {},
      createdAt: new Date().toISOString()
    };
    
    setHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const calculateStreak = (habitLogs) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (habitLogs[dateStr]) {
        streak++;
      } else if (i !== 0) { // allow missing today without breaking past streak immediately
        break;
      }
    }
    return streak;
  };

  const statsData = useMemo(() => {
    const last7Days = getLastNDays(7);
    return last7Days.map(date => {
      const total = habits.length;
      const completed = habits.filter(h => h.logs[date]).length;
      return {
        date: formatDateToHebrew(date),
        rawDate: date,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }, [habits]);

  const fetchAIInsight = async () => {
    setIsAiLoading(true);
    
    // Using Gemini API seamlessly
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const prompt = `
      אני מנהל מעקב אחרי ההרגלים שלי באפליקציית HabitAI. 
      אלו הנתונים הנוכחיים שלי (בפורמט JSON): ${JSON.stringify(habits)}.
      אנא נתח את הדפוסים שלי:
      1. תן לי חיזוק חיובי קצרצר על הרגלים שאני מצליח בהם.
      2. זהה אזורים שבהם אני מתקשה והצע אסטרטגיה קונקרטית, קצרה ויישומית אחת כדי להשתפר.
      כתוב את התשובה כפסקה זורמת אחת, בעברית טבעית, חמה ומעודדת. אל תשתמש בפורמט של רשימות ארוכות.
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
            parts: [{ text: "אתה מאמן אישי ידידותי ואנרגטי שעוזר למשתמש להפוך לגרסה הטובה ביותר של עצמו. השב תמיד בעברית קולחת וטבעית." }]
        }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const candidate = data.candidates?.[0];
      
      if (candidate && candidate.content?.parts?.[0]?.text) {
        setAiInsight(candidate.content.parts[0].text);
      } else {
        setAiInsight("סליחה, לא הצלחתי לנתח את הנתונים כרגע. המשך בעבודה המצוינת!");
      }
    } catch (error) {
      console.error('Error fetching Gemini insights:', error);
      setAiInsight("אירעה שגיאה בתקשורת עם מאמן ה-AI. קח נשימה עמוקה וננסה שוב מאוחר יותר.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderDashboard = () => {
    const today = getTodayStr();
    const completedCount = habits.filter(h => h.logs[today]).length;
    const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

    const dailyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'daily');
    const weeklyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'weekly');

    const renderHabitCard = (habit) => {
      const isCompleted = !!habit.logs[today];
      const category = CATEGORIES.find(c => c.id === habit.category);
      const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
      const target = habit.frequency?.target || 7;
      const completionsThisWeek = getCompletionsThisWeek(habit.logs);
      const streak = calculateStreak(habit.logs);
      const isWeeklyGoalMet = freqType === 'weekly' && completionsThisWeek >= target;
      
      return (
        <div 
          key={habit.id} 
          className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 group ${
            isCompleted ? 'bg-slate-50 border-slate-100 scale-[0.99] opacity-80' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50'
          }`}
        >
          <div className="flex items-center gap-5 cursor-pointer flex-1" onClick={() => toggleHabit(habit.id, today)}>
            <button className={`transition-all duration-300 ${isCompleted ? 'text-green-500 scale-110' : 'text-slate-300 group-hover:text-indigo-400 group-hover:scale-110'}`}>
              {isCompleted ? <CheckCircle size={32} /> : <Circle size={32} />}
            </button>
            <div className="flex-1">
              <h4 className={`font-bold text-lg sm:text-xl flex items-center gap-2 transition-all ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {habit.name}
                {isWeeklyGoalMet && <Trophy size={18} className="text-yellow-500 animate-bounce" title="היעד השבועי הושג!" />}
              </h4>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${category?.color}`}>
                  {category?.name}
                </span>
                
                {freqType === 'daily' ? (
                  streak > 2 && (
                    <span className="text-xs text-orange-600 flex items-center font-bold bg-orange-100 px-2.5 py-1 rounded-lg">
                      <Flame size={14} className="ml-1" />
                      {streak} ימים ברצף!
                    </span>
                  )
                ) : (
                  <span className={`text-xs flex items-center font-bold px-2.5 py-1 rounded-lg ${
                    isWeeklyGoalMet ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {completionsThisWeek}/{target} השבוע
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Widget */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 duration-700">
            <Target size={160} />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">היום שלך</h2>
              <p className="text-indigo-100 text-lg mb-6 flex items-center gap-2">
                <Sparkles size={18} /> השלמת {completedCount} מתוך {habits.length} הרגלים.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-center bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
              <span className="text-xs uppercase tracking-wider text-indigo-100 font-semibold mb-1">רמה {userStats.level}</span>
              <div className="flex items-center gap-1 font-bold text-xl text-yellow-300">
                <Star size={20} className="fill-current" />
                {userStats.totalXP}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-black/20 rounded-full h-4 mb-2 backdrop-blur-sm relative z-10 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-300 to-white rounded-full h-4 transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium relative z-10 opacity-90">
             <span>התקדמות יומית</span>
             <span>{Math.round(progress)}% הושלם</span>
          </div>
        </div>

        {/* Habits List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <CalendarDays className="text-indigo-500 bg-indigo-50 p-2 rounded-xl" size={40} />
              משימות להיום
            </h3>
            <span className="text-sm font-medium bg-slate-100 text-slate-600 py-1.5 px-4 rounded-full">{formatDateToHebrew(today)}</span>
          </div>
          
          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                  <Plus size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-700 mb-2">הדרך שלך מתחילה כאן!</h4>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">אין לך עדיין הרגלים מוגדרים להיום. הגיע הזמן לבנות את שגרת המנצחים שלך.</p>
                <button 
                  onClick={() => setActiveTab('manage')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-indigo-200"
                >
                  הוסף הרגל ראשון
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {dailyHabits.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Target className="text-indigo-500" size={24} /> יעדים יומיים
                    </h4>
                    {dailyHabits.map(renderHabitCard)}
                  </div>
                )}
                
                {weeklyHabits.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3 mt-4">
                      <CalendarDays className="text-indigo-500" size={24} /> יעדים שבועיים
                    </h4>
                    {weeklyHabits.map(renderHabitCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Insight Widget */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 sm:p-8 border-2 border-indigo-100/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
            <h3 className="text-xl font-bold text-indigo-950 flex items-center gap-3">
              <BrainCircuit className="text-purple-600 bg-purple-100 p-2 rounded-xl" size={40} />
              מאמן אישי AI
            </h3>
            <button 
              onClick={fetchAIInsight}
              disabled={isAiLoading || habits.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-md flex items-center justify-center gap-2"
            >
              {isAiLoading ? (
                <>
                  <Activity className="animate-spin" size={18} />
                  מנתח את הדפוסים שלך...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  קבל תובנה חכמה
                </>
              )}
            </button>
          </div>
          
          <div className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-inner min-h-[120px] flex items-center transition-all ${isAiLoading ? 'opacity-50' : 'opacity-100'} relative z-10`}>
            {aiInsight ? (
              <p className="text-slate-700 leading-relaxed text-lg font-medium">{aiInsight}</p>
            ) : (
              <div className="text-center w-full space-y-2">
                <p className="text-slate-500 font-medium">לחיצה אחת והבינה המלאכותית שלנו תנתח את ההרגלים שלך</p>
                <p className="text-slate-400 text-sm">מומלץ לבקש תובנה בסוף היום לסיכום ההתקדמות</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderManage = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Plus className="text-indigo-500 bg-indigo-50 p-2 rounded-xl" size={40} />
          יצירת הרגל חדש
        </h3>
        
        <form onSubmit={addHabit} className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
               <label className="block text-sm font-semibold text-slate-600 mb-2">שם ההרגל</label>
               <input
                type="text"
                placeholder="למשל: קריאת 10 עמודים ביום..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-indigo-500 transition-colors outline-none text-slate-700 font-medium bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div className="md:w-64">
               <label className="block text-sm font-semibold text-slate-600 mb-2">קטגוריה</label>
               <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-indigo-500 transition-colors outline-none text-slate-700 font-medium bg-slate-50 focus:bg-white cursor-pointer"
               >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">תדירות היעד</label>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
              <div className="flex gap-6 w-full md:w-auto">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${newHabitFreqType === 'daily' ? 'border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                     {newHabitFreqType === 'daily' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={newHabitFreqType === 'daily'} onChange={() => setNewHabitFreqType('daily')} />
                  <span className={`font-medium ${newHabitFreqType === 'daily' ? 'text-indigo-900' : 'text-slate-600'}`}>כל יום</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${newHabitFreqType === 'weekly' ? 'border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                     {newHabitFreqType === 'weekly' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <input type="radio" className="hidden" checked={newHabitFreqType === 'weekly'} onChange={() => setNewHabitFreqType('weekly')} />
                  <span className={`font-medium ${newHabitFreqType === 'weekly' ? 'text-indigo-900' : 'text-slate-600'}`}>מספר ימים בשבוע</span>
                </label>
              </div>
              
              {newHabitFreqType === 'weekly' && (
                <div className="flex items-center gap-3 md:mr-6 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto mt-4 md:mt-0 justify-center">
                  <span className="text-slate-600 font-medium">יעד:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="7" 
                    value={newHabitFreqTarget}
                    onChange={(e) => setNewHabitFreqTarget(e.target.value)}
                    className="w-16 p-1.5 border-2 border-indigo-100 rounded-lg text-center font-bold text-indigo-700 focus:border-indigo-500 outline-none bg-indigo-50"
                  />
                  <span className="text-slate-600 text-sm">פעמים בשבוע</span>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl mt-2 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            שמור הרגל
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Settings className="text-indigo-500 bg-indigo-50 p-2 rounded-xl" size={40} />
          ניהול הרגלים קיימים
        </h3>
        
        {habits.length === 0 ? (
           <p className="text-slate-500 text-center py-6">אין הרגלים לנהל כרגע.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habits.map(habit => {
              const category = CATEGORIES.find(c => c.id === habit.category);
              const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
              const target = habit.frequency?.target || 7;
              
              return (
                <div key={habit.id} className="p-5 border-2 border-slate-100 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-colors bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{habit.name}</h4>
                    <div className="flex gap-2 mt-2 flex-wrap">
                       <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${category?.color}`}>
                        {category?.name}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg border bg-white text-slate-600 border-slate-200 flex items-center gap-1">
                        <Target size={12} />
                        {freqType === 'daily' ? 'כל יום' : `${target} פעמים בשבוע`}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-colors"
                    title="מחק הרגל"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Gamification Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-2xl border border-yellow-100 text-center">
          <Star className="text-yellow-500 mx-auto mb-2" size={28} />
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">סך הכל XP</h4>
          <span className="text-2xl font-bold text-yellow-600">{userStats.totalXP}</span>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 text-center">
           <Trophy className="text-indigo-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-indigo-800 mb-1">רמה נוכחית</h4>
           <span className="text-2xl font-bold text-indigo-600">{userStats.level}</span>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100 text-center">
           <Target className="text-green-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-green-800 mb-1">הרגלים פעילים</h4>
           <span className="text-2xl font-bold text-green-600">{habits.length}</span>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-2xl border border-orange-100 text-center">
           <Flame className="text-orange-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-orange-800 mb-1">שיא רצף</h4>
           <span className="text-2xl font-bold text-orange-600">
              {habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h.logs))) : 0}
           </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <Activity className="text-indigo-500 bg-indigo-50 p-2 rounded-xl" size={40} />
          מגמות (7 ימים אחרונים)
        </h3>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                formatter={(value) => [`${value}% הושלמו`, 'אחוזי הצלחה']}
                labelFormatter={(label) => `תאריך: ${label}`}
              />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Gamification Progress Widget */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                 <Zap className="text-yellow-400" size={32} />
              </div>
              <div>
                 <h4 className="font-bold text-xl mb-1">הדרך לרמה {userStats.level + 1}</h4>
                 <p className="text-slate-400 text-sm">חסרים לך עוד {Math.round(userStats.xpRequired - userStats.xpProgress)} נקודות ניסיון לעלות רמה.</p>
              </div>
           </div>
           
           <div className="w-full md:w-1/2">
             <div className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>רמה {userStats.level}</span>
                <span>רמה {userStats.level + 1}</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${userStats.percentToNext}%` }}
                ></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600"></div>
      <p className="text-slate-500 font-medium animate-pulse">טוען את המידע שלך...</p>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 md:pb-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen">
        
        {/* Sidebar / Bottom Nav (Mobile & Desktop) */}
        <nav className="fixed bottom-0 w-full md:w-72 md:relative bg-white border-t md:border-t-0 md:border-l border-slate-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
          <div className="flex md:flex-col justify-around md:justify-start h-20 md:h-screen md:p-6 md:sticky top-0">
            
            {/* Desktop Brand & Profile */}
            <div className="hidden md:block mb-10">
              <div className="flex items-center gap-3 text-indigo-600 font-black text-3xl mb-8">
                <BrainCircuit size={36} />
                <span>HabitAI</span>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                  {userStats.level}
                </div>
                <div>
                  <div className="font-bold text-slate-800">פרופיל אישי</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Star size={12} className="text-yellow-500 fill-current" />
                    {userStats.totalXP} XP
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex md:flex-col w-full h-full md:h-auto items-center md:items-stretch gap-1 md:gap-3 px-2 md:px-0">
              {[
                { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
                { id: 'manage', label: 'ניהול הרגלים', icon: Settings },
                { id: 'analytics', label: 'התקדמות', icon: Activity },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-4 p-2 md:p-4 rounded-2xl transition-all duration-300 font-semibold text-[10px] sm:text-xs md:text-base ${
                    activeTab === item.id 
                      ? 'text-indigo-700 bg-indigo-50/80 border md:border-transparent border-indigo-100' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <item.icon size={24} className={`${activeTab === item.id ? "text-indigo-600" : "text-slate-400"} transition-colors`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-10">
          <header className="mb-6 md:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 text-indigo-600 font-black text-2xl">
               <BrainCircuit size={28} />
               <span>HabitAI</span>
             </div>
             <div className="flex items-center gap-1 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-700">
               <Star size={16} className="text-yellow-500 fill-current" />
               {userStats.level}
             </div>
          </header>

          <div className="max-w-4xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'manage' && renderManage()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        </main>
      </div>
    </div>
  );
}