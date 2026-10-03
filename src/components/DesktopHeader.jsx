import { Flame } from 'lucide-react';
import { calculateDailyStreak, calculateWeeklyStreak } from '../utils/habitUtils';
import NotificationBell from './NotificationBell';
import CloudSyncButton from './CloudSyncButton';

export default function DesktopHeader({
  habits,
  streakExemptions,
  notifications,
  unreadCount,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel,
  cloudSync
}) {
  const dailyStreak = calculateDailyStreak(habits, streakExemptions);
  const weeklyStreak = calculateWeeklyStreak(habits, streakExemptions);

  return (
    <div className="hidden md:flex justify-end mb-8 items-center gap-6">
       <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-colors">
         <span>רצף יומי:</span>
         <span className="text-orange-500 font-bold flex items-center">{dailyStreak} <Flame size={16} className="ml-1"/></span>
         <span className="text-slate-300 dark:text-slate-600">|</span>
         <span>רצף שבועי:</span>
         <span className="text-orange-500 font-bold flex items-center">{weeklyStreak} <Flame size={16} className="ml-1"/></span>
       </div>
       <CloudSyncButton cloudSync={cloudSync} size="md" />
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
