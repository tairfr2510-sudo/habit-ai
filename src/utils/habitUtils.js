const formatDateToInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayStr = () => {
  const today = new Date();
  return formatDateToInput(today);
};

export const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDateToInput(d));
  }
  return dates;
};

export const formatDateToHebrew = (dateStr) => {
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(date);
};

// האם ההרגל אמור להתבצע בתאריך נתון - הרגל יומי תמיד, הרגל בתדירות "ימים
// נבחרים" (custom) רק בימים שנבחרו עבורו, והרגל שבועי תמיד false כי אין לו
// יום קבוע (הוא נמדד לפי מכסה שבועית ולא לפי יום ספציפי).
export const isHabitScheduledOnDate = (habit, dateStr) => {
  const freqType = habit?.frequency?.type || (typeof habit?.frequency === 'string' ? habit.frequency : 'daily');
  if (freqType === 'daily') return true;
  if (freqType === 'custom') {
    const days = habit?.frequency?.days;
    if (!Array.isArray(days) || days.length === 0) return true;
    const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
    return days.includes(dayOfWeek);
  }
  return false;
};

const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

// תווית קצרה לתיאור לוח הזמנים של ההרגל, מוצגת בכרטיס ההרגל וברשימת הניהול
export const getScheduleLabel = (habit) => {
  const freqType = habit?.frequency?.type || (typeof habit?.frequency === 'string' ? habit.frequency : 'daily');
  if (freqType === 'weekly') return `${habit?.frequency?.target || 7} פעמים בשבוע`;
  if (freqType === 'custom') {
    const days = Array.isArray(habit?.frequency?.days) ? [...habit.frequency.days].sort((a, b) => a - b) : [];
    if (days.length === 0 || days.length === 7) return 'כל יום';
    if (days.length === 5 && [0, 1, 2, 3, 4].every(d => days.includes(d))) return 'ימי חול';
    if (days.length === 2 && [5, 6].every(d => days.includes(d))) return 'סופ"ש';
    return days.map(d => `יום ${DAY_LETTERS[d]}'`).join(', ');
  }
  return 'כל יום';
};

export const getCompletionsThisWeek = (logs) => {
  const today = new Date();
  const currentDay = today.getDay();
  let count = 0;
  for (let i = 0; i <= currentDay; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToInput(d);
    if (logs && logs[dateStr]) count++;
  }
  return count;
};

// אחוז ההרגלים שהושלמו בתאריך נתון - משמש לציר הזמן ביומן היומי, כדי להציג
// לצד כל רשומה כמה הושלם באותו יום. מחושב רק מתוך הרגלים שהיו אמורים
// להתבצע באותו יום (יומי, או "ימים נבחרים" שהתאריך נכלל בלוח שלהם), כי הרגל
// שבועי לא אמור להיחשב "לא הושלם" בכל יום שהוא לא בוצע בו - הדבר עיוות את
// האחוז כלפי מטה בטעות.
export const getCompletionRateForDate = (habits, dateStr) => {
  if (!habits || habits.length === 0) return 0;
  const dueHabits = habits.filter(h => {
    const freqType = h.frequency?.type || h.frequency;
    return (freqType === 'daily' || freqType === 'custom') && isHabitScheduledOnDate(h, dateStr);
  });
  if (dueHabits.length === 0) return 0;
  const completed = dueHabits.filter(h => h.logs && h.logs[dateStr]).length;
  return Math.round((completed / dueHabits.length) * 100);
};

// בונה את תוכן התזכורת היומית (כותרת/גוף/אייקון) בהתאם למה שעוד לא הושלם
// בתאריך נתון - משמש גם להתראת הדפדפן וגם לתזכורת המתוזמנת באפליקציה הנייטיבית,
// כדי ששתיהן ירשמו את שמות ההרגלים הספציפיים שנשארו במקום הודעה גנרית.
export const getReminderMessage = (habits, dateStr) => {
  const uncompleted = habits.filter(h => {
    const freqType = h.frequency?.type || h.frequency;
    if (freqType === 'weekly') {
      const target = h.frequency?.target || 7;
      return getCompletionsThisWeek(h.logs) < target && (!h.logs || !h.logs[dateStr]);
    }
    return isHabitScheduledOnDate(h, dateStr) && (!h.logs || !h.logs[dateStr]);
  });

  if (uncompleted.length > 0) {
    return {
      title: 'זמן להתעורר! משימות מחכות לך ⏳',
      body: `הרגלים שנשארו להיום: ${uncompleted.map(h => h.name).join(', ')}`,
      icon: '🔔'
    };
  }
  if (habits.length > 0) {
    return { title: 'הכל הושלם! 🌟', body: 'כל הכבוד! סיימת את כל המשימות שלך להיום.', icon: '🏆' };
  }
  return { title: 'זמן להתעורר! משימות מחכות לך ⏳', body: 'בדוק/י אילו הרגלים עדיין לא סימנת היום ב-HabitAI.', icon: '🔔' };
};

// מחשב רצף ימים רצוף עבור הרגל. עבור הרגל בתדירות "ימים נבחרים" (custom),
// ימים שלא נבחרו עבור ההרגל מדולגים לגמרי - הם לא שוברים את הרצף וגם לא
// מקדמים אותו, בדיוק כאילו ההרגל לא היה קיים באותו יום.
export const calculateStreak = (habit) => {
  const logs = habit?.logs;
  const freqType = habit?.frequency?.type || (typeof habit?.frequency === 'string' ? habit.frequency : 'daily');
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToInput(d);

    if (freqType === 'custom' && !isHabitScheduledOnDate(habit, dateStr)) continue;

    if (logs && logs[dateStr]) {
      streak++;
    } else if (i !== 0) {
      break;
    }
  }
  return streak;
};

// סף העמידה שנדרש כדי שיום/שבוע ייחשב "מוצלח" ברצף הכללי
export const STREAK_THRESHOLD = 0.8;
const MAX_STREAK_LOOKBACK_DAYS = 365;

const getFreqType = (habit) =>
  habit?.frequency?.type || (typeof habit?.frequency === 'string' ? habit.frequency : 'daily');

// התאריך שממנו ההרגל "קיים" - המוקדם מבין תאריך היצירה והסימון הראשון שלו
// (למקרה של נתונים מיובאים). הרגל לא נספר בימים שלפני כן, כדי שהוספת הרגל
// חדש לא תשבור רטרואקטיבית את הרצף.
const getHabitStartStr = (habit) => {
  const candidates = Object.keys(habit?.logs || {}).filter(d => habit.logs[d]);
  if (habit?.createdAt) candidates.push(formatDateToInput(new Date(habit.createdAt)));
  return candidates.length > 0 ? candidates.sort()[0] : null;
};

// ימים מוגנים ברצף (streakExemptions): { [dateStr]: { type, ... } }.
// 'freeze' = יום חופש מתוך המכסה החודשית, 'excuse' = תירוץ שה-AI אישר,
// 'rejected' = תירוץ שה-AI דחה (נשמר רק כדי שלא יהיה אפשר לנסח אותו מחדש
// שוב ושוב עד שיאושר - הוא לא מגן על היום).
export const FREE_DAYS_PER_MONTH = 2;

export const isDateExempt = (exemptions, dateStr) => {
  const type = exemptions?.[dateStr]?.type;
  return type === 'freeze' || type === 'excuse';
};

// כמה ימי חופש נוצלו בחודש של התאריך הנתון (תירוצים מאושרים לא נספרים במכסה)
export const countFreeDaysInMonth = (exemptions, dateStr) => {
  const month = dateStr.slice(0, 7);
  return Object.entries(exemptions || {})
    .filter(([d, e]) => d.startsWith(month) && e?.type === 'freeze').length;
};

// כמה הרגלים (יומיים + "ימים נבחרים") היו אמורים להתבצע בתאריך וכמה בוצעו -
// אותו חישוב שעליו מבוסס הרצף היומי
export const getDailyStreakDayStatus = (habits, dateStr) => {
  const due = (habits || []).filter(h => {
    if (getFreqType(h) === 'weekly') return false;
    const start = getHabitStartStr(h);
    return (!start || start <= dateStr) && isHabitScheduledOnDate(h, dateStr);
  });
  const done = due.filter(h => h.logs && h.logs[dateStr]).length;
  return { due: due.length, done, passed: due.length > 0 && done / due.length >= STREAK_THRESHOLD };
};

// רצף יומי כללי: מספר הימים ברציפות שבהם הושלמו לפחות 80% מההרגלים שהיו
// אמורים להתבצע באותו יום (יומיים + "ימים נבחרים"). יום בלי הרגלים מתוכננים
// ויום מוגן (יום חופש / תירוץ מאושר) מדולגים - לא שוברים ולא מקדמים.
// היום הנוכחי לא שובר את הרצף כל עוד הוא עוד לא עבר את הסף.
export const calculateDailyStreak = (habits, exemptions = {}) => {
  if (!(habits || []).some(h => getFreqType(h) !== 'weekly')) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToInput(d);

    if (isDateExempt(exemptions, dateStr)) continue;
    const { due, passed } = getDailyStreakDayStatus(habits, dateStr);
    if (due === 0) continue;

    if (passed) {
      streak++;
    } else if (i !== 0) {
      break;
    }
  }
  return streak;
};

// רצף שבועי כללי: מספר השבועות ברציפות (א'-ש') שבהם הושלמו לפחות 80% מסך
// הביצועים הנדרשים בהרגלים השבועיים (הרגל של 3 פעמים בשבוע = 3 ביצועים;
// ביצועים מעבר ליעד לא מפצים על הרגל אחר). הרגל נספר רק החל מהשבוע המלא
// הראשון שלו. ימים מוגנים מקטינים את היעד השבועי באופן יחסי (למשל 2 ימי
// מחלה = 5/7 מהיעד). השבוע הנוכחי לא שובר את הרצף כל עוד הוא עוד לא עבר את הסף.
export const calculateWeeklyStreak = (habits, exemptions = {}) => {
  const weeklyHabits = (habits || [])
    .filter(h => getFreqType(h) === 'weekly')
    .map(h => ({ habit: h, start: getHabitStartStr(h), target: h.frequency?.target || 7 }));
  if (weeklyHabits.length === 0) return 0;

  let streak = 0;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  for (let w = 0; w < Math.ceil(MAX_STREAK_LOOKBACK_DAYS / 7); w++) {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - w * 7);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return formatDateToInput(d);
    });

    const active = weeklyHabits.filter(({ start: s }) => !s || s <= weekDates[0]);
    if (active.length === 0) continue;

    const activeDays = weekDates.filter(d => !isDateExempt(exemptions, d)).length;
    if (activeDays === 0) continue;

    const required = active.reduce((sum, { target }) => sum + target, 0) * (activeDays / 7);
    const done = active.reduce((sum, { habit, target }) =>
      sum + Math.min(target, weekDates.filter(d => habit.logs && habit.logs[d]).length), 0);

    if (done / required >= STREAK_THRESHOLD) {
      streak++;
    } else if (w !== 0) {
      break;
    }
  }
  return streak;
};
