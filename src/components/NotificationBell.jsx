import { Bell, X } from 'lucide-react';

const formatNotificationTime = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'הרגע';
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  const diffDays = Math.floor(diffHours / 24);
  return `לפני ${diffDays} ימים`;
};

// כפתור הפעמון + פאנל ההתראות הנשלף. size='sm' לשימוש בהדר הנייד, 'md' לשימוש בהדר הדסקטופ.
export default function NotificationBell({ notifications, unreadCount, isOpen, onToggle, onClose, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <div className="relative" data-notif-panel>
      <button
        onClick={onToggle}
        className={
          isSmall
            ? 'relative text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1'
            : 'relative p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'
        }
      >
        <Bell size={isSmall ? 22 : 24} />
        {unreadCount > 0 && (
          <span
            className={
              isSmall
                ? 'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full'
                : 'absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full'
            }
          ></span>
        )}
      </button>
      {isOpen && (
        <div
          data-notif-panel
          className="absolute left-0 top-full mt-2 w-80 max-w-[90vw] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 dark:text-slate-100">התראות אחרונות</h4>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={18} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">אין עדיין התראות. הפעל/י תזכורות כדי להתחיל לקבל עדכונים.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{n.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.body}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{formatNotificationTime(n.date)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
