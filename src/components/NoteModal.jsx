import { FileText, X } from 'lucide-react';
import { formatDateToHebrew } from '../utils/habitUtils';

export default function NoteModal({ activeNoteModal, setActiveNoteModal, saveNote }) {
  if (!activeNoteModal) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveNoteModal(null)}></div>
       <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white"><FileText className="text-indigo-500" /> יומן התקדמות</h3>
            <button onClick={() => setActiveNoteModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X size={24} /></button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">הוסף הערה או תובנה להרגל עבור התאריך {formatDateToHebrew(activeNoteModal.dateStr)}</p>
          <textarea
            autoFocus
            placeholder="איך הרגשת? מה היה קשה או מוצלח במיוחד?"
            className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-none resize-none mb-4 dark:text-white transition-colors"
            value={activeNoteModal.currentNote || ''}
            onChange={(e) => setActiveNoteModal({...activeNoteModal, currentNote: e.target.value})}
          />
          <button
            onClick={() => saveNote(activeNoteModal.habitId, activeNoteModal.dateStr, activeNoteModal.currentNote)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
          >
            שמור ביומן
          </button>
       </div>
    </div>
  );
}
