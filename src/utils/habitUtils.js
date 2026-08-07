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

// אחוז ההרגלים היומיים שהושלמו בתאריך נתון - משמש לציר הזמן ביומן היומי,
// כדי להציג לצד כל רשומה כמה הושלם באותו יום. מחושב רק מתוך הרגלים בתדירות
// יומית (כמו בדשבורד), כי הרגל שבועי לא אמור להיחשב "לא הושלם" בכל יום
// שהוא לא בוצע בו - הדבר עיוות את האחוז כלפי מטה בטעות.
export const getCompletionRateForDate = (habits, dateStr) => {
  if (!habits || habits.length === 0) return 0;
  const dailyHabits = habits.filter(h => (h.frequency?.type || h.frequency) === 'daily');
  if (dailyHabits.length === 0) return 0;
  const completed = dailyHabits.filter(h => h.logs && h.logs[dateStr]).length;
  return Math.round((completed / dailyHabits.length) * 100);
};

export const calculateStreak = (habitLogs) => {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToInput(d);

    if (habitLogs && habitLogs[dateStr]) {
      streak++;
    } else if (i !== 0) {
      break;
    }
  }
  return streak;
};
