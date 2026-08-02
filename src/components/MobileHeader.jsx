import { BrainCircuit, Moon, Sun, Star } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function MobileHeader({
  isDarkMode,
  setIsDarkMode,
  userStats,
  notifications,
  unreadCount,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel
}) {
  return (
    <header className="mb-6 md:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
       <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-2xl">
         <BrainCircuit size={28} /><span>HabitAI</span>
       </div>
       <div className="flex items-center gap-3">
         <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
           {isDarkMode ? <Sun size={22}/> : <Moon size={22}/>}
         </button>
         <NotificationBell
           notifications={notifications}
           unreadCount={unreadCount}
           isOpen={showNotificationsPanel}
           onToggle={toggleNotificationsPanel}
           onClose={closeNotificationsPanel}
           size="sm"
         />
         <div className="flex items-center gap-1 font-bold text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
           <Star size={16} className="text-yellow-500 fill-current" />{userStats.level}
         </div>
       </div>
    </header>
  );
}
