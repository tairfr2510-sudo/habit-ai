import { PartyPopper } from 'lucide-react';

export default function CelebrationOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>
      <div className="relative z-10 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 duration-500">
         <div className="bg-gradient-to-tr from-yellow-400 to-orange-400 p-6 rounded-full shadow-2xl mb-4 animate-bounce">
            <PartyPopper size={64} className="text-white" />
         </div>
         <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 drop-shadow-sm">כל הכבוד!</h2>
      </div>
    </div>
  );
}
