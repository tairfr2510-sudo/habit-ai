import { BrainCircuit, Star, LayoutDashboard, Settings, Activity, Moon, Sun } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { id: 'manage', label: 'ניהול הרגלים', icon: Settings },
  { id: 'analytics', label: 'התקדמות', icon: Activity },
];

export default function Sidebar({ activeTab, setActiveTab, userStats, isDarkMode, setIsDarkMode }) {
  return (
    <nav className="fixed bottom-0 w-full md:w-72 md:relative bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none transition-colors">
      <div className="flex md:flex-col justify-around md:justify-start h-20 md:h-screen md:p-6 md:sticky top-0">

        <div className="hidden md:block mb-10">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black text-3xl mb-8">
            <BrainCircuit size={36} /><span>HabitAI</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">{userStats.level}</div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100">פרופיל אישי</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium"><Star size={12} className="text-yellow-500 fill-current" />{userStats.totalXP} XP</div>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col w-full h-full md:h-auto items-center md:items-stretch gap-1 md:gap-3 px-2 md:px-0 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-4 p-2 md:p-4 rounded-2xl transition-all duration-300 font-semibold text-[10px] sm:text-xs md:text-base ${
                activeTab === item.id
                  ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30 border md:border-transparent border-indigo-100 dark:border-indigo-900/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
              }`}
            >
              <item.icon size={24} className={`${activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"} transition-colors`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Dark mode toggle - Desktop */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="hidden md:flex items-center justify-center gap-3 w-full p-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium mt-auto border border-slate-200 dark:border-slate-700"
        >
           {isDarkMode ? <><Sun size={20}/> מצב יום</> : <><Moon size={20}/> מצב לילה</>}
        </button>
      </div>
    </nav>
  );
}
