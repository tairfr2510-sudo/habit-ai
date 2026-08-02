export const CATEGORIES = [
  { id: 'health', name: 'בריאות וכושר', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { id: 'mind', name: 'נפש ולמידה', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  { id: 'productivity', name: 'פרודוקטיביות', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  { id: 'social', name: 'חברה ומשפחה', color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' }
];

export const INITIAL_HABITS = [
  { id: '1', name: 'שתיית 3 ליטר מים', category: 'health', frequency: { type: 'daily' }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
  { id: '2', name: 'מדיטציה 10 דקות', category: 'mind', frequency: { type: 'daily' }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
  { id: '3', name: 'אימון כוח', category: 'health', frequency: { type: 'weekly', target: 3 }, logs: {}, notes: {}, createdAt: new Date().toISOString() },
];

export const MOODS = [
  { emoji: '🤩', label: 'מעולה' },
  { emoji: '🙂', label: 'טוב' },
  { emoji: '😐', label: 'רגיל' },
  { emoji: '😔', label: 'קשה' },
  { emoji: '😫', label: 'ממש קשה' }
];
