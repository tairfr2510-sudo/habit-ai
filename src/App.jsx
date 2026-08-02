import { useState, useEffect, useMemo, useRef } from 'react';
import { Star, Flame, Zap, Medal } from 'lucide-react';
import {
  isNativePlatform,
  requestNativeNotificationPermission,
  scheduleNativeDailyReminder
} from './lib/nativeReminders';
import { INITIAL_HABITS } from './constants';
import {
  getTodayStr,
  getLastNDays,
  formatDateToHebrew,
  getCompletionsThisWeek,
  calculateStreak
} from './utils/habitUtils';
import Toast from './components/Toast';
import NoteModal from './components/NoteModal';
import CelebrationOverlay from './components/CelebrationOverlay';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import DesktopHeader from './components/DesktopHeader';
import Dashboard from './components/Dashboard';
import ManageHabits from './components/ManageHabits';
import Analytics from './components/Analytics';
import DailyJournal from './components/DailyJournal';

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
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [browserNotifyEnabled, setBrowserNotifyEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [lastReminderDate, setLastReminderDate] = useState('');
  const habitsRef = useRef(habits);

  // סדר הרגלים - גרירה
  const [draggingIndex, setDraggingIndex] = useState(null);
  const dragHabitIndexRef = useRef(null);

  // יומן יומי ומעקב מצב רוח
  const [journalEntries, setJournalEntries] = useState({}); // { [dateStr]: { mood, text, updatedAt } }

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

    const savedNotifications = localStorage.getItem('habitTracker_notifications_v1');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.warn('לא ניתן לטעון היסטוריית התראות.', e);
      }
    }

    const savedJournal = localStorage.getItem('habitTracker_journal_v1');
    if (savedJournal) {
      try {
        setJournalEntries(JSON.parse(savedJournal));
      } catch (e) {
        console.warn('לא ניתן לטעון את היומן היומי.', e);
      }
    }

    setIsLoaded(true);
  }, []);

  // שומרים תמיד גישה עדכנית להרגלים בתוך הבדיקה התקופתית של התזכורות,
  // בלי לגרום לאיפוס הטיימר בכל שינוי של habits
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  // סגירת פאנל ההתראות בלחיצה מחוץ לו
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-notif-panel]')) {
        setShowNotificationsPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_notifications_v1', JSON.stringify(notifications));
    }
  }, [notifications, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_journal_v1', JSON.stringify(journalEntries));
    }
  }, [journalEntries, isLoaded]);

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

  // מוסיף התראה להיסטוריה שמוצגת בפעמון, בנוסף להתראת הדפדפן עצמה
  const addNotification = (title, body) => {
    const notif = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      body,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notif, ...prev].slice(0, 30));
  };

  // בפלטפורמה אמיתית (אפליקציה מותקנת דרך Capacitor) התזכורת מתוזמנת ישירות במערכת ההפעלה
  // של הטלפון (ראה scheduleNativeDailyReminder), כך שהיא פועלת גם כשהאפליקציה סגורה.
  // בדפדפן רגיל אין אפשרות כזו, ולכן ממשיכים להסתמך על טיימר שרץ כל עוד האפליקציה פתוחה.
  useEffect(() => {
    if (!isNativePlatform() || !browserNotifyEnabled) return;
    scheduleNativeDailyReminder(reminderTime);
  }, [browserNotifyEnabled, reminderTime]);

  // מערכת בדיקת תזכורות אוטומטית (דפדפן בלבד) - בודקת כל 15 שניות מול הזמן שהוגדר.
  // habits נקרא דרך ref כדי שהטיימר לא יתאפס בכל שינוי בהרגלים (וכך לא יפספס את הרגע המדויק)
  useEffect(() => {
    if (isNativePlatform() || !browserNotifyEnabled || !("Notification" in window)) return;

    const checkReminder = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = getTodayStr();

      // אם הגיעה שעת התזכורת ועוד לא התרענו היום
      if (currentTime !== reminderTime || lastReminderDate === todayStr) return;

      const currentHabits = habitsRef.current;
      const uncompletedDaily = currentHabits.filter(h => {
        const freqType = h.frequency?.type || h.frequency;
        return freqType === 'daily' && (!h.logs || !h.logs[todayStr]);
      });
      const uncompletedWeekly = currentHabits.filter(h => {
        const freqType = h.frequency?.type || h.frequency;
        if (freqType !== 'weekly') return false;
        const target = h.frequency?.target || 7;
        return getCompletionsThisWeek(h.logs) < target && (!h.logs || !h.logs[todayStr]);
      });
      const uncompletedHabits = [...uncompletedDaily, ...uncompletedWeekly];

      if (uncompletedHabits.length > 0) {
        const names = uncompletedHabits.map(h => h.name).join(', ');
        const title = "זמן להתעורר! משימות מחכות לך ⏳";
        const body = `הרגלים שנשארו להיום: ${names}`;
        new Notification(title, { body, icon: "🔔" });
        addNotification(title, body);
      } else if (currentHabits.length > 0) {
        const title = "הכל הושלם! 🌟";
        const body = "כל הכבוד! סיימת את כל המשימות שלך להיום.";
        new Notification(title, { body, icon: "🏆" });
        addNotification(title, body);
      }
      setLastReminderDate(todayStr); // מסמנים שהתרענו להיום
    };

    checkReminder();
    const interval = setInterval(checkReminder, 15000); // בדיקה כל 15 שניות לדיוק גבוה יותר
    return () => clearInterval(interval);
  }, [browserNotifyEnabled, reminderTime, lastReminderDate]);

  const requestNotificationPermission = async () => {
    if (isNativePlatform()) {
      const granted = await requestNativeNotificationPermission();
      if (granted) {
        setBrowserNotifyEnabled(true);
        await scheduleNativeDailyReminder(reminderTime);
        addNotification("HabitAI", "מעולה! תזכורות יומיות הופעלו בטלפון.");
        showToast("תזכורות הופעלו בהצלחה!");
      } else {
        showToast("לא ניתנה הרשאה להתראות במכשיר.");
      }
      return;
    }

    if (!("Notification" in window)) {
      showToast("הדפדפן שלך לא תומך בהתראות.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setBrowserNotifyEnabled(true);
      const title = "HabitAI";
      const body = "מעולה! התראות הופעלו בהצלחה.";
      new Notification(title, { body, icon: "🧠" });
      addNotification(title, body);
      showToast("התראות הופעלו בהצלחה!");
    }
  };

  const toggleNotificationsPanel = () => {
    setShowNotificationsPanel(prev => {
      const next = !prev;
      if (next) {
        // מסמנים הכל כנקרא כשפותחים את הפאנל
        setNotifications(nots => nots.map(n => ({ ...n, read: true })));
      }
      return next;
    });
  };

  const closeNotificationsPanel = () => setShowNotificationsPanel(false);

  const moveHabit = (index, direction) => {
    setHabits(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newHabits = [...prev];
      [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
      return newHabits;
    });
  };

  const handleHabitDragStart = (index) => {
    dragHabitIndexRef.current = index;
    setDraggingIndex(index);
  };

  const handleHabitDragOver = (e) => {
    e.preventDefault();
  };

  const handleHabitDrop = (index) => {
    const from = dragHabitIndexRef.current;
    if (from === null || from === index) {
      setDraggingIndex(null);
      return;
    }
    setHabits(prev => {
      const newHabits = [...prev];
      const [moved] = newHabits.splice(from, 1);
      newHabits.splice(index, 0, moved);
      return newHabits;
    });
    dragHabitIndexRef.current = null;
    setDraggingIndex(null);
  };

  const handleHabitDragEnd = () => {
    dragHabitIndexRef.current = null;
    setDraggingIndex(null);
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

  const saveJournalEntry = (dateStr, mood, text) => {
    setJournalEntries(prev => ({
      ...prev,
      [dateStr]: { mood, text, updatedAt: new Date().toISOString() }
    }));
    showToast("הרשומה נשמרה ביומן היומי!");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ habits, journalEntries }, null, 2);
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
          // פורמט גיבוי ישן - הרגלים בלבד, בלי יומן
          setHabits(importedData);
          showToast("הנתונים שוחזרו בהצלחה!");
        } else if (importedData && Array.isArray(importedData.habits)) {
          setHabits(importedData.habits);
          setJournalEntries(importedData.journalEntries || {});
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

  // קריאה ישירה ל-Gemini מהצד לקוח, עם מפתח שנקרא מ-VITE_GEMINI_API_KEY (מוגדר ב-.env.local).
  // המפתח נצרב בתוך חבילת ה-JS (כולל בתוך ה-APK), ולכן חשוף עקרונית למי שיפרק את האפליקציה.
  // זו החלטה מודעת בשביל אפליקציה אישית שלא מתפרסמת - אם בעתיד תרצו לפרסם אותה (חנות אפליקציות
  // או אתר ציבורי), עדיף לחזור לגישה עם שרת ביניים (כמו netlify/functions בהיסטוריית הקוד).
  const fetchAIInsight = async () => {
    setIsAiLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiInsight("לא נמצא מפתח API. ודא שהגדרת VITE_GEMINI_API_KEY בקובץ .env.local ובנית מחדש את הפרויקט.");
      setIsAiLoading(false);
      return;
    }

    const prompt = `
      אני מנהל מעקב אחרי ההרגלים שלי ב-HabitAI. נתונים ב-JSON: ${JSON.stringify(habits)}.
      1. תן לי חיזוק חיובי קצרצר.
      2. זהה אזורים בהם אני מתקשה והצע אסטרטגיה אחת מעשית.
      ענה בפסקה זורמת אחת בעברית חמה ומעודדת, ללא רשימות.
    `;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "אתה מאמן אישי ידידותי בעברית." }] }
        })
      });
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiInsight(text);
      } else {
        setAiInsight("סליחה, לא הצלחתי לנתח כרגע. נסה שוב מאוחר יותר.");
      }
    } catch (error) {
      setAiInsight("שגיאה בתקשורת עם מאמן ה-AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isLoaded) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600"></div><p className="text-slate-500 font-medium animate-pulse">טוען את המידע שלך...</p></div>;

  return (
    <div dir="rtl" className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-24 md:pb-0 relative overflow-hidden transition-colors duration-300">

        <Toast message={toastMessage} />
        <NoteModal activeNoteModal={activeNoteModal} setActiveNoteModal={setActiveNoteModal} saveNote={saveNote} />
        <CelebrationOverlay show={showCelebration} />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row min-h-screen relative z-10">

          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userStats={userStats}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-8 lg:p-10">
            <MobileHeader
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              userStats={userStats}
              notifications={notifications}
              unreadCount={unreadCount}
              showNotificationsPanel={showNotificationsPanel}
              toggleNotificationsPanel={toggleNotificationsPanel}
              closeNotificationsPanel={closeNotificationsPanel}
            />

            <DesktopHeader
              habits={habits}
              notifications={notifications}
              unreadCount={unreadCount}
              showNotificationsPanel={showNotificationsPanel}
              toggleNotificationsPanel={toggleNotificationsPanel}
              closeNotificationsPanel={closeNotificationsPanel}
            />

            <div className="max-w-4xl mx-auto">
              {activeTab === 'dashboard' && (
                <Dashboard
                  habits={habits}
                  userStats={userStats}
                  aiInsight={aiInsight}
                  isAiLoading={isAiLoading}
                  fetchAIInsight={fetchAIInsight}
                  setActiveTab={setActiveTab}
                  onToggleHabit={toggleHabit}
                  onOpenNote={setActiveNoteModal}
                />
              )}
              {activeTab === 'journal' && (
                <DailyJournal
                  habits={habits}
                  journalEntries={journalEntries}
                  saveJournalEntry={saveJournalEntry}
                />
              )}
              {activeTab === 'manage' && (
                <ManageHabits
                  browserNotifyEnabled={browserNotifyEnabled}
                  reminderTime={reminderTime}
                  setReminderTime={setReminderTime}
                  requestNotificationPermission={requestNotificationPermission}
                  newHabitName={newHabitName}
                  setNewHabitName={setNewHabitName}
                  newHabitCategory={newHabitCategory}
                  setNewHabitCategory={setNewHabitCategory}
                  newHabitFreqType={newHabitFreqType}
                  setNewHabitFreqType={setNewHabitFreqType}
                  newHabitFreqTarget={newHabitFreqTarget}
                  setNewHabitFreqTarget={setNewHabitFreqTarget}
                  addHabit={addHabit}
                  handleExportData={handleExportData}
                  handleImportData={handleImportData}
                  fileInputRef={fileInputRef}
                  habits={habits}
                  draggingIndex={draggingIndex}
                  handleHabitDragStart={handleHabitDragStart}
                  handleHabitDragOver={handleHabitDragOver}
                  handleHabitDrop={handleHabitDrop}
                  handleHabitDragEnd={handleHabitDragEnd}
                  moveHabit={moveHabit}
                  deleteHabit={deleteHabit}
                />
              )}
              {activeTab === 'analytics' && (
                <Analytics
                  habits={habits}
                  userStats={userStats}
                  statsData={statsData}
                  heatmapData={heatmapData}
                  earnedBadges={earnedBadges}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
