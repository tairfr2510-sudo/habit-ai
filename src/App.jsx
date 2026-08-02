import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Zap,
  Bell,
  Medal,
  PartyPopper,
  Moon,
  Sun,
  Download,
  Upload,
  FileText,
  X
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
  { id: 'health', name: 'בריאות וכושר', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { id: 'mind', name: 'נפש ולמידה', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  { id: 'productivity', name: 'פרודוקטיביות', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  { id: 'social', name: 'חברה ומשפחה', color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' }
];

const INITIAL_HABITS = [
  { id: '1', name: 'שתיית 3 ליטר מים', category: 'health', frequency: { type: 'daily' }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
  { id: '2', name: 'מדיטציה 10 דקות', category: 'mind', frequency: { type: 'daily' }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
  { id: '3', name: 'אימון כוח', category: 'health', frequency: { type: 'weekly', target: 3 }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
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
    if (logs && logs[dateStr]) count++;
  }
  return count;
};

export default function App() {
  const [habits, setHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  
  // תוספות חדשות
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeNoteModal, setActiveNoteModal] = useState(null); // { habitId, dateStr, currentNote }
  const fileInputRef = useRef(null);

  // הוספת הרגל חדש
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('health');
  const [newHabitFreqType, setNewHabitFreqType] = useState('daily');
  const [newHabitFreqTarget, setNewHabitFreqTarget] = useState(3);

  // AI & Gamification
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, xpNextLevel: 100 });
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Notifications
  const [unreadNotifications, setUnreadNotifications] = useState(1);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [lastReminderDate, setLastReminderDate] = useState('');

  useEffect(() => {
    const savedHabits = localStorage.getItem('habitTracker_data_v3');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      // ננסה לייבא מהגרסה הקודמת אם קיימת
      const oldHabits = localStorage.getItem('habitTracker_data_v2');
      if (oldHabits) {
         setHabits(JSON.parse(oldHabits).map(h => ({ ...h, notes: h.notes || {} })));
      } else {
         setHabits(INITIAL_HABITS);
      }
    }
    
    const savedSettings = localStorage.getItem('habitTracker_settings_v3');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.browserNotifyEnabled) setBrowserNotifyEnabled(parsed.browserNotifyEnabled);
      if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
      if (parsed.lastReminderDate) setLastReminderDate(parsed.lastReminderDate);
      if (parsed.isDarkMode) setIsDarkMode(parsed.isDarkMode);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_data_v3', JSON.stringify(habits));
      localStorage.setItem('habitTracker_settings_v3', JSON.stringify({
        browserNotifyEnabled,
        reminderTime,
        lastReminderDate,
        isDarkMode
      }));
      
      // Calculate XP and Levels
      let totalCompletions = 0;
      habits.forEach(habit => {
        if(habit.logs) totalCompletions += Object.keys(habit.logs).length;
      });
      
      const xpPerCompletion = 15;
      const totalXP = totalCompletions * xpPerCompletion;
      const level = Math.floor(Math.sqrt(totalXP / 20)) + 1;
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
  }, [habits, isLoaded, browserNotifyEnabled, reminderTime, lastReminderDate, isDarkMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // מערכת בדיקת תזכורות אוטומטית (פועלת כל דקה)
  useEffect(() => {
    if (!browserNotifyEnabled || !("Notification" in window)) return;
    const interval = setInterval(() => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = getTodayStr();

      // אם הגיעה שעת התזכורת ועוד לא התרענו היום
      if (currentTime === reminderTime && lastReminderDate !== todayStr) {
        const uncompletedHabits = habits.filter(h => {
          if ((h.frequency?.type === 'daily' || h.frequency === 'daily') && (!h.logs || !h.logs[todayStr])) return true;
          return false;
        });

        if (uncompletedHabits.length > 0) {
          const names = uncompletedHabits.map(h => h.name).join(', ');
          new Notification("זמן להתעורר! משימות מחכות לך ⏳", { body: `הרגלים שנשארו להיום: ${names}`, icon: "🔔" });
        } else if (habits.filter(h => h.frequency?.type === 'daily').length > 0) {
          new Notification("הכל הושלם! 🌟", { body: "כל הכבוד! סיימת את כל המשימות היומיות שלך להיום.", icon: "🏆" });
        }
        setLastReminderDate(todayStr); // מסמנים שהתרענו להיום
      }
    }, 60000); // בדיקה כל 60 שניות
    return () => clearInterval(interval);
  }, [browserNotifyEnabled, reminderTime, lastReminderDate, habits]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showToast("הדפדפן שלך לא תומך בהתראות.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setBrowserNotifyEnabled(true);
      new Notification("HabitAI", { body: "מעולה! התראות הופעלו בהצלחה.", icon: "🧠" });
      showToast("התראות הופעלו בהצלחה!");
    }
  };

  const toggleHabit = (habitId, dateStr) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const logs = habit.logs || {};
        const isCompleted = !!logs[dateStr];
        const updatedLogs = { ...logs };
        if (isCompleted) {
          delete updatedLogs[dateStr];
        } else {
          updatedLogs[dateStr] = true;
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
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
      notes: {},
      createdAt: new Date().toISOString()
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    showToast("הרגל חדש נוסף בהצלחה!");
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    showToast("ההרגל נמחק.");
  };

  const saveNote = (habitId, dateStr, noteText) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
         const notes = habit.notes || {};
         return { ...habit, notes: { ...notes, [dateStr]: noteText } };
      }
      return habit;
    }));
    setActiveNoteModal(null);
    showToast("ההערה נשמרה ביומן.");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(habits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `habitAI_backup_${getTodayStr()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("הנתונים גובו בהצלחה!");
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setHabits(importedData);
          showToast("הנתונים שוחזרו בהצלחה!");
        } else {
          showToast("קובץ הגיבוי אינו תקין.");
        }
      } catch (err) {
        showToast("שגיאה בקריאת הקובץ.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // לאפס את הבחירה
  };

  const calculateStreak = (habitLogs) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (habitLogs && habitLogs[dateStr]) {
        streak++;
      } else if (i !== 0) { 
        break;
      }
    }
    return streak;
  };

  const statsData = useMemo(() => {
    const last7Days = getLastNDays(7);
    const dailyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'daily');
    
    return last7Days.map(date => {
      const total = dailyHabits.length;
      const completed = dailyHabits.filter(h => h.logs && h.logs[date]).length;
      return {
        date: formatDateToHebrew(date),
        rawDate: date,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
  }, [habits]);

  // מפת חום - מחושבת על פני 84 הימים האחרונים (12 שבועות)
  const heatmapData = useMemo(() => {
     const days = getLastNDays(84);
     return days.map(date => {
        const count = habits.filter(h => h.logs && h.logs[date]).length;
        return { date, count };
     });
  }, [habits]);

  const earnedBadges = useMemo(() => {
    const badges = [];
    const maxStreak = habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h.logs))) : 0;
    
    if (userStats.totalXP > 0) badges.push({ id: 1, name: 'צעד ראשון', desc: 'השלמת הרגל ראשון', icon: Star, color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-700' });
    if (maxStreak >= 3) badges.push({ id: 2, name: 'במומנטום', desc: 'רצף של 3 ימים', icon: Flame, color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-700' });
    if (maxStreak >= 7) badges.push({ id: 3, name: 'בלתי ניתן לעצירה', desc: 'רצף של שבוע', icon: Zap, color: 'text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-700' });
    if (userStats.level >= 3) badges.push({ id: 4, name: 'מתמיד', desc: 'הגעת לרמה 3', icon: Medal, color: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700' });
    
    return badges;
  }, [habits, userStats]);

  const fetchAIInsight = async () => {
    setIsAiLoading(true);
    let apiKey = "";
    try {
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY) {
            apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        } else if (typeof window !== 'undefined' && window.VITE_GEMINI_API_KEY) {
            apiKey = window.VITE_GEMINI_API_KEY;
        }
    } catch(e) {
        console.warn("Could not read API key from environment.", e);
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const prompt = `
      אני מנהל מעקב אחרי ההרגלים שלי ב-HabitAI. נתונים ב-JSON: ${JSON.stringify(habits)}.
      1. תן לי חיזוק חיובי קצרצר.
      2. זהה אזורים בהם אני מתקשה והצע אסטרטגיה אחת מעשית.
      ענה בפסקה זורמת אחת בעברית חמה ומעודדת, ללא רשימות.
    `;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "אתה מאמן אישי ידידותי בעברית." }] } })
      });
      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        setAiInsight(candidate.content.parts[0].text);
      } else {
        setAiInsight("סליחה, לא הצלחתי לנתח כרגע. אנא ודא מפתח API בסביבה מקומית.");
      }
    } catch (error) {
      setAiInsight("שגיאה בתקשורת עם מאמן ה-AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderDashboard = () => {
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

    const renderHabitCard = (habit) => {
      const isCompleted = habit.logs && !!habit.logs[today];
      const category = CATEGORIES.find(c => c.id === habit.category);
      const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
      const target = habit.frequency?.target || 7;
      const completionsThisWeek = getCompletionsThisWeek(habit.logs);
      const streak = calculateStreak(habit.logs);
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
            <button onClick={() => toggleHabit(habit.id, today)} className={`transition-all duration-300 z-10 ${isCompleted ? 'text-green-500 scale-110 dark:text-green-400' : 'text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 dark:text-slate-600'}`}>
              {isCompleted ? <CheckCircle size={32} /> : <Circle size={32} />}
            </button>
            <div className="flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id, today)}>
              <h4 className={`font-bold text-lg sm:text-xl flex items-center gap-2 transition-all ${isCompleted ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                {habit.name}
                {isWeeklyGoalMet && <Trophy size={18} className="text-yellow-500 animate-bounce" title="היעד השבועי הושג!" />}
              </h4>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${category?.color}`}>
                  {category?.name}
                </span>
                {freqType === 'daily' ? (
                  streak > 2 && (
                    <span className="text-xs text-orange-600 flex items-center font-bold bg-orange-100 px-2.5 py-1 rounded-lg dark:bg-orange-900/30 dark:text-orange-400">
                      <Flame size={14} className="ml-1" />
                      {streak} ברצף!
                    </span>
                  )
                ) : (
                  <span className={`text-xs flex items-center font-bold px-2.5 py-1 rounded-lg ${
                    isWeeklyGoalMet ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                  }`}>
                    {completionsThisWeek}/{target} השבוע
                  </span>
                )}
              </div>
            </div>
            
            {/* כפתור פתק / יומן - מופיע רק כשמשימה הושלמה */}
            {isCompleted && (
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveNoteModal({ habitId: habit.id, dateStr: today, currentNote: habit.notes?.[today] || '' }); }}
                className={`p-2.5 rounded-xl transition-all border ${hasNote ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-indigo-50 hover:text-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                title={hasNote ? 'צפה/ערוך הערה' : 'הוסף הערה ביומן'}
              >
                <FileText size={18} />
              </button>
            )}
          </div>
        </div>
      );
    };

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
                    {dailyHabits.map(renderHabitCard)}
                  </div>
                )}
                {weeklyHabits.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mt-4">
                      <CalendarDays className="text-indigo-500" size={24} /> יעדים שבועיים
                    </h4>
                    {weeklyHabits.map(renderHabitCard)}
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
  };

  const renderManage = () => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habits.map(habit => {
              const category = CATEGORIES.find(c => c.id === habit.category);
              const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
              const target = habit.frequency?.target || 7;
              return (
                <div key={habit.id} className="p-5 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center hover:border-slate-200 dark:hover:border-slate-700 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{habit.name}</h4>
                    <div className="flex gap-2 mt-2 flex-wrap">
                       <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${category?.color}`}>{category?.name}</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg border bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 flex items-center gap-1">
                        <Target size={12} />{freqType === 'daily' ? 'כל יום' : `${target} פעמים בשבוע`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-3 rounded-xl transition-colors"><Trash2 size={22} /></button>
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
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 text-center transition-colors">
          <Star className="text-yellow-500 mx-auto mb-2" size={28} />
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">סך הכל XP</h4>
          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{userStats.totalXP}</span>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center transition-colors">
           <Trophy className="text-indigo-500 dark:text-indigo-400 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-400 mb-1">רמה נוכחית</h4>
           <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{userStats.level}</span>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-900/50 text-center transition-colors">
           <Target className="text-green-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-1">הרגלים פעילים</h4>
           <span className="text-2xl font-bold text-green-600 dark:text-green-500">{habits.length}</span>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/50 text-center transition-colors">
           <Flame className="text-orange-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-1">שיא רצף</h4>
           <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">{habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h.logs))) : 0}</span>
        </div>
      </div>

      {/* Heatmap (Github Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors overflow-x-auto">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <CalendarDays className="text-green-500 bg-green-50 dark:bg-green-900/30 p-2 rounded-xl" size={40} />
          שנתון פעילות (90 ימים)
        </h3>
        <div className="flex gap-1.5 min-w-max flex-wrap flex-col h-32 content-start">
           {heatmapData.map((data, index) => {
              // קביעת עוצמת הצבע לפי כמות ההרגלים שהושלמו
              let bgClass = "bg-slate-100 dark:bg-slate-800";
              if (data.count === 1) bgClass = "bg-green-200 dark:bg-green-900/60";
              else if (data.count === 2) bgClass = "bg-green-400 dark:bg-green-700";
              else if (data.count >= 3) bgClass = "bg-green-600 dark:bg-green-500";
              
              return (
                 <div 
                   key={index} 
                   className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${bgClass} transition-colors`}
                   title={`${formatDateToHebrew(data.date)}: ${data.count} הרגלים`}
                 />
              );
           })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
           <span>פחות</span>
           <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-200 dark:bg-green-900/60"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-400 dark:bg-green-700"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-600 dark:bg-green-500"></div>
           <span>יותר</span>
        </div>
      </div>

      {/* Badges / Trophy Room */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Medal className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          חדר הישגים ומדליות
        </h3>
        
        {earnedBadges.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Trophy size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">השלם הרגלים כדי להרוויח את המדליות הראשונות שלך!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map(badge => (
              <div key={badge.id} className={`flex flex-col items-center p-5 rounded-2xl border-2 text-center transition-all hover:scale-105 cursor-default ${badge.color}`}>
                 <badge.icon size={36} className="mb-3 drop-shadow-sm" />
                 <span className="font-bold mb-1">{badge.name}</span>
                 <span className="text-xs opacity-80 font-medium">{badge.desc}</span>
              </div>
            ))}
            <div className="flex flex-col items-center p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-center opacity-70">
                 <Medal size={36} className="mb-3" />
                 <span className="font-bold mb-1">מדליה חסויה</span>
                 <span className="text-xs font-medium">המשך להתקדם כדי לגלות</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Activity className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          מגמות יומיות (7 ימים אחרונים)
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}}
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value}% הושלמו`, 'אחוזי הצלחה']}
                labelFormatter={(label) => `תאריך: ${label}`}
              />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Gamification Progress Widget */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border dark:border-slate-800">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30"><Zap className="text-yellow-400" size={32} /></div>
              <div>
                 <h4 className="font-bold text-xl mb-1">הדרך לרמה {userStats.level + 1}</h4>
                 <p className="text-slate-400 text-sm">חסרים לך עוד {Math.round(userStats.xpRequired - userStats.xpProgress)} נקודות ניסיון לעלות רמה.</p>
              </div>
           </div>
           
           <div className="w-full md:w-1/2">
             <div className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>רמה {userStats.level}</span><span>רמה {userStats.level + 1}</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-1000" style={{ width: `${userStats.percentToNext}%` }}></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  if (!isLoaded) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600"></div><p className="text-slate-500 font-medium animate-pulse">טוען את המידע שלך...</p></div>;

  return (
    <div dir="rtl" className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-24 md:pb-0 relative overflow-hidden transition-colors duration-300">
        
        {/* Toast Message */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 fade-in duration-300">
            <div className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm flex items-center gap-2 border border-slate-700">
              <CheckCircle size={16} className="text-green-400" /> {toastMessage}
            </div>
          </div>
        )}

        {/* Note Modal */}
        {activeNoteModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveNoteModal(null)}></div>
             <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white"><FileText className="text-indigo-500" /> יומן התקדמות</h3>
                  <button onClick={() => setActiveNoteModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={24} /></button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">הוסף הערה או תובנה להרגל עבור התאריך {formatDateToHebrew(activeNoteModal.dateStr)}</p>
                <textarea 
                  autoFocus
                  placeholder="איך הרגשת? מה היה קשה או מוצלח במיוחד?"
                  className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-none resize-none mb-4 dark:text-white transition-colors"
                  value={activeNoteModal.currentNote || ''}
                  onChange={(e) => setActiveNoteModal({...activeNoteModal, currentNote: e.target.value})}
                />
                <button 
                  onClick={() => saveNote(activeNoteModal.habitId, activeNoteModal.dateStr, activeNoteModal.currentNote)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
                >
                  שמור ביומן
                </button>
             </div>
          </div>
        )}

        {/* Full Screen Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>
            <div className="relative z-10 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 duration-500">
               <div className="bg-gradient-to-tr from-yellow-400 to-orange-400 p-6 rounded-full shadow-2xl mb-4 animate-bounce">
                  <PartyPopper size={64} className="text-white" />
               </div>
               <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 drop-shadow-sm">כל הכבוד!</h2>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen relative z-10">
          
          {/* Sidebar / Bottom Nav */}
          <nav className="fixed bottom-0 w-full md:w-72 md:relative bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none transition-colors">
            <div className="flex md:flex-col justify-around md:justify-start h-20 md:h-screen md:p-6 md:sticky top-0">
              
              <div className="hidden md:block mb-10">
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-3xl mb-8">
                  <BrainCircuit size={36} /><span>HabitAI</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">{userStats.level}</div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">פרופיל אישי</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium"><Star size={12} className="text-yellow-500 fill-current" />{userStats.totalXP} XP</div>
                  </div>
                </div>
              </div>
              
              <div className="flex md:flex-col w-full h-full md:h-auto items-center md:items-stretch gap-1 md:gap-3 px-2 md:px-0 flex-1">
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
                        ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30 border md:border-transparent border-indigo-100 dark:border-indigo-900/50' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <item.icon size={24} className={`${activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} transition-colors`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Dark mode toggle - Desktop */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="hidden md:flex items-center justify-center gap-3 w-full p-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium mt-auto border border-slate-200 dark:border-slate-700"
              >
                 {isDarkMode ? <><Sun size={20}/> מצב יום</> : <><Moon size={20}/> מצב לילה</>}
              </button>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-8 lg:p-10">
            <header className="mb-6 md:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
               <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-2xl">
                 <BrainCircuit size={28} /><span>HabitAI</span>
               </div>
               <div className="flex items-center gap-3">
                 <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
                   {isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}
                 </button>
                 <div className="flex items-center gap-1 font-bold text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                   <Star size={16} className="text-yellow-500 fill-current" />{userStats.level}
                 </div>
               </div>
            </header>

            <div className="hidden md:flex justify-end mb-8 items-center gap-6">
               <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors">
                 <span>רצף נוכחי מקסימלי:</span>
                 <span className="text-orange-500 font-bold flex items-center">{habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h.logs))) : 0} <Flame size={16} className="ml-1"/></span>
               </div>
               <button className="relative p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => setUnreadNotifications(0)}>
                 <Bell size={24} />
                 {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>}
               </button>
            </div>

            <div className="max-w-4xl mx-auto">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'manage' && renderManage()}
              {activeTab === 'analytics' && renderAnalytics()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}