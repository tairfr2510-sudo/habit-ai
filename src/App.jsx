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
  LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const CATEGORIES = [
  { id: 'health', name: 'בריאות וכושר', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'mind', name: 'נפש ולמידה', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'productivity', name: 'פרודוקטיביות', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'social', name: 'חברה ומשפחה', color: 'bg-pink-100 text-pink-800 border-pink-200' }
];

const INITIAL_HABITS = [
  { id: '1', name: 'שתיית 2 ליטר מים', category: 'health', frequency: { type: 'daily' }, logs: {}, createdAt: new Date().toISOString() },
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

  useEffect(() => {
    const savedHabits = localStorage.getItem('habitTracker_data');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      setHabits(INITIAL_HABITS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_data', JSON.stringify(habits));
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
      } else if (i !== 0) { 
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
    
    const apiKey = ""; 
    
    if (!apiKey || apiKey === "") {
       setAiInsight("יש להזין מפתח API של Groq בקוד כדי לקבל תובנות.");
       setIsAiLoading(false);
       return;
    }

    const prompt = `
      אני מנהל מעקב אחרי ההרגלים שלי במטרה להפוך לגרסה הטובה ביותר של עצמי. 
      אלו הנתונים הנוכחיים שלי: ${JSON.stringify(habits)}.
      אנא נתח את הדפוסים שלי:
      1. תן לי חיזוק חיובי על הרגלים שאני מצליח בהם.
      2. זהה אזורים שבהם אני מתקשה והצע אסטרטגיה קונקרטית ואחת בלבד כדי להשתפר מחר.
      היה תמציתי וממוקד, וכתוב בעברית בלבד.
    `;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192", 
          messages: [
            { role: "system", content: "אתה מאמן אישי שעוזר למשתמש להפוך לגרסה הטובה ביותר של עצמו דרך בניית הרגלים. השב תמיד בעברית." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setAiInsight(data.choices[0].message.content);
      } else {
        setAiInsight("לא התקבלה תשובה ברורה מהשרת.");
      }
    } catch (error) {
      console.error('Error fetching Groq insights:', error);
      setAiInsight("אירעה שגיאה בתקשורת עם ה-AI. המשך בדרך הטובה!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderDashboard = () => {
    const today = getTodayStr();
    const completedCount = habits.filter(h => h.logs[today]).length;
    const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Trophy size={120} />
          </div>
          <h2 className="text-2xl font-bold mb-2 relative z-10">היום שלך</h2>
          <p className="text-blue-100 mb-4 relative z-10">השלמת {completedCount} מתוך {habits.length} הרגלים היום.</p>
          
          <div className="w-full bg-blue-900/50 rounded-full h-4 mb-2 backdrop-blur-sm relative z-10">
            <div 
              className="bg-white rounded-full h-4 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm font-semibold opacity-90 relative z-10">{Math.round(progress)}% הושלם</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays className="text-indigo-500" />
              משימות להיום
            </h3>
            <span className="text-sm text-gray-500">{formatDateToHebrew(today)}</span>
          </div>
          
          <div className="space-y-3">
            {habits.length === 0 ? (
              <p className="text-center text-gray-500 py-6">אין לך הרגלים עדיין. עבור ללשונית ניהול כדי להוסיף.</p>
            ) : (
              habits.map(habit => {
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
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleHabit(habit.id, today)}>
                      <button className={`transition-colors ${isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-indigo-400'}`}>
                        {isCompleted ? <CheckCircle size={28} /> : <Circle size={28} />}
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-lg flex items-center gap-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {habit.name}
                          {isWeeklyGoalMet && <Trophy size={16} className="text-yellow-500" title="היעד השבועי הושג!" />}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${category?.color}`}>
                            {category?.name}
                          </span>
                          
                          {freqType === 'daily' ? (
                            streak > 2 && (
                              <span className="text-xs text-orange-500 flex items-center font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                                <Flame size={12} className="ml-1" />
                                רצף של {streak} ימים!
                              </span>
                            )
                          ) : (
                            <span className={`text-xs flex items-center font-medium px-2 py-0.5 rounded-full ${
                              isWeeklyGoalMet ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {completionsThisWeek} מתוך {target} השבוע
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <Sparkles className="text-purple-600" />
              מאמן אישי AI
            </h3>
            <button 
              onClick={fetchAIInsight}
              disabled={isAiLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <BrainCircuit className="animate-pulse" size={16} />
                  מנתח נתונים...
                </>
              ) : (
                <>
                  <BrainCircuit size={16} />
                  קבל תובנה יומית
                </>
              )}
            </button>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-inner min-h-[100px] flex items-center">
            {aiInsight ? (
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">{aiInsight}</p>
            ) : (
              <p className="text-gray-400 italic text-center w-full">לחץ על הכפתור כדי לקבל ניתוח חכם של ההרגלים שלך ותובנות להמשך...</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderManage = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Plus className="text-indigo-500" />
          הוספת הרגל חדש
        </h3>
        
        <form onSubmit={addHabit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="איזה הרגל תרצה לאמץ? (למשל: ריצה, קריאה)"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
            <select
              value={newHabitCategory}
              onChange={(e) => setNewHabitCategory(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none md:w-48"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-gray-700 font-medium">תדירות:</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="frequency" 
                  value="daily" 
                  checked={newHabitFreqType === 'daily'} 
                  onChange={() => setNewHabitFreqType('daily')}
                  className="w-4 h-4 text-indigo-600"
                />
                <span>כל יום</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="frequency" 
                  value="weekly" 
                  checked={newHabitFreqType === 'weekly'} 
                  onChange={() => setNewHabitFreqType('weekly')}
                  className="w-4 h-4 text-indigo-600"
                />
                <span>ימים בשבוע</span>
              </label>
            </div>
            
            {newHabitFreqType === 'weekly' && (
              <div className="flex items-center gap-2 md:mr-4">
                <input 
                  type="number" 
                  min="1" 
                  max="7" 
                  value={newHabitFreqTarget}
                  onChange={(e) => setNewHabitFreqTarget(e.target.value)}
                  className="w-16 p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-gray-600 text-sm">פעמים בשבוע</span>
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg mt-2"
          >
            הוסף הרגל
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Settings className="text-indigo-500" />
          ניהול הרגלים קיימים
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map(habit => {
            const category = CATEGORIES.find(c => c.id === habit.category);
            const freqType = habit.frequency?.type || (typeof habit.frequency === 'string' ? habit.frequency : 'daily');
            const target = habit.frequency?.target || 7;
            
            return (
              <div key={habit.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-gray-800">{habit.name}</h4>
                  <div className="flex gap-2 mt-2">
                     <span className={`text-xs px-2 py-0.5 rounded-full border ${category?.color}`}>
                      {category?.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                      {freqType === 'daily' ? 'כל יום' : `${target} פעמים בשבוע`}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="מחק הרגל"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Activity className="text-indigo-500" />
          מגמות (7 ימים אחרונים)
        </h3>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value}% הושלמו`, 'ביצועים']}
                labelFormatter={(label) => `תאריך: ${label}`}
              />
              <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-bold text-gray-700 mb-4">סיכום סטטיסטי</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">סה"כ הרגלים פעילים:</span>
                <span className="text-xl font-bold text-indigo-600">{habits.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">רצף נוכחי מקסימלי:</span>
                <span className="text-xl font-bold text-orange-500 flex items-center">
                  {Math.max(0, ...habits.map(h => calculateStreak(h.logs)))} 
                  <Flame size={18} className="mr-1" />
                </span>
              </div>
            </div>
         </div>
         
         <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 flex flex-col justify-center items-center text-center">
            <BrainCircuit size={48} className="text-indigo-400 mb-4" />
            <h4 className="font-bold text-indigo-900 mb-2">מוכנים לשלב הבא?</h4>
            <p className="text-indigo-700 text-sm">התמדה היא המפתח. עקוב אחרי הגרף היומי כדי לראות את ההתקדמות שלך ולשבור שיאים אישיים.</p>
         </div>
      </div>
    </div>
  );

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row min-h-screen">
        
        {/* Sidebar / Bottom Nav (Mobile) */}
        <nav className="fixed bottom-0 w-full md:w-64 md:relative bg-white border-t md:border-t-0 md:border-l border-gray-200 z-50">
          <div className="flex md:flex-col justify-around md:justify-start h-16 md:h-screen md:p-6 md:sticky top-0">
            <div className="hidden md:flex items-center gap-3 mb-10 text-indigo-600 font-bold text-2xl">
              <BrainCircuit size={32} />
              <span>HabitAI</span>
            </div>
            
            <div className="flex md:flex-col w-full">
              {[
                { id: 'dashboard', label: 'היום שלי', icon: LayoutDashboard },
                { id: 'manage', label: 'ניהול הרגלים', icon: Settings },
                { id: 'analytics', label: 'התקדמות', icon: Activity },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:p-4 rounded-xl transition-all font-medium text-xs md:text-base ${
                    activeTab === item.id 
                      ? 'text-indigo-600 md:bg-indigo-50' 
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={22} className={activeTab === item.id ? "text-indigo-600" : ""} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          <header className="mb-8 md:hidden flex items-center gap-2 text-indigo-600 font-bold text-2xl">
             <BrainCircuit size={28} />
             <span>HabitAI</span>
          </header>

          <div className="max-w-3xl mx-auto">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'manage' && renderManage()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        </main>
      </div>
    </div>
  );
}