import { CheckCircle } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 fade-in duration-300">
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl font-medium text-sm flex items-center gap-2 border border-slate-700">
        <CheckCircle size={16} className="text-green-400" /> {message}
      </div>
    </div>
  );
}
