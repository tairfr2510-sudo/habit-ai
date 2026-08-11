import {
  Star, Trophy, Target, Flame, CalendarDays, Medal, Activity, Zap
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { formatDateToHebrew, calculateStreak } from '../utils/habitUtils';

export default function Analytics({ habits, userStats, statsData, heatmapData, earnedBadges, isDarkMode }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Gamification Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-5 rounded-2xl border border-yellow-100 dark:border-yellow-900/50 text-center transition-colors">
          <Star className="text-yellow-500 mx-auto mb-2" size={28} />
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">סך הכל XP</h4>
          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{userStats.totalXP}</span>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center transition-colors">
           <Trophy className="text-indigo-500 dark:text-indigo-400 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-400 mb-1">רמה נוכחית</h4>
           <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{userStats.level}</span>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-900/50 text-center transition-colors">
           <Target className="text-green-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-1">הרגלים פעילים</h4>
           <span className="text-2xl font-bold text-green-600 dark:text-green-500">{habits.length}</span>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/50 text-center transition-colors">
           <Flame className="text-orange-500 mx-auto mb-2" size={28} />
           <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-1">שיא רצף</h4>
           <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">{habits.length > 0 ? Math.max(0, ...habits.map(h => calculateStreak(h))) : 0}</span>
        </div>
      </div>

      {/* Heatmap (Github Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors overflow-x-auto">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <CalendarDays className="text-green-500 bg-green-50 dark:bg-green-900/30 p-2 rounded-xl" size={40} />
          שנתון פעילות (90 ימים)
        </h3>
        <div className="flex gap-1.5 min-w-max flex-wrap flex-col h-32 content-start">
           {heatmapData.map((data, index) => {
              // קביעת עוצמת הצבע לפי כמות ההרגלים שהושלמו
              let bgClass = "bg-slate-100 dark:bg-slate-800";
              if (data.count === 1) bgClass = "bg-green-200 dark:bg-green-900/60";
              else if (data.count === 2) bgClass = "bg-green-400 dark:bg-green-700";
              else if (data.count >= 3) bgClass = "bg-green-600 dark:bg-green-500";

              return (
                 <div
                   key={index}
                   className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${bgClass} transition-colors`}
                   title={`${formatDateToHebrew(data.date)}: ${data.count} הרגלים`}
                 />
              );
           })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
           <span>פחות</span>
           <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-200 dark:bg-green-900/60"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-400 dark:bg-green-700"></div>
           <div className="w-3.5 h-3.5 rounded-sm bg-green-600 dark:bg-green-500"></div>
           <span>יותר</span>
        </div>
      </div>

      {/* Badges / Trophy Room */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Medal className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          חדר הישגים ומדליות
        </h3>

        {earnedBadges.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Trophy size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">השלם הרגלים כדי להרוויח את המדליות הראשונות שלך!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map(badge => (
              <div key={badge.id} className={`flex flex-col items-center p-5 rounded-2xl border-2 text-center transition-all hover:scale-105 cursor-default ${badge.color}`}>
                 <badge.icon size={36} className="mb-3 drop-shadow-sm" />
                 <span className="font-bold mb-1">{badge.name}</span>
                 <span className="text-xs opacity-80 font-medium">{badge.desc}</span>
              </div>
            ))}
            <div className="flex flex-col items-center p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 text-center opacity-70">
                 <Medal size={36} className="mb-3" />
                 <span className="font-bold mb-1">מדליה חסויה</span>
                 <span className="text-xs font-medium">המשך להתקדם כדי לגלות</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
          <Activity className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl" size={40} />
          מגמות יומיות (7 ימים אחרונים)
        </h3>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                cursor={{stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4'}}
                contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value}% הושלמו`, 'אחוזי הצלחה']}
                labelFormatter={(label) => `תאריך: ${label}`}
              />
              <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gamification Progress Widget */}
      <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border dark:border-slate-800">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30"><Zap className="text-yellow-400" size={32} /></div>
              <div>
                 <h4 className="font-bold text-xl mb-1">הדרך לרמה {userStats.level + 1}</h4>
                 <p className="text-slate-400 text-sm">חסרים לך עוד {Math.round(userStats.xpRequired - userStats.xpProgress)} נקודות ניסיון לעלות רמה.</p>
              </div>
           </div>

           <div className="w-full md:w-1/2">
             <div className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                <span>רמה {userStats.level}</span><span>רמה {userStats.level + 1}</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-1000" style={{ width: `${userStats.percentToNext}%` }}></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
