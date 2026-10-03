import { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';

const STATUS_LABELS = {
  'signed-out': 'לא מחובר - הנתונים נשמרים רק במכשיר הזה',
  syncing: 'מסנכרן...',
  synced: 'מסונכרן עם הענן',
  offline: 'אין חיבור - יסונכרן כשהאינטרנט יחזור',
  error: 'שגיאה בסנכרון'
};

// כפתור הענן בכותרת: התחברות עם Google כשלא מחוברים, ותפריט קטן עם מצב הסנכרון והתנתקות כשמחוברים
export default function CloudSyncButton({ cloudSync, size = 'md' }) {
  const { user, status, signIn, signOut } = cloudSync;
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const iconSize = size === 'sm' ? 22 : 20;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (user === undefined) return null;

  if (!user) {
    return (
      <button
        onClick={signIn}
        title={STATUS_LABELS['signed-out']}
        className={size === 'sm'
          ? 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1'
          : 'flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'}
      >
        <CloudOff size={iconSize} />
        {size !== 'sm' && <span>התחבר לסנכרון</span>}
      </button>
    );
  }

  const StatusIcon = status === 'syncing' ? RefreshCw
    : status === 'error' ? AlertTriangle
    : status === 'offline' ? CloudOff
    : Cloud;
  const statusColor = status === 'synced' ? 'text-emerald-500'
    : status === 'error' ? 'text-rose-500'
    : 'text-slate-400';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        title={STATUS_LABELS[status]}
        className={`${statusColor} hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors`}
      >
        <StatusIcon size={iconSize} className={status === 'syncing' ? 'animate-spin' : ''} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
          <div className="flex items-center gap-3 mb-3">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />}
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{user.displayName || 'מחובר'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate" dir="ltr">{user.email}</div>
            </div>
          </div>
          <div className={`text-xs font-medium mb-3 flex items-center gap-1.5 ${statusColor}`}>
            <StatusIcon size={14} className={status === 'syncing' ? 'animate-spin' : ''} />
            {STATUS_LABELS[status]}
          </div>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <LogOut size={16} /> התנתק
          </button>
        </div>
      )}
    </div>
  );
}
