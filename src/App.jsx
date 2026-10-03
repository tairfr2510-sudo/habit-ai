import { useState, useEffect, useMemo, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Star, Flame, Zap, Medal, Rocket, Crown, CheckCircle2, Award, Trophy, Shield, Layers, Target } from 'lucide-react';
import {
  isNativePlatform,
  requestNativeNotificationPermission,
  scheduleNativeDailyReminder,
  getNextReminderDate
} from './lib/nativeReminders';
import { syncWidgetSnapshot, drainWidgetPendingActions } from './lib/nativeWidget';
import { INITIAL_HABITS, CATEGORIES } from './constants';
import {
  getTodayStr,
  formatDateToInput,
  getLastNDays,
  formatDateToHebrew,
  getCompletionsThisWeek,
  calculateStreak,
  calculateDailyStreak,
  countFreeDaysInMonth,
  FREE_DAYS_PER_MONTH,
  isHabitScheduledOnDate,
  isHabitDueOnDate,
  getScheduleLabel,
  getReminderMessage
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
import WaterTracker from './components/WaterTracker';
import SyncConflictModal from './components/SyncConflictModal';
import { useCloudSync } from './lib/useCloudSync';

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
  const [newHabitCustomDays, setNewHabitCustomDays] = useState([0, 1, 2, 3, 4]);

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
  const [waterStats, setWaterStats] = useState({ goal: 2500, entries: {} });
  // ימים מוגנים ברצף - ראה isDateExempt ב-habitUtils
  const [streakExemptions, setStreakExemptions] = useState({});

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

    const savedWater = localStorage.getItem('habitTracker_water_v1');
    if (savedWater) {
      try {
        const parsedWater = JSON.parse(savedWater);
        setWaterStats({
          goal: parsedWater.goal || 2500,
          entries: parsedWater.entries || {}
        });
      } catch (e) {
        console.warn('לא ניתן לטעון את נתוני המים.', e);
      }
    }

    const savedExemptions = localStorage.getItem('habitTracker_streak_exemptions_v1');
    if (savedExemptions) {
      try {
        setStreakExemptions(JSON.parse(savedExemptions));
      } catch (e) {
        console.warn('לא ניתן לטעון את ימי הרצף המוגנים.', e);
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
      localStorage.setItem('habitTracker_water_v1', JSON.stringify(waterStats));
    }
  }, [waterStats, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('habitTracker_streak_exemptions_v1', JSON.stringify(streakExemptions));
    }
  }, [streakExemptions, isLoaded]);

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
  // התלות ב-habits חשובה כאן: היא גורמת לתזכורת להתזמן מחדש עם רשימת ההרגלים שעוד לא
  // הושלמו בכל פעם שמסמנים/מוסיפים/מוחקים הרגל, כדי שהתוכן שיגיע בפועל יהיה עדכני.
  useEffect(() => {
    if (!isNativePlatform() || !browserNotifyEnabled) return;
    const fireDate = getNextReminderDate(reminderTime);
    if (!fireDate) return;
    // התוכן נבנה לפי היום שבו התזכורת תופיע בפועל (מחר, אם השעה כבר עברה היום)
    const message = getReminderMessage(habits, formatDateToInput(fireDate));
    scheduleNativeDailyReminder(reminderTime, message);
  }, [browserNotifyEnabled, reminderTime, habits]);

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
      const { title, body, icon } = getReminderMessage(currentHabits, todayStr);
      new Notification(title, { body, icon });
      addNotification(title, body);
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
        setBrowserNotifyEnabled(true); // מפעיל את ה-effect שמתזמן את התזכורת עם התוכן העדכני
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
    if (newHabitFreqType === 'custom' && newHabitCustomDays.length === 0) {
      showToast("יש לבחור לפחות יום אחד.");
      return;
    }
    const frequency = { type: newHabitFreqType, target: newHabitFreqType === 'weekly' ? parseInt(newHabitFreqTarget) : 7 };
    if (newHabitFreqType === 'custom') {
      frequency.days = [...newHabitCustomDays].sort((a, b) => a - b);
    }
    const newHabit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      category: newHabitCategory,
      frequency,
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

  const updateHabit = (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    showToast("ההרגל עודכן בהצלחה!");
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

  const markHabitDoneByKeyword = (keyword, dateStr) => {
    setHabits(prev => {
      const target = prev.find(h => h.name.includes(keyword));
      if (!target) return prev;
      const logs = target.logs || {};
      if (logs[dateStr]) return prev;
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      return prev.map(h => h.id === target.id ? { ...h, logs: { ...logs, [dateStr]: true } } : h);
    });
  };

  const saveJournalEntry = (dateStr, mood, text) => {
    setJournalEntries(prev => ({
      ...prev,
      [dateStr]: { mood, text, updatedAt: new Date().toISOString() }
    }));
    markHabitDoneByKeyword('יומן', dateStr);
    showToast("הרשומה נשמרה ביומן היומי!");
  };

  const addWaterIntake = (amount) => {
    const today = getTodayStr();
    const entry = { id: `${Date.now()}_${Math.round(Math.random() * 1000)}`, amount, time: new Date().toISOString() };
    setWaterStats(prev => ({
      ...prev,
      entries: {
        ...prev.entries,
        [today]: [...(prev.entries?.[today] || []), entry]
      }
    }));
    const currentTotal = (waterStats.entries?.[today] || []).reduce((s, e) => s + e.amount, 0);
    if (currentTotal + amount >= waterStats.goal) {
      markHabitDoneByKeyword('מים', today);
    }
    showToast(`נוסף ${amount} מ"ל למעקב המים.`);
  };

  const removeWaterEntry = (dateStr, entryId) => {
    setWaterStats(prev => ({
      ...prev,
      entries: {
        ...prev.entries,
        [dateStr]: (prev.entries?.[dateStr] || []).filter(e => e.id !== entryId)
      }
    }));
  };

  const setWaterGoal = (goal) => {
    setWaterStats(prev => ({ ...prev, goal }));
  };

  // מיישם פעולה שבוצעה מהוויג'ט הנייטיבי במסך הבית בזמן שהאפליקציה לא הייתה
  // פתוחה. הסימון קובע מצב סופי (לא toggle), כדי שהצטברות כמה פעולות ממתינות
  // לפני שהאפליקציה נפתחת מחדש לא תיצור תוצאה שגויה.
  const applyWidgetHabitDone = (habitId, dateStr, done) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const logs = { ...(h.logs || {}) };
      if (done) logs[dateStr] = true; else delete logs[dateStr];
      return { ...h, logs };
    }));
  };

  // שואב פעולות שהצטברו מהוויג'ט (סימון הרגל / הוספת מים) - פעם אחת בטעינה,
  // ושוב בכל פעם שהאפליקציה חוזרת לחזית, כדי שגם פעולות שבוצעו כשהאפליקציה
  // הייתה סגורה לגמרי ייכנסו ל-state האמיתי.
  useEffect(() => {
    if (!isLoaded || !isNativePlatform()) return;

    const applyPendingWidgetActions = async () => {
      const actions = await drainWidgetPendingActions();
      actions.forEach(action => {
        if (action.type === 'toggleHabit') {
          applyWidgetHabitDone(action.habitId, action.date, action.done);
        } else if (action.type === 'addWater') {
          addWaterIntake(action.amount);
        }
      });
    };

    applyPendingWidgetActions();
    let listenerHandle;
    CapacitorApp.addListener('resume', applyPendingWidgetActions).then(handle => {
      listenerHandle = handle;
    });
    return () => listenerHandle?.remove();
  }, [isLoaded]);

  // מעדכן את נתוני הוויג'ט (SharedPreferences שהוויג'ט הנייטיבי קורא ישירות)
  // בכל שינוי בהרגלים או במעקב המים, כדי שהוויג'ט במסך הבית ישקף את המצב העדכני.
  useEffect(() => {
    if (!isLoaded) return;
    syncWidgetSnapshot(habits, waterStats, streakExemptions);
  }, [habits, waterStats, streakExemptions, isLoaded]);

  const handleExportData = () => {
    const dataStr = JSON.stringify({ habits, journalEntries, waterStats, streakExemptions }, null, 2);
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
          if (importedData.waterStats) {
            setWaterStats({
              goal: importedData.waterStats.goal || 2500,
              entries: importedData.waterStats.entries || {}
            });
          }
          setStreakExemptions(importedData.streakExemptions || {});
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

    return last7Days.map(date => {
      const dueHabits = habits.filter(h => {
        const freqType = h.frequency?.type || h.frequency;
        return (freqType === 'daily' || freqType === 'custom') && isHabitScheduledOnDate(h, date);
      });
      const total = dueHabits.length;
      const completed = dueHabits.filter(h => h.logs && h.logs[date]).length;
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
    const maxStreak = calculateDailyStreak(habits, streakExemptions);
    const totalCompletions = habits.reduce((sum, h) => sum + Object.values(h.logs || {}).filter(Boolean).length, 0);
    const categoriesUsed = new Set(habits.map(h => h.category)).size;
    const weeklyGoalMetNow = habits.some(h => {
      const freqType = h.frequency?.type || (typeof h.frequency === 'string' ? h.frequency : 'daily');
      return freqType === 'weekly' && getCompletionsThisWeek(h.logs) >= (h.frequency?.target || 7);
    });

    if (userStats.totalXP > 0) badges.push({ id: 1, name: 'צעד ראשון', desc: 'השלמת הרגל ראשון', icon: Star, color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-700' });
    if (maxStreak >= 3) badges.push({ id: 2, name: 'במומנטום', desc: 'רצף של 3 ימים', icon: Flame, color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-700' });
    if (maxStreak >= 7) badges.push({ id: 3, name: 'בלתי ניתן לעצירה', desc: 'רצף של שבוע', icon: Zap, color: 'text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-700' });
    if (maxStreak >= 14) badges.push({ id: 5, name: 'שבועיים ברצף', desc: 'רצף של 14 ימים', icon: Rocket, color: 'text-pink-600 bg-pink-100 border-pink-200 dark:bg-pink-900/40 dark:text-pink-400 dark:border-pink-700' });
    if (maxStreak >= 30) badges.push({ id: 6, name: 'חודש מושלם', desc: 'רצף של 30 ימים', icon: Crown, color: 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700' });
    if (totalCompletions >= 10) badges.push({ id: 7, name: 'עשר השלמות', desc: '10 הרגלים הושלמו בסך הכל', icon: CheckCircle2, color: 'text-teal-600 bg-teal-100 border-teal-200 dark:bg-teal-900/40 dark:text-teal-400 dark:border-teal-700' });
    if (totalCompletions >= 50) badges.push({ id: 8, name: 'חמישים השלמות', desc: '50 הרגלים הושלמו בסך הכל', icon: Award, color: 'text-cyan-600 bg-cyan-100 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-700' });
    if (totalCompletions >= 100) badges.push({ id: 9, name: 'מאה השלמות', desc: '100 הרגלים הושלמו בסך הכל', icon: Trophy, color: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700' });
    if (userStats.level >= 3) badges.push({ id: 4, name: 'מתמיד', desc: 'הגעת לרמה 3', icon: Medal, color: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700' });
    if (userStats.level >= 6) badges.push({ id: 10, name: 'ותיק', desc: 'הגעת לרמה 6', icon: Shield, color: 'text-violet-600 bg-violet-100 border-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:border-violet-700' });
    if (categoriesUsed >= 3) badges.push({ id: 11, name: 'מגוון הרגלים', desc: 'הרגלים בלפחות 3 קטגוריות שונות', icon: Layers, color: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700' });
    if (weeklyGoalMetNow) badges.push({ id: 12, name: 'יעד שבועי הושג', desc: 'עמדת ביעד שבועי של הרגל השבוע', icon: Target, color: 'text-rose-600 bg-rose-100 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-700' });

    return badges;
  }, [habits, userStats, streakExemptions]);

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

    // סיכום מספרי נקי במקום שליחת אובייקט ה-habits הגולמי - כולל רק את מה שרלוונטי
    // לניתוח (רצפים, אחוזי עמידה בלוח הזמנים), בלי לחשוף את תוכן הפתקים האישיים
    // ובלי "לבזבז" הקשר על שדות פנימיים כמו id/createdAt.
    const last14Days = getLastNDays(14);
    const todayStr = getTodayStr();
    const habitsSummary = habits.map(h => {
      const freqType = h.frequency?.type || (typeof h.frequency === 'string' ? h.frequency : 'daily');
      const category = CATEGORIES.find(c => c.id === h.category)?.name || h.category;
      const base = {
        שם: h.name,
        קטגוריה: category,
        לוח_זמנים: getScheduleLabel(h),
        סטטוס_היום: h.logs?.[todayStr]
          ? 'בוצע'
          : isHabitDueOnDate(h, todayStr)
            ? 'עוד לא בוצע'
            : (freqType === 'weekly' ? 'היעד השבועי כבר הושג' : 'לא מתוכנן להיום')
      };
      if (freqType === 'weekly') {
        base.השלמות_השבוע = `${getCompletionsThisWeek(h.logs)}/${h.frequency?.target || 7}`;
      } else {
        // רצף ימים רצוף רלוונטי רק להרגלים עם ימים קבועים - בהרגל שבועי הוא חסר משמעות
        base.רצף_נוכחי = calculateStreak(h);
        const scheduledDays = last14Days.filter(d => isHabitScheduledOnDate(h, d));
        const completedDays = scheduledDays.filter(d => h.logs && h.logs[d]);
        base['אחוז_עמידה_14_ימים_אחרונים'] = scheduledDays.length > 0
          ? `${Math.round((completedDays.length / scheduledDays.length) * 100)}%`
          : 'אין עדיין מספיק נתונים';
      }
      return base;
    });

    const prompt = `
      הנה סיכום ביצועי ההרגלים שלי (JSON): ${JSON.stringify(habitsSummary)}

      דבר אליי כמו המאמן האישי שלי שמכיר אותי ורוצה שאצליח. כתוב הודעה אחת קצרה (3-4 משפטים), בגוף שני, בלי כותרות, בלי רשימות ובלי אימוג'ים מוגזמים (מקסימום אחד).

      קודם בחר בשקט הרגל מוקד אחד: ההרגל שהכי מתקשה מבין אלה שעוד לא בוצעו היום. אם כל ההרגלים שמתוכננים להיום כבר בוצעו - ההרגל שהכי מתקשה באופן כללי.
      ואז כתוב את ההודעה לפי הסדר הזה:
      1. הכרה אמיתית בהתקדמות שלי - הישג ספציפי מהנתונים (רצף, אחוז עמידה), ולמה זה משמעותי.
      2. מעבר טבעי להרגל המוקד: מה קורה איתו לפי הנתונים, בכנות ובלי להאשים.
      3. צעד אחד קטן וקונקרטי לעשות היום דווקא בהרגל המוקד (מתי, איך, כמה זמן).
      4. משפט קצר שנותן דחיפה לצאת לדרך.
      ההודעה צריכה להיות רצף אחד הגיוני: הצעד שאתה מציע חייב להיות על אותו הרגל שדיברת עליו במשפט 2 - אל תקפוץ להרגל אחר. אל תזכיר הרגלים נוספים מעבר להישג ולהרגל המוקד.
      הכל מבוסס אך ורק על הנתונים. חם ותומך, אבל ישיר ותכל'ס - בלי קלישאות ובלי פילוסופיה.
    `;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "אתה מאמן אישי להרגלים שמלווה את המתאמן שלך יום-יום, כותב בעברית טבעית ומדבר אליו ישירות בגוף שני, כמו מאמן שמכיר אותו אישית. אתה חם, מעודד ומאמין ביכולת שלו, אבל גם כן וישיר - כשמשהו לא עובד אתה אומר את זה ועוזר למצוא דרך קטנה ומעשית לשפר. אתה חוגג הצלחות ספציפיות ולא מחמיא סתם, ואת העצות שלך אפשר ליישם עוד היום. אתה מתבסס רק על הנתונים שסופקו לך ולעולם לא ממציא פרטים שלא נמצאים בהם." }] }
        })
      });
      const data = await response.json();
      // התשובה יכולה להגיע מפוצלת לכמה חלקים - מחברים את כולם (בלי חלקי "חשיבה")
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .filter(p => p.text && !p.thought)
        .map(p => p.text)
        .join('')
        .trim();
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

  const applyFreeDay = (dateStr) => {
    if (countFreeDaysInMonth(streakExemptions, dateStr) >= FREE_DAYS_PER_MONTH) {
      showToast(`ניצלת כבר ${FREE_DAYS_PER_MONTH} ימי חופש בחודש הזה.`);
      return;
    }
    setStreakExemptions(prev => ({
      ...prev,
      // שומרים תירוץ שנדחה כדי שהסרת יום החופש לא תאפשר לשלוח אותו שוב
      [dateStr]: { type: 'freeze', createdAt: new Date().toISOString(), rejectedExcuse: prev[dateStr]?.type === 'rejected' ? prev[dateStr] : prev[dateStr]?.rejectedExcuse }
    }));
    showToast('יום החופש נוצל - הרצף שמור 🛡️');
  };

  const removeExemption = (dateStr) => {
    setStreakExemptions(prev => {
      const next = { ...prev };
      if (prev[dateStr]?.rejectedExcuse) next[dateStr] = prev[dateStr].rejectedExcuse;
      else delete next[dateStr];
      return next;
    });
  };

  // שולח תירוץ ל-Gemini שמחליט אם הוא מצדיק הגנה על הרצף. מחזיר { approved, reply }
  // או { error } - ה-state מתעדכן כאן בכל מקרה של החלטה (אישור או דחייה).
  const submitStreakExcuse = async (dateStr, excuseText) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return { error: 'לא נמצא מפתח API של Gemini.' };

    const missedHabits = habits
      .filter(h => (h.frequency?.type || h.frequency) !== 'weekly' && isHabitScheduledOnDate(h, dateStr) && !(h.logs && h.logs[dateStr]))
      .map(h => h.name);

    const prompt = `
      תאריך: ${dateStr} (${formatDateToHebrew(dateStr)})
      הרגלים שלא בוצעו באותו יום: ${missedHabits.length > 0 ? missedHabits.join(', ') : 'לא צוין'}
      התירוץ של המשתמש: """${excuseText}"""

      החלט אם התירוץ מצדיק לשמור על רצף ההרגלים שלו למרות שלא עמד ביעד באותו יום.
      החזר JSON בלבד בפורמט: {"approved": true/false, "reply": "משפט אחד או שניים בעברית"}
    `;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    // המודל מחזיר לפעמים 503 (עומס) - מנסים שוב עד פעמיים לפני שמוותרים
    const fetchWithRetry = async (options) => {
      for (let attempt = 0; ; attempt++) {
        const response = await fetch(apiUrl, options);
        if (response.status !== 503 || attempt >= 2) return response;
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    };

    try {
      const response = await fetchWithRetry({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "אתה שופט הוגן אבל קפדן של תירוצים באפליקציית הרגלים. אתה מאשר רק סיבות אמיתיות שמנעו באופן סביר את ביצוע ההרגלים: מחלה או פציעה, חג או מועד דתי, אבל או אירוע משפחתי משמעותי, מקרה חירום, אשפוז, מילואים, טיסה או נסיעה ארוכה שמנעה ביצוע. אתה דוחה עצלות, עייפות רגילה, שכחה, 'לא היה לי כוח', 'הייתי עסוק' בלי פירוט, בילויים, ותירוצים מעורפלים או לא רציניים. כשאתה מאשר - תכתוב משהו תומך וקצר. כשאתה דוחה - תסביר בקצרה למה ותעודד לחזור לשגרה, בלי להטיף. תמיד תענה ב-JSON בלבד." }] },
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const verdict = JSON.parse(text);
      if (typeof verdict?.approved !== 'boolean') throw new Error('bad verdict');

      const reply = String(verdict.reply || '');
      setStreakExemptions(prev => ({
        ...prev,
        [dateStr]: { type: verdict.approved ? 'excuse' : 'rejected', reason: excuseText, aiReply: reply, createdAt: new Date().toISOString() }
      }));
      return { approved: verdict.approved, reply };
    } catch {
      return { error: 'לא הצלחתי לקבל תשובה מה-AI. נסה שוב מאוחר יותר.' };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // סנכרון לענן בין הטלפון למחשב (הגדרות והתראות נשארות מקומיות לכל מכשיר)
  const cloudSync = useCloudSync({
    isLoaded,
    values: { habits, journal: journalEntries, water: waterStats, exemptions: streakExemptions },
    setters: { habits: setHabits, journal: setJournalEntries, water: setWaterStats, exemptions: setStreakExemptions },
    showToast
  });

  if (!isLoaded) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600"></div><p className="text-slate-500 font-medium animate-pulse">טוען את המידע שלך...</p></div>;

  return (
    <div dir="rtl" className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-24 md:pb-0 relative overflow-hidden transition-colors duration-300">

        <Toast message={toastMessage} />
        <NoteModal activeNoteModal={activeNoteModal} setActiveNoteModal={setActiveNoteModal} saveNote={saveNote} />
        <CelebrationOverlay show={showCelebration} />
        <SyncConflictModal
          conflict={cloudSync.conflict}
          localHabitsCount={habits.length}
          onResolve={cloudSync.resolveConflict}
        />

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
              cloudSync={cloudSync}
            />

            <DesktopHeader
              cloudSync={cloudSync}
              habits={habits}
              streakExemptions={streakExemptions}
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
                  streakExemptions={streakExemptions}
                  applyFreeDay={applyFreeDay}
                  removeExemption={removeExemption}
                  submitStreakExcuse={submitStreakExcuse}
                />
              )}
              {activeTab === 'journal' && (
                <>
                  <div className="mb-6">
                    <WaterTracker
                      waterStats={waterStats}
                      addWaterIntake={addWaterIntake}
                      removeWaterEntry={removeWaterEntry}
                      setWaterGoal={setWaterGoal}
                    />
                  </div>
                  <DailyJournal
                    habits={habits}
                    journalEntries={journalEntries}
                    saveJournalEntry={saveJournalEntry}
                  />
                </>
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
                  newHabitCustomDays={newHabitCustomDays}
                  setNewHabitCustomDays={setNewHabitCustomDays}
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
                  updateHabit={updateHabit}
                />
              )}
              {activeTab === 'analytics' && (
                <Analytics
                  habits={habits}
                  userStats={userStats}
                  statsData={statsData}
                  heatmapData={heatmapData}
                  streakExemptions={streakExemptions}
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
