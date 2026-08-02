export const getTodayStr = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const formatDateToHebrew = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }).format(date);
};

export const getCompletionsThisWeek = (logs) => {
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

// אחוז ההרגלים שהושלמו בתאריך נתון (מתוך כלל ההרגלים, יומיים ושבועיים כאחד) -
// משמש לציר הזמן ביומן היומי, כדי להציג לצד כל רשומה כמה הושלם באותו יום.
export const getCompletionRateForDate = (habits, dateStr) => {
  if (!habits || habits.length === 0) return 0;
  const completed = habits.filter(h => h.logs && h.logs[dateStr]).length;
  return Math.round((completed / habits.length) * 100);
};

export const calculateStreak = (habitLogs) => {
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
