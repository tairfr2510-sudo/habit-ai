import { Flame } from 'lucide-react';
import { calculateStreak } from '../utils/habitUtils';
import NotificationBell from './NotificationBell';

export default function DesktopHeader({
  habits,
  notifications,
  unreadCount,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel
}) {
  const maxStreak = habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h.logs))) : 0;

  return (
    <div className="hidden md:flex justify-end mb-8 items-center gap-6">
       <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors">
         <span>רצף נוכחי מקסימלי:</span>
         <span className="text-orange-500 font-bold flex items-center">{maxStreak} <Flame size={16} className="ml-1"/></span>
       </div>
       <NotificationBell
         notifications={notifications}
         unreadCount={unreadCount}
         isOpen={showNotificationsPanel}
         onToggle={toggleNotificationsPanel}
         onClose={closeNotificationsPanel}
         size="md"
       />
    </div>
  );
}
